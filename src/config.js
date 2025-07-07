class Config {
	constructor() {
		this.LOG = false;
		this.SDKVersion = __SDK_VERSION__;
		this.networkHost = (process.env.NODE_ENV === 'production')
			? 'data.cognitive3d.com'
			: 'data.c3ddev.com';
		this.APIKey = ''; // SET APIKEY for PROD or DEV
		this.networkVersion = '0';
		this.sensorDataLimit = 64;
		this.dynamicDataLimit = 64;
		this.customEventBatchSize = 64;
		this.gazeBatchSize = 64;
		this.GazeInterval = 0.1; // this corresponds to 10 Hz
		this.allSceneData = [];
	}
	sceneData(sceneName, sceneId, versionNumber) {
		return {
			sceneName,
			sceneId,
			versionNumber
		}
	}
	set settings(settings) {
		if (settings.LOG) {
			this.LOG = settings.LOG;
		}
		if (settings.SDKVersion) {
			this.SDKVersion = settings.SDKVersion;
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
		if (settings.sensorDataLimit) {
			this.sensorDataLimit = settings.sensorDataLimit;
		}
		if (settings.dynamicDataLimit) {
			this.dynamicDataLimit = settings.dynamicDataLimit;
		}
		if (settings.customEventBatchSize) {
			this.customEventBatchSize = settings.customEventBatchSize;
		}
		if (settings.gazeBatchSize) {
			this.gazeBatchSize = settings.gazeBatchSize;
		}
		if (settings.GazeInterval) {
			this.GazeInterval = settings.GazeInterval;
		}
		if (settings.HMDType) {
			this.HMDType = settings.HMDType;
		}
		if (settings.allSceneData) {
			this.allSceneData = settings.allSceneData;
		}
	}
}
const defaultConfig = new Config();
export default defaultConfig;