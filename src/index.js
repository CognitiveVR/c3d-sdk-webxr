import Config from "./config";
import CognitiveVRAnalyticsCore from './core'
import GazeTracker from "./gazetracker";
import CustomEvent from "./customevent";
import Network from './network';
import Sensor from './sensors';

class C3D {
	constructor() {
		this.core = CognitiveVRAnalyticsCore;
		this.network = new Network(this.core);
		this.gaze = new GazeTracker(this.core);
		this.customEvent = new CustomEvent(this.core);
		this.sensor = new Sensor(this.core);
	}

	startSession() {
		if (this.core.isSessionActive) { return false; }

		this.core.setSessionStatus = true;
		this.core.getSessionTimestamp();
		this.core.getSessionId();

		this.gaze.setHMDType(this.core.config.HMDType);
		this.gaze.setInterval(this.core.config.GazeInterval);

		this.customEvent.send('Session Start', [0, 0, 0]);
		return true;
	};

	endSession() {
		// if session is not active do nothing
		if (!this.core.isSessionActive) return;

		//calculate session lenth
		let props = {};
		let endPos = [0, 0, 0];
		let sessionLength = this.core.getTimestamp() - this.core.sessionTimestamp;
		props['sessionLength'] = sessionLength;

		this.customEvent.send('Session End', [0, 0, 0], props);

		this.sendData();

		//clear out session's start timestamp, id and status.
		this.core.setSessionTimestamp = '';
		this.core.setSessionId = "";
		this.core.setSessionStatus = false;

		//clear out data containers for events 

		this.gaze.endSession();
		this.customEvent.endSession();
		this.sensor.endSession();
		//-------------------------//
		// this.dynamicObject.endSession();

	};
	sceneData(name, id, version) {
		return this.core.getSceneData(name, id, version);
	};

	set allSceneData(allSceneData) {
		this.core.allSceneData = allSceneData;
	};
	sendData() {
		if (!this.core.isSessionActive) {
			console.log("Cognitive3DAnalyticsCore::SendData failed: no session active");
			return;
		}
		this.gaze.sendData();
		this.customEvent.sendData();
		this.sensor.sendData();
		//-------------------------//
		// this.dynamicObject.sendData();
	};
	isSessionActive(){
		return this.core.isSessionActive;
	};
	//notsure if needed;
	wasInitSuccessful(){
		return this.core.isSessionActive;
	};
	getSessionTimestamp(){
		return this.core.getSessionTimestamp();
	};
	getSessionId(){
		return this.core.getSessionId();
	};
	getUserProperties(){
		return {...this.core.newUserProperties};
	};
	getDeviceProperties(){
		return {...this.core.newDeviceProperties};
	}
	set userId(userId) {
		this.core.setUserId = userId;
	};
	setUserProperty(property, value) {
		this.core.setUserProperty(property, value);
	};
	setUserName(name) {
		this.core.setUserId = name;
		this.setUserProperty('name', name);
	};
	setDeviceName(name) {
		this.core.setDeviceId = name;
		this.core.newDeviceProperties['name'] = name;
	};
	setDeviceProperty(property, value) {
		this.core.setDeviceProperty(property, value)
	};
	set deviceId(deviceId) {
		this.core.setDeviceId = deviceId;
	};
	set sceneName(name) {
		this.core.sceneData.sceneName = name;
	};
	set sceneId(id) {
		this.core.sceneData.sceneId = id;
	};
	set versionNumber(versionNumber) {
		this.core.sceneData.versionNumber = versionNumber;
	};
	getApiKey() {
		return this.core.getApiKey();
	};
	getSceneId() {
		return this.core.sceneData.SceneId;
	};

}

export default C3D;