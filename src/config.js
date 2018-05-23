class Config {
	constructor() {
		this.LOG = false;
		this.SdkVersion = '0.1';
		this.networkHost = 'data.c3ddev.com';
		//added to the header of the requests
		this.APIKey = '';
		this.networkVersion = '0';
		this.sensorDataLimit = 64;
		this.dynamicDataLimit = 64;
		this.customEventBatchSize = 64;
		this.gazeBatchSize = 3;
		this.GazeInterval = 0.1;
		this.HMDType = '';
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
		if (settings.sensorDataLimit) {
			this.sensorDataLimit = settings.sensorDataLimit;
		}
		if (settings.DynamicDataLimit) {
			this.DynamicDataLimit = settings.DynamicDataLimit;
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