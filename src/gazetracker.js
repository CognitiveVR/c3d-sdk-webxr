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
	recordGaze(position, rotation, gaze, gazeHit) {
		let ts = this.core.getTimestamp();
		let data = {
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
		// If gazeHit is null, it's a "sky" gaze, and we only record position and rotation.

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

			// Log the payload before sending
			console.log("Cognitive3D Gaze Payload:", JSON.stringify(payload, null, 2));

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