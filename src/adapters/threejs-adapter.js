import * as THREE from 'three';

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
}

export default C3DThreeAdapter;