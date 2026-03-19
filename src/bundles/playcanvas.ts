import C3D from '../index';
import C3DPlayCanvasAdapter from '../adapters/playcanvas-adapter';

(C3D as any).Adapter = C3DPlayCanvasAdapter;
export default C3D;