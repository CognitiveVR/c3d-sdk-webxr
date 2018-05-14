import Config from "./config";
import Network from './network';
import SceneData from './scenedata';
import GazeTracker from "./gazetracker";
import c3dSettings from '../settings';
//need another class ?
class CognitiveVRAnalyticsCore {
	constructor(settings) {
		this.config = Config
		if (settings) { this.config.settings = settings.config; }
		this.isSessionActive = false;
		this.sceneData = SceneData;
		this.userId = '';
		this.deviceId = '';
		this.sessionId = '';
		this.sessionTimestamp = '';
		this.newDeviceProperties = {};
		this.newUserProperties = {};
	}

	removeSettings() {

	}

	getSessionTimestamp() {
		if (!this.sessionTimestamp) {
			this.sessionTimestamp = this.getTimestamp();
		}
		return this.sessionTimestamp
	}

	getTimestamp() {
		return Date.now()
	}

	isSessionActive1() {
		return this.isSessionActive;
	}
	getSessionId() {
		if (!this.sessionId) {
			if (!this.userId) {
				this.sessionId = `${this.getSessionTimestamp()}_${this.deviceId}`
			} else {
				this.sessionId = `${this.getSessionTimestamp()}_${this.userId}`
			}
		}
		return this.sessionId
	}

	set setSessionId(id) {
		this.sessionId = id;
	}
	set setUserId(id) {
		this.userId = id;
	}
	set setDeviceId(id) {
		this.deviceId = id;
	}
	set setSessionStatus(active) {
		this.isSessionActive = active;
	}
	set setSessionTimestamp(value) {
		this.sessionTimestamp = value;
	}
	setUserProperty(propertyType, value) {
		this.newUserProperties[propertyType] = value;
	};
	setDeviceProperty(property, value) {
		this.newDeviceProperties[this.devicePropertyString(property)] = value;
	};

	devicePropertyString(property, value) {
		return this.devicePropertyMap[property] ? this.devicePropertyMap[property] : "unknown.property";
	};
	devicePropertyMap = {
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
export default new CognitiveVRAnalyticsCore(c3dSettings) 