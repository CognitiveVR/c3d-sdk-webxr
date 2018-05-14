import Network from './network'
class GazeTracker {
	constructor(core) {
		this.core = core;
		this.network = new Network(core);
		this.playerSnapshotInterval;
		this.HMDType;
		this.batchedGaze = [];
		this.jsonPart = 1;
		// this.isSessionActive = isSessionActive
	}
	recordGaze(position, rotation, gaze) {
		let data = [{
			//TODO: need milliseconds precision ts 
			time: Date.now(),
			p: [...position],
			g: [...gaze],
			r: [...rotation],
		}]
		this.batchedGaze = this.batchedGaze.concat(data);
		if (this.batchedGaze.length >= this.core.config.GazeBatchSize) {
			this.sendData()
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
			console.warn('Sending Batch');
			let se = {};
	
			se["userid"] = this.core.userId;
			se["timestamp"] = this.core.getTimestamp();
			se["sessionid"] = this.core.getSessionId();
			se["part"] = this.jsonPart;
			this.jsonPart++;
			se["hmdtype"] = this.HMDType;
			se["interval"] = this.playerSnapshotInterval;
			se["data"] = this.batchedGaze;
	
			if (Object.keys(dproperties).length) {
				se['device'] = dproperties;
			}
	
			if (Object.keys(uproperties).length) {
				se['user'] = uproperties;
			}
			this.network.networkCall('gaze', se)
			this.batchedGaze = [];
		})

	}

	endSession() {
		this.batchedGaze = [];
	}
}
// const defaultConfig = new Config();
export default GazeTracker;