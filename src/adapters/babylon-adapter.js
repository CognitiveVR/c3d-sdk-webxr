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
   * Exports the current scene to a GLB file.
   * @param {BABYLON.Scene} scene - The Babylon.js scene to export.
   * @param {string} sceneName - The name of the scene to use for the exported file.
   */
  exportGLTF(scene, sceneName) {
    GLTF2Export.GLBAsync(scene, sceneName).then((glb) => {
      glb.downloadFiles();
    }).catch((error) => {
      console.error('An error happened during GLTF exportation:', error);
    });
  }
}

export default C3DBabylonAdapter;