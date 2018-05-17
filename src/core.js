import Config from "./config";
import c3dSettings from '../settings';
//need another class ?
class CognitiveVRAnalyticsCore {
	constructor(settings) {
		this.config = Config
		this.isSessionActive = false;
		this.sceneData = this.getCurrentScene();
		this.userId = '';
		this.deviceId = '';
		this.sessionId = '';
		this.sessionTimestamp = '';
		this.newDeviceProperties = {};
		this.newUserProperties = {};
		this.devicePropertyMap = {
			AppName: "cvr.app.name",
			AppVersion: "cvr.app.version",
			AppEngine: "cvr.app.engine",
			AppEngineVersion: "cvr.app.engine.version",
			DeviceType: "cvr.device.type",
			DeviceModel: "cvr.device.model",
			DeviceMemory: "cvr.device.memory",
			DeviceOS: "cvr.device.os",
			DeviceCPU: "cvr.device.cpu",
			DeviceCPUCores: "cvr.device.cpu.cores",
			DeviceCPUVendor: "cvr.device.cpu.vendor",
			DeviceGPU: "cvr.device.gpu",
			DeviceGPUDriver: "cvr.device.gpu.driver",
			DeviceGPUVendor: "cvr.device.gpu.vendor",
			DeviceGPUMemory: "cvr.device.gpu.memory",
			VRModel: "cvr.vr.model",
			VRVendor: "cvr.vr.vendor",
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
		for (let i = 0; i <= this.config.allSceneData.length - 1; i++) {
			if (this.config.allSceneData[i].sceneName === name) {
				this.sceneData = this.config.allSceneData[i];
			}
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


}
export default new CognitiveVRAnalyticsCore(c3dSettings) 