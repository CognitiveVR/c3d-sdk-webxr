import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import JSZip from 'jszip';

class C3DThreeAdapter {
  constructor(c3dInstance) {
    if (!c3dInstance) {
      throw new Error("A C3D instance must be provided to the Three.js adapter.");
    }
    this.c3d = c3dInstance;

    this.c3d.setDeviceProperty('AppEngine', 'Three.js');
    this.c3d.setDeviceProperty('AppEngineVersion', THREE.REVISION);
  }

  fromVector3(vec3) { // translate a THREE.Vector3 to a simple array
    return [vec3.x, vec3.y, vec3.z];
  }
  fromQuaternion(quat) { // THREE.Quaternion to a simple array
    return [quat.x, quat.y, quat.z, quat.w];
  }
  recordGazeFromCamera(camera) {
      const position = this.fromVector3(camera.position);
      const rotation = this.fromQuaternion(camera.quaternion);
      const forward = new THREE.Vector3(0, 0, -1);
      forward.applyQuaternion(camera.quaternion);
      const gaze = this.fromVector3(forward);

      this.c3d.gaze.recordGaze(position, rotation, gaze);
  }

  /**
   * Initializes and starts all tracking functionalities.
   * @param {THREE.WebGLRenderer} renderer - The main renderer instance.
   * @param {THREE.Camera} camera - The ThreeJS camera used for raycasting.
   * @param {THREE.Group} interactableGroup - The group containing all dynamic objects.
   * @param {function} [userRenderFn=null] - The original render function.
   */
  startTracking(renderer, camera, interactableGroup, userRenderFn = null) {
    if (!renderer || !camera || !interactableGroup) {
      console.error("Cognitive3D: renderer, camera, and interactableGroup must be provided to startTracking.");
      return;
    }

    // Consolidate Gaze Setup
    this._setupGazeRaycasting(camera, interactableGroup);
    console.log('Cognitive3D: Gaze raycasting enabled.');

    // Automate Dynamic Object Registration
    interactableGroup.children.forEach(child => {
      if (child.userData.isDynamic && child.userData.c3dId) {
        const options = {
          positionThreshold: child.userData.positionThreshold, 
          rotationThreshold: child.userData.rotationThreshold  
        };
        this.trackDynamicObject(child, child.userData.c3dId, options);
        console.log(`Cognitive3D: Automatically started tracking dynamic object: ${child.name}`);
      }
    });

    // Hook into the Render Loop
    const renderLoop = (timestamp, frame) => {
      if (userRenderFn) {
        userRenderFn(timestamp, frame);
      }
      this.updateTrackedObjectTransforms();
    };

    renderer.setAnimationLoop(renderLoop);
    console.log('Cognitive3D: Hooked into the render loop to automate transform updates.');
  }

  /**
   * (Internal) Sets up the gaze raycaster.
   * @private
   */
  _setupGazeRaycasting(camera, interactableGroup) {
    const raycaster = new THREE.Raycaster();
    raycaster.far = 1000; // Raycast maximum distance
    this.c3d.gazeRaycaster = () => {
        raycaster.setFromCamera({ x: 0, y: 0 }, camera);
        const intersects = raycaster.intersectObjects(interactableGroup.children, true);
        
        if (intersects.length > 0) {
            const intersection = intersects[0];
            const intersectedObject = intersection.object;
            let targetObject = intersectedObject;
            let isDynamic = false;

            while (targetObject) {
                if (targetObject.userData.c3dId) {
                    isDynamic = true;
                    break;
                }
                if (!targetObject.parent || targetObject.parent === interactableGroup) {
                    break; 
                }
                targetObject = targetObject.parent;
            }

            if (isDynamic) {  // Dynamic object hit: return intersection in object local coordinates
                const worldPoint = intersection.point.clone();
                targetObject.worldToLocal(worldPoint);
                worldPoint.x *= 1;
                worldPoint.z *= -1;
                
                return {
                    objectId: targetObject.userData.c3dId,
                    point: [worldPoint.x, worldPoint.y, worldPoint.z]
                };
            } else { // Scene Geometry hit: return intersection world coordinates
                const worldPoint = intersection.point;
                return {
                    objectId: null,
                    point: [worldPoint.x, worldPoint.y, worldPoint.z]
                };
            }
        }
        return null; // No intersection or skybox 
    };
  }

trackDynamicObject(object, id, options) {
      // Core SDK's generic method to register the object.
      this.c3d.dynamicObject.trackObject(id, object, options);

      // Add engine-specific data to the entry.
      const tracked = this.c3d.dynamicObject.trackedObjects.get(id);
      if (tracked) {
          tracked.lastPosition = new THREE.Vector3(Infinity, Infinity, Infinity);
          tracked.lastRotation = new THREE.Quaternion(Infinity, Infinity, Infinity, Infinity);
          tracked.lastScale = new THREE.Vector3(Infinity, Infinity, Infinity);
      }
}

updateTrackedObjectTransforms() { 
    const dynamicObjectManager = this.c3d.dynamicObject;

    dynamicObjectManager.trackedObjects.forEach((tracked, id) => {
        if (!tracked.lastPosition) return;

        const { object, lastPosition, lastRotation, lastScale, positionThreshold, rotationThreshold } = tracked;

        object.updateWorldMatrix(true, false);

        const worldPosition = new THREE.Vector3();
        const worldQuaternion = new THREE.Quaternion();
        const worldScale = new THREE.Vector3();

        object.matrixWorld.decompose(worldPosition, worldQuaternion, worldScale);

        const positionChanged = worldPosition.distanceTo(lastPosition) > positionThreshold;
        const rotationChanged = worldQuaternion.angleTo(lastRotation) * (180 / Math.PI) > rotationThreshold;
        const scaleChanged = !worldScale.equals(lastScale);

        if (positionChanged || rotationChanged || scaleChanged) {
            
            // Conversion
            
            // Flip z 
            const correctedPosition = worldPosition.clone();
            correctedPosition.z *= -1;

            // Negate the Z and W components of quaternion.
            const correctedQuaternion = worldQuaternion.clone();
            correctedQuaternion.z *= -1; 
            correctedQuaternion.w*= -1;

            // Send the corrected data to the snapshot.
            dynamicObjectManager.addSnapshot(id, correctedPosition.toArray(), correctedQuaternion.toArray(), worldScale.toArray());
            
            // Update the last known state with the original world-space values for the next comparison.
            lastPosition.copy(worldPosition);
            lastRotation.copy(worldQuaternion);
            lastScale.copy(worldScale);
        }
    });
}

  // Helper methods for file writing
  async _ensureExportDir() {
      if (this.exportDirHandle) return this.exportDirHandle;
      if (!window.showDirectoryPicker) return null;
      try {
          const root = await window.showDirectoryPicker();
          const sceneDir = await root.getDirectoryHandle("scene", { create: true });
          const perm = await sceneDir.requestPermission?.({ mode: "readwrite" });
          if (perm && perm !== "granted") throw new Error("Write permission denied");
          this.exportDirHandle = sceneDir;
          return sceneDir;
      } catch (err) {
          console.error("Error getting directory handle:", err);
          return null;
      }
  }

  async _writeFile(dirHandle, filename, blob) {
      const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
  }

  _downloadBlob(blob, filename) {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
          URL.revokeObjectURL(a.href);
          a.remove();
      }, 800);
  }

  /**
   * Exports the current scene to GLTF and other necessary files for Cognitive3D.
   * @param {THREE.Scene} scene - The Three.js scene to export.
   * @param {string} sceneName - The name of the scene to use for the exported file.
   * @param {THREE.WebGLRenderer} renderer - The renderer instance to capture a screenshot.
   * @param {THREE.Camera} camera - The camera used for the screenshot.
   */
  exportScene(scene, sceneName, renderer, camera) {
      const exporter = new GLTFExporter();

      // New root object for the export
      const exportRoot = new THREE.Group();
      exportRoot.name = "CoordinateSystemFix";
      exportRoot.add(scene); // 'scene' is the exportGroup from the app

      // Apply the X and Z-axis flip to the new root
      exportRoot.scale.z = -1;
      exportRoot.scale.x = -1;

      // Export the new root object 
      exporter.parse(
          exportRoot, // Pass the wrapper to the exporter
          async (gltf) => {

              const dir = await this._ensureExportDir();

              // Handle the binary .bin file
              const prefix = "data:application/octet-stream;base64,";
              const uri = gltf.buffers?.[0]?.uri || "";
              let binBlob = null;
              if (uri.startsWith(prefix)) {
                  const b64 = uri.slice(prefix.length);
                  const raw = atob(b64);
                  const bytes = new Uint8Array(raw.length);
                  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
                  binBlob = new Blob([bytes.buffer], { type: "application/octet-stream" });
                  gltf.buffers[0].uri = "scene.bin";
              }

              const gltfBlob = new Blob([JSON.stringify(gltf, null, 2)], { type: "model/gltf+json" });
              const settings = {
                  scale: 1,
                  sceneName: sceneName,
                  sdkVersion: "2.2.3"
              };
              const settingsBlob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
              const screenshotDataUrl = renderer.domElement.toDataURL('image/png');
              const screenshotBlob = await (await fetch(screenshotDataUrl)).blob();

              if (dir) {
                  if (binBlob) await this._writeFile(dir, "scene.bin", binBlob);
                  await this._writeFile(dir, "scene.gltf", gltfBlob);
                  await this._writeFile(dir, "settings.json", settingsBlob);
                  await this._writeFile(dir, "screenshot.png", screenshotBlob);
                  console.log("Exported scene files to the 'scene' directory.");
              } else {
                    console.warn("File System Access API not available; falling back to zip download.");
                    const zip = new JSZip();
                    if (binBlob) zip.file("scene.bin", binBlob);
                    zip.file("scene.gltf", gltfBlob);
                    zip.file("settings.json", settingsBlob);
                    zip.file("screenshot.png", screenshotBlob);

                    const zipBlob = await zip.generateAsync({ type: "blob" });
                    this._downloadBlob(zipBlob, "scene-export.zip");
              }
          },
          (err) => {
              console.error("GLTF export failed:", err);
          }, // binary:false results in both .gltf and .bin files 
          { binary: false, embedImages: true, onlyVisible: true, truncateDrawRange: true, maxTextureSize: 4096 }
      );
  }
    /**
   * Exports a specific Three.js object to the required GLTF, BIN, and PNG format.
   * @param {THREE.Object3D} objectToExport - The object you want to export.
   * @param {string} objectName - The base name for the exported files (e.g., "MyCube").
   * @param {THREE.WebGLRenderer} renderer - The main renderer instance.
   * @param {THREE.Camera} camera - The camera to use for the screenshot.
   */
  async exportObject(objectToExport, objectName, renderer, camera) {
    // Screenshot 
    const originalScene = renderer.xr.isPresenting ? renderer.xr.getScene() : camera.parent;
    const tempScene = new THREE.Scene();
    tempScene.background = new THREE.Color(0xe0e0e0); // Neutral grey background
    const tempLight = new THREE.AmbientLight(0xffffff, 3.0); // Bright, even lighting
    tempScene.add(tempLight);

    const objectClone = objectToExport.clone();

    // Center the object for screenshot
    const box = new THREE.Box3().setFromObject(objectClone);
    const center = box.getCenter(new THREE.Vector3());
    objectClone.position.sub(center); 
    tempScene.add(objectClone);

    // Temporarily render the isolated object
    renderer.render(tempScene, camera);
    const screenshotDataUrl = renderer.domElement.toDataURL('image/png');
    const screenshotBlob = await (await fetch(screenshotDataUrl)).blob();

    // Restore the original scene rendering if needed
    if (originalScene) {
        renderer.render(originalScene, camera);
    }
    
    // Export the object to GLTF and BIN
    const exporter = new GLTFExporter();

    // Export a clone to avoid modifying the original object in the scene
    const exportRoot = new THREE.Group();
    exportRoot.add(objectToExport.clone());

    exporter.parse(
      exportRoot,
      async (gltf) => {
        const dir = await this._ensureExportDir();
        const prefix = "data:application/octet-stream;base64,";
        const uri = gltf.buffers?.[0]?.uri || "";
        let binBlob = null;
        
        if (uri.startsWith(prefix)) {
          const b64 = uri.slice(prefix.length);
          const raw = atob(b64);
          const bytes = new Uint8Array(raw.length);
          for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
          binBlob = new Blob([bytes.buffer], { type: "application/octet-stream" });
          // Name the binary file according to the object name
          gltf.buffers[0].uri = `${objectName}.bin`;
        }

        const gltfBlob = new Blob([JSON.stringify(gltf, null, 2)], { type: "model/gltf+json" });
        
        if (dir) {
          if (binBlob) await this._writeFile(dir, `${objectName}.bin`, binBlob);
          await this._writeFile(dir, `${objectName}.gltf`, gltfBlob);
          await this._writeFile(dir, `${objectName}.png`, screenshotBlob);
          console.log(`Exported object files for '${objectName}' to the 'scene' directory.`);
        } else {
          console.warn("File System Access API not available; falling back to zip download.");
          const zip = new JSZip();
          if (binBlob) zip.file(`${objectName}.bin`, binBlob);
          zip.file(`${objectName}.gltf`, gltfBlob);
          zip.file(`${objectName}.png`, screenshotBlob);
          const zipBlob = await zip.generateAsync({ type: "blob" });
          this._downloadBlob(zipBlob, `${objectName}-export.zip`);
        }
      },
      (err) => {
        console.error(`GLTF export for ${objectName} failed:`, err);
      },
      { binary: false } // Ensures we get separate .gltf and .bin files
    );
  }
}

export default C3DThreeAdapter;