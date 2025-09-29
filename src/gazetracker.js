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
    // Updated to accept a gazeHit object containing rich intersection data
	recordGaze(position, rotation, gaze, gazeHit) {
		let ts = this.core.getTimestamp();
		let data = {
			time: ts,
			p: [...position],
			r: [...rotation],
		};

		if (gaze) { data['g'] = [...gaze]; }
		
        // If we have a valid gaze hit, add its data to the snapshot
        if (gazeHit && gazeHit.objectId) { 
            data['o'] = gazeHit.objectId;
            if (gazeHit.point) data['h'] = gazeHit.point; // 'h' for hit point
            if (gazeHit.distance) data['d'] = gazeHit.distance; // 'd' for distance
            if (gazeHit.uv) data['u'] = gazeHit.uv; // 'u' for UV / texture coordinates
        }

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
		return new Promise((resolve, reject) => {
			if (!this.core.isSessionActive) {
				reject('GazeTracker.sendData failed: no session active');
				console.log('GazeTracker.sendData failed: no session active');
				return;
			}
			let dproperties = this.core.newDeviceProperties;
			let uproperties = this.core.newUserProperties;
			if (this.batchedGaze.length === 0 && dproperties.length === 0 && uproperties.length === 0) {
				reject();
				return;
			}

			let payload = {};

			payload['userid'] = this.core.userId;
			payload['timestamp'] = parseInt(this.core.getTimestamp(), 10);
			payload['sessionid'] = this.core.getSessionId();
			if (this.core.lobbyId) { payload['lobbyId'] = this.core.lobbyId; }
			payload['part'] = this.jsonPart;
			this.jsonPart++;
			payload['hmdtype'] = this.HMDType;
			payload['interval'] = this.playerSnapshotInterval;
			payload['data'] = this.batchedGaze;
			payload['properties'] = {};
			if (Object.keys(dproperties).length) {
				payload['properties'] = {...dproperties};
			}

			if (Object.keys(uproperties).length) {
				payload['properties'] = { ...payload.properties, ...uproperties};
			}
			this.network.networkCall('gaze', payload)
				.then(res => (res === 200) ? resolve(res) : reject(res));
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