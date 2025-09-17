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

  /**
   * Exports the current scene to a GLTF file.
   * @param {THREE.Scene} scene - The Three.js scene to export.
   * @param {string} sceneName - The name of the scene to use for the exported file.
   * @param {THREE.WebGLRenderer} renderer - The renderer instance to capture a screenshot for upload-tools.
   */
  exportGLTF(scene, sceneName, renderer) {
    // Export GLTF and BIN
    const exporter = new GLTFExporter();
    exporter.parse(
      scene,
      (gltf) => {
        const gltfString = JSON.stringify(gltf, null, 2);
        const gltfBlob = new Blob([gltfString], { type: 'application/json' });
        this.downloadBlob(gltfBlob, 'scene.gltf');

        // The binary data (scene.bin) is handled by the GLTFExporter
        // and is usually embedded or referenced within the GLTF file.
        // If it's separate, you would handle it here.
      },
      (error) => {
        console.error('An error happened during GLTF exportation:', error);
      },
      { binary: true } // Export as binary to get a .bin file
    );

    // Create and download settings.json
    const settings = {
      scale: 1,
      sceneName: sceneName,
      sdkVersion: "0.2.2" // Or dynamically get this from your project
    };
    const settingsString = JSON.stringify(settings, null, 2);
    const settingsBlob = new Blob([settingsString], { type: 'application/json' });
    this.downloadBlob(settingsBlob, 'settings.json');

    // Create and download screenshot.png
    renderer.render(scene, camera); // Ensure the scene is rendered
    const screenshotDataUrl = renderer.domElement.toDataURL('image/png');
    this.downloadDataURL(screenshotDataUrl, 'screenshot.png');
  }

  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(link);
  }

  downloadDataURL(dataUrl, filename) {
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export default C3DThreeAdapter;