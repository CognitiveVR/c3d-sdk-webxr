import * as BABYLON from 'babylonjs';
// @ts-ignore
import { GLTF2Export } from 'babylonjs-serializers';
import C3D from '../index';

class C3DBabylonAdapter {
  private c3d: C3D;

  constructor(c3dInstance: C3D) {
    if (!c3dInstance) {
      throw new Error("A C3D instance must be provided to the Babylon.js adapter.");
    }
    this.c3d = c3dInstance;

    this.c3d.setDeviceProperty('AppEngine', 'Babylon.js');
    this.c3d.setDeviceProperty('AppEngineVersion', BABYLON.Engine.Version);
  }

  private fromVector3(vec3: BABYLON.Vector3): number[] {
    return [vec3.x, vec3.y, vec3.z];
  }

  private fromQuaternion(quat: BABYLON.Quaternion): number[] {
    return [quat.x, quat.y, quat.z, quat.w];
  }

  public recordGazeFromCamera(camera: BABYLON.Camera): void {
    const position = this.fromVector3(camera.position);

    // Babylon Camera has 'rotation' (Euler) or 'rotationQuaternion'. 
    // We try to use quaternion if available.
    let rotation = [0, 0, 0, 1];
    
    // Some Babylon cameras (ArcRotate) use rotation by default, others (WebXR) use rotationQuaternion.
    if ((camera as any).rotationQuaternion) {
        rotation = this.fromQuaternion((camera as any).rotationQuaternion);
    } else {
        // Fallback: Convert Euler to Quaternion if needed, or identity.
        // For simplicity in analytics, strict Euler might suffice if Quat is missing,
        // but SDK expects Quat format [x,y,z,w].
        if ((camera as any).rotation) {
             const euler = (camera as any).rotation;
             const quat = BABYLON.Quaternion.RotationYawPitchRoll(euler.y, euler.x, euler.z);
             rotation = this.fromQuaternion(quat);
        }
    }

    const forwardVector = new BABYLON.Vector3(0, 0, 1);
    camera.getDirectionToRef(forwardVector, forwardVector);
    const gaze = this.fromVector3(forwardVector);

    this.c3d.gaze.recordGaze(position, rotation, gaze);
  }

  public exportGLTF(scene: BABYLON.Scene, sceneName: string, engine: BABYLON.Engine): void {
    // Export GLTF and BIN
    GLTF2Export.GLTFAsync(scene, "scene").then((gltf: any) => {
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
     BABYLON.Tools.CreateScreenshot(engine, scene.activeCamera!, { precision: 1.0 }, (data: string) => {
        this.downloadDataURL(data, 'screenshot.png');
    });
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  private downloadDataURL(dataUrl: string, filename: string): void {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.click();
  }
}

export default C3DBabylonAdapter;