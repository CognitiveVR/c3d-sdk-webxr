// Currently no babylon sample application exists, todo in future
// Needs testing once a sample app is created

import * as BABYLON from 'babylonjs';
// @ts-ignore
import { GLTF2Export } from 'babylonjs-serializers';
import C3D from '../index';

interface GLTFExportResult {
    downloadFiles: () => void;
}

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
    
    // Cast to TargetCamera, which contains the rotation properties
    const targetCamera = camera as BABYLON.TargetCamera;

    if (targetCamera.rotationQuaternion) {
        rotation = this.fromQuaternion(targetCamera.rotationQuaternion);
    } else {
        // Fallback: Convert Euler to Quaternion if needed, or identity.
        if (targetCamera.rotation) {
             const euler = targetCamera.rotation;
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
    GLTF2Export.GLTFAsync(scene, "scene").then((gltf: GLTFExportResult) => {
        gltf.downloadFiles();
    });

    // Create and download settings.json
    const settings = {
        scale: 1,
        sceneName: sceneName,
        sdkVersion: typeof __SDK_VERSION__ !== 'undefined' ? __SDK_VERSION__ : 'dev'
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