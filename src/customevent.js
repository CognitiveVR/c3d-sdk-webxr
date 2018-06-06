import Network from './network';
class CustomEvents {
	constructor(core) {
		this.core = core;
		this.network = new Network(core);
		this.batchedCustomEvents = [];
		this.jsonPart = 1;
	}

	send(category, position, properties) {
		let data = {};
		data['name'] = category;
		data['time'] = this.core.getTimestamp();
		data['point'] = [position[0], position[1], position[2]];
		data['lobbyId'] = this.core.lobbyId;
		if (properties) { data['properties'] = properties; }
		this.batchedCustomEvents = this.batchedCustomEvents.concat([data]);
		if (this.batchedCustomEvents.length >= this.core.config.customEventBatchSize) {
			this.sendData();
		}
	}

	sendData() {
		return new Promise((resolve, reject) => {
			if (!this.core.isSessionActive) {
				resolve('CustomEvent.sendData failed: no session active');
				console.log('CustomEvent.sendData failed: no session active');
				return;
			} else {
				let payload = {};
				payload['userid'] = this.core.userId;
				payload['timestamp'] = parseInt(this.core.getTimestamp(), 10);
				payload['sessionid'] = this.core.getSessionId();
				payload['part'] = this.jsonPart;
				this.jsonPart++;
				payload['data'] = this.batchedCustomEvents;
				this.network.networkCall('events', payload)
					.then(res => (res === 200) ? resolve(res) : reject(res));
				this.batchedCustomEvents = [];
			}
		})
	};
	endSession() {
		this.batchedCustomEvents = [];
		//restart counter on end session
		this.jsonPart = 1;
	};
}
export default CustomEvents;