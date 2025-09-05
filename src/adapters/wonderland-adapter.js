import { vec3 } from 'gl-matrix'; // Wonderland Engine uses gl-matrix for vector math

/**
 * C3DWonderlandAdapter provides a bridge between the Cognitive3D WebXR SDK
 * and the Wonderland Engine, allowing for seamless data collection.
 */
class C3DWonderlandAdapter {
  /**
   * Creates an instance of the Wonderland Engine adapter.
   * @param {object} c3dInstance - The active instance of the Cognitive3D SDK.
   * @param {object} wonderlandEngineInstance - The main Wonderland Engine instance (WL).
   */
  constructor(c3dInstance, wonderlandEngineInstance) {
    if (!c3dInstance) {
      throw new Error("A C3D instance must be provided to the Wonderland Engine adapter.");
    }
    if (!wonderlandEngineInstance) {
      throw new Error("The Wonderland Engine instance (WL) must be provided.");
    }
    this.c3d = c3dInstance;
    this.WL = wonderlandEngineInstance;

    // Set engine properties for the session data
    this.c3d.setDeviceProperty('AppEngine', 'Wonderland Engine');

    const version = this.WL.runtimeVersion; // Object with major, minor, patch
    const versionString = `${version.major}.${version.minor}.${version.patch}`;
    this.c3d.setDeviceProperty('AppEngineVersion', versionString);
  }

  /**
   * Converts a gl-matrix vec3 to a simple array.
   * @param {vec3} vec - The vector to convert.
   * @returns {number[]} An array [x, y, z].
   */
  fromVector3(vec) {
    return [vec[0], vec[1], vec[2]];
  }

  /**
   * Converts a gl-matrix quat to a simple array.
   * @param {quat} quat - The quaternion to convert.
   * @returns {number[]} An array [x, y, z, w].
   */
  fromQuaternion(quat) {
    return [quat[0], quat[1], quat[2], quat[3]];
  }

  /**
   * Records gaze data from the main Wonderland Engine camera.
   * It automatically finds the active view/camera from the scene.
   */
  recordGazeFromCamera() {
    // In Wonderland, the main camera is typically the object associated with the first active view.
    const cameraObject = this.WL.scene.activeViews[0]?.object;
    if (!cameraObject) {
        console.warn("Cognitive3D: Could not find an active camera in the Wonderland scene.");
        return;
    }

    // Get world-space position and rotation using Wonderland API
    const position = cameraObject.getTranslationWorld([]);
    const rotation = cameraObject.getRotationWorld([]);

    // Calculate the forward vector from the camera's rotation
    const forwardVector = [0, 0, -1]; // Base forward vector in 3D graphics
    const gaze = vec3.create(); // Create a new gl-matrix vector to store the result
    vec3.transformQuat(gaze, forwardVector, rotation);

    // Record the data using the core SDK method
    this.c3d.gaze.recordGaze(
        this.fromVector3(position),
        this.fromQuaternion(rotation),
        this.fromVector3(gaze)
    );
  }
}

export default C3DWonderlandAdapter;