import C3D from '../index';
import C3DBabylonAdapter from '../adapters/babylon-adapter';

(C3D as any).Adapter = C3DBabylonAdapter;
export default C3D;