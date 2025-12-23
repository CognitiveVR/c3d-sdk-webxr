import Network from './network';
import { CognitiveVRAnalyticsCore } from './core';

interface SensorDataPoint {
    name: string;
    data: Array<[number, any]>; // TODO: Replace 'any' with a specific type for sensor values
}

class Sensors {
    private core: CognitiveVRAnalyticsCore;
    private network: Network;
    public allSensors: SensorDataPoint[];
    public sensorCount: number;
    private jsonPart: number;

    constructor(core: CognitiveVRAnalyticsCore) {
        this.core = core;
        // @ts-ignore
        this.network = new Network(core);
        this.allSensors = [];
        this.sensorCount = 0;
        this.jsonPart = 1;
    }

    recordSensor(name: string, value: any): void { // TODO: Replace 'any' with a specific type
        let point: [number, any] = [this.core.getTimestamp(), value]; // TODO: Replace 'any' with a specific type
        let sensor = this.allSensors.find(sensor => sensor.name === name);
        
        // Append value to sensor in list if it exists, otherwise create new entry
        if (sensor) {
            sensor.data.push(point);
        } else {
            this.allSensors.push({ name: name, data: [point] });
        }

        this.sensorCount++;
        if (this.sensorCount >= this.core.config.sensorDataLimit) {
            this.sendData();
        }
    }

    sendData(): Promise<number | string> {
        return new Promise((resolve, reject) => {
            if (!this.core.isSessionActive) {
                const msg = 'Sensor.sendData failed: no session active';
                console.log(msg);
                reject(msg);
                return;
            }
            if (this.allSensors.length === 0) {
                console.log('no sensor data');
                resolve('no sensor data');
                return;
            }

            let payload: any = {}; // TODO: Replace 'any' with a specific type (e.g. SensorPayload interface)
            payload['name'] = this.core.userId;
            payload['sessionid'] = this.core.getSessionId();
            payload['timestamp'] = parseInt(this.core.getTimestamp() as unknown as string, 10);
            payload['part'] = this.jsonPart;
            this.jsonPart++;
            payload['data'] = this.allSensors;

            this.network.networkCall('sensors', payload)
                .then(res => (res === 200) ? resolve(res as number) : reject(res));
            
            this.sensorCount = 0;
            this.allSensors = [];
        });
    }

    endSession(): void {
        this.allSensors = [];
        this.jsonPart = 1;
    }
}

export default Sensors;