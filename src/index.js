import Config from "./config";
import CognitiveVRAnalyticsCore from './core'
import GazeTracker from "./gazetracker";
import Network from './network';
//need another class ?
class C3D {
	constructor() {
		this.core = CognitiveVRAnalyticsCore;
		this.network = new Network(this.core);
		this.gaze = new GazeTracker(this.core);
		this.newDeviceProperties={};
	}

	startSession() {
		//set isSessionActive on core class to true. 
		this.core.startSession();

		//but why if gaze has access to config ?
		this.gaze.setHMDType(this.core.config.HMDType);
		this.gaze.setInterval(this.core.config.GazeInterval);

		// const pos = [ 0,0,0 ];
		// customevent->Send("Start Session", pos);
	}
	set userId(userId) {
		this.core.setUserId = userId;
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

	setDeviceProperty = (property, value) => {
		debugger;
		this.newDeviceProperties[this.devicePropertyString(property)] = value;
	};

	devicePropertyString = (property, value) => {
		return this.devicePropertyMap[property] ? this.devicePropertyMap[property] : "unknown.property";
	}

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
	}
}

export default C3D