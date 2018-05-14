import Config from "./config";
import CognitiveVRAnalyticsCore from './core'
import GazeTracker from "./gazetracker";
import CustomEvent from "./customevent";
import Network from './network';

class C3D {
	constructor() {
		this.core = CognitiveVRAnalyticsCore;
		this.network = new Network(this.core);
		this.gaze = new GazeTracker(this.core);
		this.customEvent = new CustomEvent(this.core);
		// this.newDeviceProperties = {};
		// this.newUserProperties = {};
	}

	startSession() {
		if (this.core.isSessionActive) {
			return false;
		}

		this.core.setSessionStatus = true;
		this.core.getSessionTimestamp();
		this.core.getSessionId();

		this.gaze.setHMDType(this.core.config.HMDType);
		this.gaze.setInterval(this.core.config.GazeInterval);

		this.customEvent.send('Session Start', [0, 0, 0]);
		return true;
	}

	endSession() {
		// if session is not active do nothing
		if (!this.core.isSessionActive) return;

		//calculate session lenth
		let props = {};
		let endPos = [0, 0, 0];
		let sessionLength = this.core.getTimestamp() - this.core.sessionTimestamp;
		props['sessionLength'] = sessionLength;

		//TODO:send data
		this.customEvent.send('Session End', [0, 0, 0], props);

		this.sendData();

		//clear out session's start timestamp, id and status.
		this.core.setSessionTimestamp = '';
		this.core.setSessionId = "";
		this.core.setSessionStatus = false;

		//clear out data containers for events 

		this.gaze.endSession();
		this.customEvent.endSession();
		// this.dynamicObject.endSession();
		// this.sensor.endSession();

	}
	sendData() {
		if (!this.core.isSessionActive) {
			console.log("Cognitive3DAnalyticsCore::SendData failed: no session active");
			return;
		}
		this.gaze.sendData();
		this.customEvent.sendData();
		// this.dynamicObject.sendData();
		// this.sensor.sendData();
	}
	set userId(userId) {
		this.core.setUserId = userId;
	}
	setUserProperty(property, value) {
		this.core.setUserProperty(property, value);
	};
	setDeviceProperty(property, value) {
		this.core.setDeviceProperty(property, value)
	}
	set deviceId(deviceId) {
		this.core.setDeviceId = deviceId;
	}
	set seneName(name) {
		this.core.sceneData.sceneName = name;
	}
	set sceneId(id) {
		this.core.sceneData.sceneId = id;
	}
	set versionNumber(versionNumber) {
		this.core.sceneData.versionNumber = versionNumber;
	}
	get APIKey() {
		return this.core.config.APIKey
	}

	// setDeviceProperty(property, value) {
	// 	this.newDeviceProperties[this.devicePropertyString(property)] = value;
	// };

	// devicePropertyString(property, value) {
	// 	return this.devicePropertyMap[property] ? this.devicePropertyMap[property] : "unknown.property";
	// }
	// setUserProperty(propertyType, value) {
	// 	this.newUserProperties[propertyType] = value;
	// }

	// devicePropertyMap = {
	// 	AppName: "cvr.app.name",
	// 	AppVersion: "cvr.app.version",
	// 	AppEngine: "cvr.app.engine",
	// 	AppEngineVersion: "cvr.app.engine.version",
	// 	DeviceType: "cvr.device.type",
	// 	DeviceModel: "cvr.device.model",
	// 	DeviceMemory: "cvr.device.memory",
	// 	DeviceOS: "cvr.device.os",
	// 	DeviceCPU: "cvr.device.cpu",
	// 	DeviceCPUCores: "cvr.device.cpu.cores",
	// 	DeviceCPUVendor: "cvr.device.cpu.vendor",
	// 	DeviceGPU: "cvr.device.gpu",
	// 	DeviceGPUDriver: "cvr.device.gpu.driver",
	// 	DeviceGPUVendor: "cvr.device.gpu.vendor",
	// 	DeviceGPUMemory: "cvr.device.gpu.memory",
	// 	VRModel: "cvr.vr.model",
	// 	VRVendor: "cvr.vr.vendor",
	// }
}

export default C3D