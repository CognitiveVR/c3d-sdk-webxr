import Network from './network';
import { CognitiveVRAnalyticsCore } from './core';

// Define the structure of a single gaze data point
interface GazeData {
    time: number;
    p: number[]; // Position [x, y, z]
    r: number[]; // Rotation [x, y, z, w]
    o?: string;  // ObjectId (optional)
    g?: number[]; // Gaze point (optional)
}

class GazeTracker {
    private core: CognitiveVRAnalyticsCore;
    private network: Network;
    private playerSnapshotInterval: number | undefined;
    private HMDType: string | undefined;
    public batchedGaze: GazeData[]; // Public to allow tests to inspect length
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

    recordGaze(position: number[], rotation: number[], gazeHit?: { objectId?: string | null; point: number[] } | null, objectId?: string): void {
        let ts = this.core.getTimestamp();
        let data: GazeData = {
            time: ts,
            p: [...position],
            r: [...rotation],
        };

        // If we have a valid gaze hit, add its data to the snapshot
        if (gazeHit) {
            // If an objectId is present, it's a dynamic object hit with local coordinates
            if (gazeHit.objectId) {
                data['o'] = gazeHit.objectId;
                data['g'] = gazeHit.point; // Gaze point in local coordinates
            } else {
                // Otherwise, it's a static object hit with world coordinates
                data['g'] = gazeHit.point; // Gaze point in world coordinates
            }
        } 
        // Handle the case where objectId is passed directly (legacy support based on your tests)
        else if (objectId) {
             data['o'] = objectId;
             // The third argument might be 'point' if it wasn't a complex object
             if (Array.isArray(gazeHit)) {
                 data['g'] = gazeHit;
             }
        }

        // If gazeHit is null and no objectId, it's a "sky" gaze, and we only record position and rotation.

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
            
            // Find difference between current and sent properties
            const allSessionProperties = this.core.sessionProperties || {};
            const sentSessionProperties = this.core.sentSessionProperties || {};
            const newOrChangedProperties: { [key: string]: any } = {};

            for (const key in allSessionProperties) {
                if (allSessionProperties[key] !== sentSessionProperties[key]) {
                    newOrChangedProperties[key] = allSessionProperties[key];
                }
            }

            if (this.batchedGaze.length === 0 && Object.keys(newOrChangedProperties).length === 0) { 
                resolve('No data to send');
                return;
            }

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
                        
            if (Object.keys(newOrChangedProperties).length > 0) { 
                payload['properties'] = newOrChangedProperties; // session properties are sent with gaze stream 
            }

            // console.log("Cognitive3D Gaze Payload:", JSON.stringify(payload, null, 2));

            this.network.networkCall('gaze', payload)
                .then(res => {
                    if (res === 200) {
                        // Success! Update the 'sent' properties
                        this.core.sentSessionProperties = { ...this.core.sentSessionProperties, ...newOrChangedProperties };
                        resolve(res as number);
                    } else {
                        reject(res);
                    }
                });
            this.batchedGaze = [];
        });
    }

    endSession(): void {
        this.batchedGaze = [];
        this.jsonPart = 1;
    }
}

export default GazeTracker;