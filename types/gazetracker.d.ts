export default GazeTracker;
declare class GazeTracker {
    constructor(core: any);
    core: any;
    network: Network;
    playerSnapshotInterval: any;
    HMDType: any;
    batchedGaze: any[];
    jsonPart: number;
    recordGaze(position: any, rotation: any, gaze: any, objectId: any): void;
    setInterval(interval: any): void;
    setHMDType(hmdtype: any): void;
    sendData(): Promise<any>;
    endSession(): void;
}
import Network from './network';
