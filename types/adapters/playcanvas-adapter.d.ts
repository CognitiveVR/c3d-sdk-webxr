export default C3DPlayCanvasAdapter;
declare class C3DPlayCanvasAdapter {
    constructor(c3dInstance: any);
    c3d: any;
    fromVec3(vec3: any): any[];
    fromQuat(quat: any): any[];
    recordGazeFromCamera(cameraEntity: any): void;
}
