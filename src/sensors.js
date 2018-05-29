import Network from './network'

class Sensors {
	constructor(core) {
		this.core = core;
		this.network = new Network(core);
		this.allSensors = [];
		this.sensorCount = 0;
		this.jsonPart = 1;
	}

	recordSensor(name, value) {
		let point = [this.core.getTimestamp(), value];
		let sensor = this.allSensors.find(sensor => sensor.name === name);
		//append value to sensor in list if it exists in all sensor list, otherwise list it,.
		sensor ?
			sensor.data.push(point) :
			this.allSensors.push({ name: name, data: [point] });

		this.sensorCount++;
		if (this.sensorCount >= this.core.config.sensorDataLimit) {
			this.sendData();
		}
	}
	sendData() {
		return new Promise((resolve, reject) => {
			if (!this.core.isSessionActive) {
				reject('Sensor.sendData failed: no session active');
				console.log('Sensor.sendData failed: no session active');
				return;
			}
			if (this.allSensors.length === 0) {
				resolve('no sensor data');
				return;
			}

			let payload = {};
			payload['name'] = this.core.userId;
			payload['sessionid'] = this.core.getSessionId();
			payload['timestamp'] = parseInt(this.core.getTimestamp(), 10);
			payload['part'] = this.jsonPart;
			this.jsonPart++;
			payload['data'] = this.allSensors;
			console.log('rip')
			this.network.networkCall('sensors', payload)
				.then(res => (res === 200) ? resolve(res) : reject(res));
			this.sensorCount = 0;
			this.allSensors = [];
		});
	}

	endSession() {
		this.allSensors = [];
		this.jsonPart = 1;
	}
}
export default Sensors;