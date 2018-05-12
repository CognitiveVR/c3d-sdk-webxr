class GazeTracker  {
	constructor(core) {
		this.core = core; 
		// this.network = network
		// this.c3d = cog;
		this.PlayerSnapshotInterval;
		this.HMDType;
		this.batchedGaze = [];
		// this.isSessionActive = isSessionActive
	}
	recordGaze(position, rotation, gaze) {
		console.log('isSessionActive', this.core.isSessionActive)

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
		this.PlayerSnapshotInterval = interval;
	}

	setHMDType(hmdtype) {
		this.HMDType = hmdtype;
	}

	sendData() {
		if (!this.core.isSessionActive){
			console.log('GazeTracker.sendData failed: no session active')
		} else {
			console.warn('Sending Batch')
			this.batchedGaze = []
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


}
// const defaultConfig = new Config();
export default GazeTracker;