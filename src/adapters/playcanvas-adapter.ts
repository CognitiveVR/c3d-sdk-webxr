// Scene export, dynamic objects, object exports, heatmaps are currently not supported

import * as pc from 'playcanvas';
import C3D from '../index';

class C3DPlayCanvasAdapter {
  private c3d: C3D;

  constructor(c3dInstance: C3D) {
    if (!c3dInstance) {
      throw new Error("A C3D instance must be provided to the PlayCanvas adapter.");
    }
    this.c3d = c3dInstance;
    this.c3d.setDeviceProperty("AppEngine", 'PlayCanvas');
    this.c3d.setDeviceProperty('AppEngineVersion', pc.version);
  }

  private fromVec3(vec3: pc.Vec3): number[] {
    return [vec3.x, vec3.y, vec3.z];
  }

  private fromQuat(quat: pc.Quat): number[] {
    return [quat.x, quat.y, quat.z, quat.w];
  }

  public recordGazeFromCamera(cameraEntity: pc.Entity): void { 
    const position = this.fromVec3(cameraEntity.getPosition());
    const rotation = this.fromQuat(cameraEntity.getRotation());

    const forward = cameraEntity.forward;
    const gaze = this.fromVec3(forward);

    this.c3d.gaze.recordGaze(position, rotation, gaze);
  }
}

export default C3DPlayCanvasAdapter;