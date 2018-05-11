import Config from "./config";
import Network from './network';
import SceneData from './scenedata';
import GazeTracker from "./gazetracker";
//need another class ?
class CognitiveVRAnalyticsCore {
	constructor(settings) {
		this.config = new Config();
		this.isSessionActive = false;
		this.sceneData = SceneData;
		this.userId = '';
		this.deviceId = '';
		this.sessionId = '';
		this.sessionTimestamp = '';
		this.sceneName = '';
		// let core = {
		// 	isSessionActive:this.isSessionActive1,
		// 	userId:this.userId,
		// 	deviceId:this.deviceId,
		// 	sessionId:this.sessionId,
		// 	sessionTimestamp:this.sessionTimestamp,
		// 	sceneName:this.sceneName
		// }
		if (settings) {
			this.config.settings = settings.config;
		}
		this.c3d = { config: this.config };
		this.network = new Network(this.config);
		this.gaze = new GazeTracker(this.c3d, this.network, this.isSessionActive);
		// this.customEvent = new CustomEvent();
		// gaze = new Gaze();
		// sensor = new Sensor();
		// dynamicobject = new DynamicObject();
		// exitpoll = new Exitpoll();
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
	isSessionActive1(){
		return this.isSessionActive;
	}

	set setUserId(userId) {
		this.userId = userId;
	}
	set setDeviceId(deviceId) {
		this.deviceId = deviceId;
	}
	set setScene(sceneName) {
		this.sceneName = sceneName
	}
	startSession() {
		this.isSessionActive = true;
		let ts = this.getSessionTimestamp();
		this.getSessionId();
	}
	getSessionId(){
		if(!this.sessionId){
			if(!this.userId){
				this.sessionId = `${this.getSessionTimestamp()}_${this.deviceId}`
			} else {
				this.sessionId = `${this.getSessionTimestamp()}_${this.userId}`
			}
		} 
		return this.sessionId
	}
}
export default { CognitiveVRAnalyticsCore };