class Config {
	constructor() {
		this.LOG = false;
		this.SdkVersion = '0.1'
		this.networkHost = 'data.c3ddev.com'
		//added to the header of the requests
		this.APIKey = ''
		this.networkVersion = '0'
		this.SensorDataLimit = 64
		this.DynamicDataLimit = 64
		this.CustomEventBatchSize = 64
		this.GazeBatchSize = 3
		this.GazeInterval = 0.1
		this.HMDType = ''
	}

	set settings(settings) {
		if (settings.LOG) {
			this.LOG = settings.LOG;
		}
		if (settings.SdkVersion) {
			this.SdkVersion = settings.SdkVersion;
		}
		if (settings.networkHost) {
			this.networkHost = settings.networkHost;
		}
		if (settings.APIKey) {
			this.APIKey = settings.APIKey;
		}
		if (settings.networkVersion) {
			this.networkVersion = settings.networkVersion;
		}
		if (settings.SensorDataLimit) {
			this.SensorDataLimit = settings.SensorDataLimit;
		}
		if (settings.DynamicDataLimit) {
			this.DynamicDataLimit = settings.DynamicDataLimit;
		} 
		if (settings.CustomEventBatchSize) {
			this.CustomEventBatchSize = settings.CustomEventBatchSize;
		} 
		if (settings.GazeBatchSize) {
			this.GazeBatchSize = settings.GazeBatchSize;
		}
		if (settings.GazeInterval) {
			this.GazeInterval = settings.GazeInterval;
		}
		if (settings.HMDType) {
			this.HMDType = settings.HMDType;
		}
	}
}
// const defaultConfig = new Config();
export default Config;