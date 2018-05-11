class GazeTracker {
	constructor(cog, network) {
		this.network = network
		this.c3d = cog;
		this.PlayerSnapshotInterval;
		this.HMDType;
		this.batchedGaze = [];
	}
	recordGaze(position, rotation, gaze) {
		let data = [{
			//TODO: need milliseconds precision  
			time: Date.now(),
			p: [...position],
			g: [...gaze],
			r: [...rotation],
		}]
		this.batchedGaze = this.batchedGaze.concat(data);
		if (this.batchedGaze.length >= this.c3d.config.GazeBatchSize) {
			this.sendData()
			this.batchedGaze = []
		}
	}

	SetInterval(interval) {
		this.PlayerSnapshotInterval = interval;
	}

	SetHMDType(hmdtype) {
		this.HMDType = hmdtype;
	}

	sendData() {
		if (!this.c3d.isSessionActive){
			console.log('GazeTracker.sendData failed: no session active')
		}
		// userid:this.c3d.userid,
		// timestamp:this.,
		// sessionid:'',
		// part:'',
		// hmdtype:'',
		// interval:'',
		// this.network.networkCall('gaze', content )
		// this.sendData()
	}


}
// const defaultConfig = new Config();
export default GazeTracker;