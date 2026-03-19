import C3D from '../index';
import C3DThreeAdapter from '../adapters/threejs-adapter';

(C3D as any).Adapter = C3DThreeAdapter;
export default C3D;