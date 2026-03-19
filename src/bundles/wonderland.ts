import C3D from '../index';
import C3DWonderlandAdapter from '../adapters/wonderland-adapter';

(C3D as any).Adapter = C3DWonderlandAdapter;
export default C3D;