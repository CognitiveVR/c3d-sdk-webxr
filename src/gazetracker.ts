import Network from './network';
import { CognitiveVRAnalyticsCore } from './core';

// Define the structure of a single gaze data point
interface GazeData {
    time: number;
    p: number[]; 
    r: number[]; 
    o?: string;  
    g?: number[]; 
}

// Define the hit result structure
interface GazeHit {
    objectId?: string | null;
    point: number[];
}

class GazeTracker {
    private core: CognitiveVRAnalyticsCore;
    private network: Network;
    private playerSnapshotInterval: number | undefined;
    private HMDType: string | undefined;
    public batchedGaze: GazeData[]; 
    private jsonPart: number;

    constructor(core: CognitiveVRAnalyticsCore) {
        this.core = core;
        // @ts-ignore
        this.network = new Network(core);
        this.playerSnapshotInterval = undefined;
        this.HMDType = undefined;
        this.batchedGaze = [];
        this.jsonPart = 1;
    }

    recordGaze(position: number[], rotation: number[], gazeHit?: GazeHit | number[] | null, objectId?: string): void {
        let ts = this.core.getTimestamp();
        let data: GazeData = {
            time: ts,
            p: [...position],
            r: [...rotation],
        };

        if (gazeHit) {
            if (Array.isArray(gazeHit)) {
                data['g'] = gazeHit;
            } else {
                if (gazeHit.objectId) {
                    data['o'] = gazeHit.objectId;
                    data['g'] = gazeHit.point; 
                } else {
                    data['g'] = gazeHit.point; 
                }
            }
        } 
        else if (objectId) {
             data['o'] = objectId;
        }

        this.batchedGaze = this.batchedGaze.concat([data]);

        if (this.batchedGaze.length >= this.core.config.gazeBatchSize) {
            this.sendData();
        }
    }

    setInterval(interval: number): void {
        this.playerSnapshotInterval = interval;
    }

    setHMDType(hmdtype: string): void {
        this.HMDType = hmdtype;
    }

    sendData(): Promise<number | string> {
        return new Promise((resolve, reject) => {
            if (!this.core.isSessionActive) {
                const msg = 'GazeTracker.sendData failed: no session active';
                console.log(msg);
                reject(msg);
                return;
            }
            
            const newOrChangedProperties = this._getChangedProperties();

            if (this.batchedGaze.length === 0 && Object.keys(newOrChangedProperties).length === 0) { 
                resolve('No data to send');
                return;
            }

            const payload = this._createPayload(newOrChangedProperties);

            this.network.networkCall('gaze', payload)
                .then(res => {
                    if (res === 200) {
                        this.core.sentSessionProperties = { ...this.core.sentSessionProperties, ...newOrChangedProperties };
                        resolve(res as number);
                    } else {
                        reject(res);
                    }
                });
            this.batchedGaze = [];
        });
    }

    private _getChangedProperties(): { [key: string]: any } {
        const allSessionProperties = this.core.sessionProperties || {};
        const sentSessionProperties = this.core.sentSessionProperties || {};
        const newOrChangedProperties: { [key: string]: any } = {};

        for (const key in allSessionProperties) {
            if (allSessionProperties[key] !== sentSessionProperties[key]) {
                newOrChangedProperties[key] = allSessionProperties[key];
            }
        }
        return newOrChangedProperties;
    }

    private _createPayload(properties: any): any {
        let payload: any = {};
        payload['userid'] = this.core.userId;
        payload['timestamp'] = parseInt(this.core.getTimestamp() as unknown as string, 10);
        payload['sessionid'] = this.core.getSessionId();
        if (this.core.lobbyId) { payload['lobbyId'] = this.core.lobbyId; }
        payload['part'] = this.jsonPart;
        this.jsonPart++;
        payload['hmdtype'] = this.HMDType;
        payload['interval'] = this.playerSnapshotInterval;
        payload['data'] = this.batchedGaze;
        payload['properties'] = {};
                    
        if (Object.keys(properties).length > 0) { 
            payload['properties'] = properties; 
        }
        return payload;
    }

    endSession(): void {
        this.batchedGaze = [];
        this.jsonPart = 1;
    }
}

export default GazeTracker;