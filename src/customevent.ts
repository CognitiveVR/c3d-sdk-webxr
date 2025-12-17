import Network from './network';
// We import the Class type to use in the constructor type definition
import { CognitiveVRAnalyticsCore } from './core';

// Define the shape of a single event payload
interface CustomEventData {
    name: string;
    time: number;
    point: number[];
    lobbyId: string;
    properties?: object;
}

class CustomEvents {
    private core: CognitiveVRAnalyticsCore;
    private network: Network;
    // Public to allow access from tests if needed, or stick to private if strictly internal
    public batchedCustomEvents: CustomEventData[]; 
    private jsonPart: number;

    constructor(core: CognitiveVRAnalyticsCore) {
        this.core = core;
        // @ts-ignore: Network expects the default export type, but they are compatible at runtime
        this.network = new Network(core);
        this.batchedCustomEvents = [];
        this.jsonPart = 1;
    }

    send(category: string, position: number[], properties?: object): void {
        let data: CustomEventData = {
            name: category,
            time: this.core.getTimestamp(),
            point: [position[0], position[1], position[2]],
            lobbyId: this.core.lobbyId
        };
        
        if (properties) { 
            data.properties = properties; 
        }

        this.batchedCustomEvents = this.batchedCustomEvents.concat([data]);
        
        if (this.batchedCustomEvents.length >= this.core.config.customEventBatchSize) {
            this.sendData();
        }
    }

    sendData(): Promise<number | string> {
        return new Promise((resolve, reject) => {
            if (!this.core.isSessionActive) {
                const msg = 'CustomEvent.sendData failed: no session active';
                console.log(msg);
                resolve(msg);
                return;
            } else {
                let payload: any = {};
                payload['userid'] = this.core.userId;
                payload['timestamp'] = parseInt(this.core.getTimestamp() as unknown as string, 10); // getTimestamp returns number, but existing logic parsed it
                payload['sessionid'] = this.core.getSessionId();
                payload['part'] = this.jsonPart;
                this.jsonPart++;
                payload['data'] = this.batchedCustomEvents;
                
                this.network.networkCall('events', payload)
                    .then(res => (res === 200) ? resolve(res as number) : reject(res));
                
                this.batchedCustomEvents = [];
            }
        });
    }

    endSession(): void {
        this.batchedCustomEvents = [];
        //restart counter on end session
        this.jsonPart = 1;
    }
}

export default CustomEvents;