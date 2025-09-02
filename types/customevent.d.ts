export default CustomEvents;
declare class CustomEvents {
    constructor(core: any);
    core: any;
    network: Network;
    batchedCustomEvents: any[];
    jsonPart: number;
    send(category: any, position: any, properties: any): void;
    sendData(): Promise<any>;
    endSession(): void;
}
import Network from './network';
