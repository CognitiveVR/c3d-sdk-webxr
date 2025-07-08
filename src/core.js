import Config from "./config";
class CognitiveVRAnalyticsCore {
	constructor() {
		this.config = Config;
		this.isSessionActive = false;
		this.sceneData = this.getCurrentScene();
		this.userId = '';
		this.deviceId = '';
		this.sessionId = '';
		this.sessionTimestamp = '';
		this.newDeviceProperties = {};
		this.newUserProperties = {};
		this.lobbyId = '';
		this.devicePropertyMap = {
			AppName: 'cvr.app.name',
			AppVersion: 'cvr.app.version',
			AppEngine: 'c3d.app.engine',
			AppEngineVersion: 'cvr.app.engine.version',
			Browser: 'cvr.device.browser',
			DeviceType: 'cvr.device.type',
			DeviceModel: 'cvr.device.model',
			DeviceMemory: 'cvr.device.memory',
			DeviceOS: 'cvr.device.os',
			DevicePlatform: 'cvr.device.platform',
			DeviceCPU: 'cvr.device.cpu',
			DeviceCPUCores: 'cvr.device.cpu.cores',
			DeviceCPUVendor: 'cvr.device.cpu.vendor',
			DeviceGPU: 'cvr.device.gpu',
			DeviceGPUDriver: 'cvr.device.gpu.driver',
			DeviceGPUVendor: 'cvr.device.gpu.vendor',
			DeviceGPUMemory: 'cvr.device.gpu.memory',
			DeviceScreenHeight: 'cvr.device.screen.height',
			DeviceScreenWidth: 'cvr.device.screen.width',
			NetworkEffectiveType: 'cvr.network.effectiveType', 
    		NetworkDownlink: 'cvr.network.downlink',
    		NetworkRTT: 'cvr.network.rtt',
			SDKVersion: 'cvr.sdk.version',
			VRModel: 'cvr.vr.model',
			VRVendor: 'cvr.vr.vendor',
		};
	}

	getSessionTimestamp() {
		if (!this.sessionTimestamp) {
			this.sessionTimestamp = parseInt(this.getTimestamp(), 10);
		}
		return this.sessionTimestamp;
	};
	getCurrentScene() {
		let scene;
		if (this.config.allSceneData.length === 1) {
			scene = this.config.allSceneData[0];
		} else {
			scene = {
				sceneName: '',
				sceneId: '',
				versionNumber: ''
			}
		}
		return scene;
	};
	setScene(name) {
		let foundScene = false;
		for (let i = 0; i <= this.config.allSceneData.length - 1; i++) {
			if (this.config.allSceneData[i].sceneName === name) {
				this.sceneData = this.config.allSceneData[i];
				foundScene = true;
				break;
			}
		}
		if (!foundScene) {
			console.error("CognitiveVRAnalyticsCore::SetScene Config scene ids does not contain key for scene " + name);
			this.sceneData.sceneName = '';
			this.sceneData.sceneId = '';
			this.sceneData.versionNumber = '';
		}
	};
	getTimestamp() {
		return Date.now() / 1000;
	};
	isSessionActive1() {
		return this.isSessionActive;
	};
	getSessionId() {
		if (!this.sessionId) {
			if (!this.userId) {
				this.sessionId = `${this.sessionTimestamp}_${this.deviceId}`;
			} else {
				this.sessionId = `${this.sessionTimestamp}_${this.userId}`;
			}
		}
		return this.sessionId;
	};
	getSceneData(sceneName, sceneId, versionNumber) {
		return {
			sceneName: sceneName,
			sceneId: sceneId,
			versionNumber: versionNumber
		};
	};
	set setSessionId(id) {
		this.sessionId = id;
	};
	set setUserId(id) {
		this.userId = id;
	};
	set setDeviceId(id) {
		this.deviceId = id;
	};
	set setSessionStatus(active) {
		this.isSessionActive = active;
	};
	set setSessionTimestamp(value) {
		this.sessionTimestamp = value;
	};
	setUserProperty(propertyType, value) {
		this.newUserProperties[propertyType] = value;
	};
	setDeviceProperty(property, value) {
		this.newDeviceProperties[this.devicePropertyString(property)] = value;
	};
	getApiKey() {
		return this.config.APIKey;
	};
	devicePropertyString(property, value) {
		return this.devicePropertyMap[property] ? this.devicePropertyMap[property] : "unknown.property";
	};
	resetNewUserDeviceProperties() {
		this.newUserProperties = {};
		this.newDeviceProperties = {};
	}
	setLobbyId(id) {
		this.lobbyId = id;
	}
}
export default new CognitiveVRAnalyticsCore() 