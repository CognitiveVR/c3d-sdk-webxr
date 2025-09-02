export default C3DWonderlandAdapter;
/**
 * C3DWonderlandAdapter provides a bridge between the Cognitive3D WebXR SDK
 * and the Wonderland Engine, allowing for seamless data collection.
 */
declare class C3DWonderlandAdapter {
    /**
     * Creates an instance of the Wonderland Engine adapter.
     * @param {object} c3dInstance - The active instance of the Cognitive3D SDK.
     * @param {object} wonderlandEngineInstance - The main Wonderland Engine instance (WL).
     */
    constructor(c3dInstance: object, wonderlandEngineInstance: object);
    c3d: object;
    WL: object;
    /**
     * Converts a gl-matrix vec3 to a simple array.
     * @param {vec3} vec - The vector to convert.
     * @returns {number[]} An array [x, y, z].
     */
    fromVector3(vec: vec3): number[];
    /**
     * Converts a gl-matrix quat to a simple array.
     * @param {quat} quat - The quaternion to convert.
     * @returns {number[]} An array [x, y, z, w].
     */
    fromQuaternion(quat: any): number[];
    /**
     * Records gaze data from the main Wonderland Engine camera.
     * It automatically finds the active view/camera from the scene.
     */
    recordGazeFromCamera(): void;
}
