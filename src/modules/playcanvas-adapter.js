import * as pc from 'playcanvas';

class C3DPlayCanvasAdapter {
  constructor(c3dInstance) {
    if (!c3dInstance) {
      throw new Error("A C3D instance must be provided to the PlayCanvas adapter.");
    }
    this.c3d = c3dInstance;
    this.c3d.setDeviceProperty('c3d.app.engine', 'PlayCanvas');
  }

  fromVec3(vec3) {
    return [vec3.x, vec3.y, vec3.z];
  }

  fromQuat(quat) {
    return [quat.x, quat.y, quat.z, quat.w];
  }

  recordGazeFromCamera(cameraEntity) { // NOTE: In PlayCanvas, position and rotation are on the entity, not the camera component
    const position = this.fromVec3(cameraEntity.getPosition());
    const rotation = this.fromQuat(cameraEntity.getRotation());

    const forward = cameraEntity.forward;
    const gaze = this.fromVec3(forward);

    this.c3d.gaze.recordGaze(position, rotation, gaze);
  }
}

export default C3DPlayCanvasAdapter;