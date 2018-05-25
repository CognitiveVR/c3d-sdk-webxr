import Network from './network'
class GazeTracker {
	constructor(core) {
		this.core = core;
		this.network = new Network(core);
		this.playerSnapshotInterval = undefined;
		this.HMDType = undefined;
		this.batchedGaze = [];
		this.jsonPart = 1;
	}
	recordGaze(position, rotation, gaze, objectId) {
		let ts = this.core.getTimestamp();
		let data = {
			//TODO: need millidataconds precision ts 
			time: ts,
			p: [...position],
			r: [...rotation],
		};

		if (gaze) { data['g'] = [...gaze]; }
		if (objectId) { data['o'] = objectId; }

		this.batchedGaze = this.batchedGaze.concat([data]);

		if (this.batchedGaze.length >= this.core.config.gazeBatchSize) {
			this.sendData();
		}
	}

	setInterval(interval) {
		this.playerSnapshotInterval = interval;
	}

	setHMDType(hmdtype) {
		this.HMDType = hmdtype;
	}

	sendData() {
		return new Promise((res) => {
			if (!this.core.isSessionActive) {
				console.log('GazeTracker.sendData failed: no session active');
				return;
			}
			let dproperties = this.core.newDeviceProperties;
			let uproperties = this.core.newUserProperties;
			if (this.batchedGaze.length === 0 && dproperties.length === 0 && uproperties.length === 0) {
				return;
			}

			let payload = {};

			payload['userid'] = this.core.userId;
			payload['timestamp'] = parseInt(this.core.getTimestamp(), 10);
			payload['sessionid'] = this.core.getSessionId();
			payload['part'] = this.jsonPart;
			this.jsonPart++;
			payload['hmdtype'] = this.HMDType;
			payload['interval'] = this.playerSnapshotInterval;
			payload['data'] = this.batchedGaze;

			if (Object.keys(dproperties).length) {
				payload['device'] = dproperties;
			}

			if (Object.keys(uproperties).length) {
				payload['user'] = uproperties;
			}
			this.network.networkCall('gaze', payload);
			this.batchedGaze = [];
		});

	}

	endSession() {
		this.batchedGaze = [];
		this.jsonPart = 1;
	}
}
// const defaultConfig = new Config();
export default GazeTracker;