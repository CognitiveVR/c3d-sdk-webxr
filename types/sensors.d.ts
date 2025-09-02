export default Sensors;
declare class Sensors {
    constructor(core: any);
    core: any;
    network: Network;
    allSensors: any[];
    sensorCount: number;
    jsonPart: number;
    recordSensor(name: any, value: any): void;
    sendData(): Promise<any>;
    endSession(): void;
}
import Network from './network';
