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
		this.sessionProperties = {}; // Consolidated store
		this.sentSessionProperties = {}; // Tracks sent properties
		this.lobbyId = '';
		this.devicePropertyMap = {
			AppName: 'c3d.app.name',
			AppVersion: 'c3d.app.version',
			AppEngine: 'c3d.app.engine',
			AppEngineVersion: 'c3d.app.engine.version',
			Browser: 'c3d.device.browser',
			DeviceType: 'c3d.device.type',
			DeviceModel: 'c3d.device.model',
			DeviceMemory: 'c3d.device.memory',
			DeviceOS: 'c3d.device.os',
			DevicePlatform: 'c3d.device.platform',
			DeviceCPU: 'c3d.device.cpu',
			DeviceCPUCores: 'c3d.device.available.cpu.threads',
			DeviceCPUVendor: 'c3d.device.cpu.vendor',
			DeviceGPU: 'c3d.device.gpu',
			DeviceGPUDriver: 'c3d.device.gpu.driver',
			DeviceGPUVendor: 'c3d.device.gpu.vendor',
			DeviceGPUMemory: 'c3d.device.gpu.memory',
			DeviceScreenHeight: 'c3d.device.screen.height',
			DeviceScreenWidth: 'c3d.device.screen.width',
			EyeTracking: 'c3d.device.eyetracking.enabled',
			HandTracking: 'c3d.app.handtracking.enabled',
			NetworkEffectiveType: 'c3d.network.effectiveType', 
    		NetworkDownlink: 'c3d.network.downlink',
    		NetworkRTT: 'c3d.network.rtt',
			SDKType: 'c3d.sdk.type',
			SDKVersion: 'c3d.sdk.version',
			VRModel: 'c3d.device.hmd.type',
			VRVendor: 'c3d.device.vendor', 
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
	setUserProperty(key, value) {
		this.sessionProperties = this.sessionProperties || {}; 
		this.sessionProperties[key] = value;
	}
	setDeviceProperty(key, value) {
		this.sessionProperties = this.sessionProperties || {}; 
		const mappedKey = this.devicePropertyMap[key] || key;  
		this.sessionProperties[mappedKey] = value;
	}
	setSessionProperty(key, value) {
    this.sessionProperties = this.sessionProperties || {};
    this.sessionProperties[key] = value;
	}
	getApiKey() {
		return this.config.APIKey;
	};
	devicePropertyString(property, value) {
		return this.devicePropertyMap[property] ? this.devicePropertyMap[property] : "unknown.property";
	};
	resetNewUserDeviceProperties() {
		this.sessionProperties = {};
		this.sentSessionProperties = {};
	}
	setLobbyId(id) {
		this.lobbyId = id;
	}
}
export default new CognitiveVRAnalyticsCore()