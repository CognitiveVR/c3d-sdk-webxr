export default C3DThreeAdapter;
declare class C3DThreeAdapter {
    constructor(c3dInstance: any);
    c3d: any;
    fromVector3(vec3: any): any[];
    fromQuaternion(quat: any): any[];
    recordGazeFromCamera(camera: any): void;
}
