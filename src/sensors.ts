import Network from './network';
import core from './core';

/**
 * Defines the structure for a single sensor data point.
 * A tuple containing a timestamp and a numerical value.
 */
export type SensorPoint = [number, number];

/**
 * Defines the structure for a sensor's data, including its name and a collection of data points.
 */
export interface SensorData {
    name: string;
    data: SensorPoint[];
}

/**
 * Defines the structure of the payload sent to the sensors API endpoint.
 */
interface SensorPayload {
    name: string;
    sessionid: string;
    timestamp: number;
    part: number;
    data: SensorData[];
}

class Sensors {
    private core: typeof core;
    private network: Network;
    private allSensors: SensorData[];
    private sensorCount: number;
    private jsonPart: number;

    constructor(coreInstance: typeof core) {
        this.core = coreInstance;
        this.network = new Network(this.core);
        this.allSensors = [];
        this.sensorCount = 0;
        this.jsonPart = 1;
    }

    /**
     * Records a single data point for a named sensor.
     * If the sensor's data limit is reached, it automatically triggers a sendData call.
     * @param {string} name - The name of the sensor (e.g., 'c3d.fps.avg').
     * @param {number} value - The numerical value to record.
     */
    recordSensor(name: string, value: number): void {
        const point: SensorPoint = [this.core.getTimestamp(), value];
        const sensor = this.allSensors.find(s => s.name === name);

        // Append value to the sensor in the list if it exists, otherwise create a new entry.
        if (sensor) {
            sensor.data.push(point);
        } else {
            this.allSensors.push({ name, data: [point] });
        }

        this.sensorCount++;
        if (this.sensorCount >= this.core.config.sensorDataLimit) {
            this.sendData();
        }
    }

    /**
     * Sends the buffered sensor data to the Cognitive3D API.
     * This method is transactional: it captures the current data for sending
     * and immediately resets the buffer to accept new readings.
     * @returns {Promise<number | string>} A promise that resolves with the HTTP status code or an error message.
     */
    async sendData(): Promise<number | string> {
        if (!this.core.isSessionActive()) {
            const message = 'Sensor.sendData failed: no session active';
            console.log(message);
            // Return a resolved promise with a message for inactive sessions.
            return Promise.resolve(message);
        }
        if (this.allSensors.length === 0) {
            const message = 'no sensor data';
            console.log(message);
            return Promise.resolve(message);
        }
        

        // Capture the current data and count that needs to be sent.
        const sensorsToSend = this.allSensors;
        const countToSend = this.sensorCount;
        
        // Immediately reset the instance's state to begin collecting the next batch.
        this.allSensors = [];
        this.sensorCount = 0;
        
        const payload: SensorPayload = {
            name: this.core.userId,
            sessionid: this.core.getSessionId(),
            timestamp: Math.floor(this.core.getTimestamp()),
            part: this.jsonPart++,
            data: sensorsToSend, // 3. Send the captured batch.
        };

        try {
            const res = await this.network.networkCall('sensors', payload);
            return res;
        } catch (err) {
            // On failure, restore the unsent data to the front of the queue to prevent data loss.
            this.allSensors = sensorsToSend.concat(this.allSensors);
            this.sensorCount += countToSend;
            console.error('Sensor.sendData failed, restoring data.', err);
            return Promise.reject(err);
        }
    }

    /**
     * Clears all buffered sensor data and resets counters.
     * Typically called at the end of a session.
     */
    endSession(): void {
        this.allSensors = [];
        this.sensorCount = 0; // Also reset the count on session end.
        this.jsonPart = 1;
    }
}
export default Sensors;

