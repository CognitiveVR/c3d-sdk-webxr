import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

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

      // Export GLTF and BIN
      exporter.parse(
          scene,
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

              // Handle the .gltf file
              const gltfBlob = new Blob([JSON.stringify(gltf, null, 2)], { type: "model/gltf+json" });

              // Create and handle settings.json
              const settings = {
                  scale: 1,
                  sceneName: sceneName,
                  sdkVersion: "2.2.3" 
              };
              const settingsBlob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });

              // Create and handle screenshot.png
              renderer.render(scene, camera);
              const screenshotDataUrl = renderer.domElement.toDataURL('image/png');
              const screenshotBlob = await (await fetch(screenshotDataUrl)).blob();


              // Save or download all files
              if (dir) {
                  if (binBlob) await this._writeFile(dir, "scene.bin", binBlob);
                  await this._writeFile(dir, "scene.gltf", gltfBlob);
                  await this._writeFile(dir, "settings.json", settingsBlob);
                  await this._writeFile(dir, "screenshot.png", screenshotBlob);
                  console.log("Exported scene files to the 'scene' directory.");
              } else {
                  console.warn("File System Access API not available; falling back to downloads.");
                  if (binBlob) this._downloadBlob(binBlob, "scene.bin");
                  this._downloadBlob(gltfBlob, "scene.gltf");
                  this._downloadBlob(settingsBlob, "settings.json");
                  this._downloadBlob(screenshotBlob, "screenshot.png");
              }
          },
          (err) => console.error("GLTF export failed:", err),
          // Use binary: false to get a separate .bin file
          { binary: false, embedImages: true, onlyVisible: true, truncateDrawRange: true, maxTextureSize: 4096 }
      );
  }
}

export default C3DThreeAdapter;