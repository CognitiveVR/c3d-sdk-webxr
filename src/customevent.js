class CustomEvents {
	constructor(core) {
		this.core = core;
		this.batchedCustomEvents = [];

	}

	send(category, position, properties) {
		console.log('sending custom event');
		let se = {};
		se["name"] = category;
		se["time"] = this.core.getTimestamp();
		se["point"] = [position[0], position[1], position[2]];
		if (properties) {
			se['properties'] = properties;
		}
		let data = [se];
		this.batchedCustomEvents = this.batchedCustomEvents.concat(data);
		if (this.batchedCustomEvents.length >= this.core.config.CustomEventBatchSize) {
			this.sendData()
		}

	}

	sendData() {
		if (!this.core.isSessionActive) {
			console.log('CustomEvent.sendData failed: no session active');
		} else {
			console.warn('network here, sending Event Batch');
			this.batchedCustomEvents = [];
		}
		// userid:this.c3d.userid,
		// timestamp:this.,
		// sessionid:'',
		// part:'',
		// hmdtype:'',
		// interval:'',
		// this.network.networkCall('gaze', {d:2} )
		// this.sendData()
	}
	endSession() {
		this.batchedCustomEvents = [];
	}
}
// const defaultConfig = new Config();
export default CustomEvents;