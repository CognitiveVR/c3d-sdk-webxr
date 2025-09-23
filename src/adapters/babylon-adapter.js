import * as BABYLON from 'babylonjs';
import { GLTF2Export } from 'babylonjs-serializers';

class C3DBabylonAdapter {
  constructor(c3dInstance) {
    if (!c3dInstance) {
      throw new Error("A C3D instance must be provided to the Babylon.js adapter.");
    }
    this.c3d = c3dInstance;

    this.c3d.setDeviceProperty('AppEngine', 'Babylon.js');
    this.c3d.setDeviceProperty('AppEngineVersion', BABYLON.Engine.Version);
  }

  fromVector3(vec3) {
    return [vec3.x, vec3.y, vec3.z];
  }
  fromQuaternion(quat) {
    return [quat.x, quat.y, quat.z, quat.w];
  }

  recordGazeFromCamera(camera) { // Babylon camera
    const position = this.fromVector3(camera.position);

    const rotation = camera.rotationQuaternion
      ? this.fromQuaternion(camera.rotationQuaternion)
      : [0, 0, 0, 1];

    const forwardVector = new BABYLON.Vector3(0, 0, 1);
    camera.getDirectionToRef(forwardVector, forwardVector);
    const gaze = this.fromVector3(forwardVector);

    this.c3d.gaze.recordGaze(position, rotation, gaze);
  }

  /**
   * Exports the current scene to a GLTF file.
   * @param {BABYLON.Scene} scene - The Babylon.js scene to export.
   * @param {string} sceneName - The name of the scene to use for the exported file.
   * @param {BABYLON.Engine} engine - The Babylon engine instance for screenshots.
   */
  exportGLTF(scene, sceneName, engine) {
    // Export GLTF and BIN
    GLTF2Export.GLTFAsync(scene, "scene").then((gltf) => {
        gltf.downloadFiles();
    });

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
     BABYLON.Tools.CreateScreenshot(engine, scene.activeCamera, { precision: 1.0 }, (data) => {
        this.downloadDataURL(data, 'screenshot.png');
    });
  }

  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

   downloadDataURL(dataUrl, filename) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.click();
  }
}

export default C3DBabylonAdapter;