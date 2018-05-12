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

	startSession() {
		if(!this.isSessionActive){
			return false;
		}
		console.log('Cognitive3DAnalytics::StartSession')
		this.isSessionActive = true;
		this.getSessionTimestamp();
		this.getSessionId();
		// const pos = [ 0,0,0 ];
		// customevent->Send("Start Session", pos);
		//...

		return true;
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

	set setUserId(id) {
		this.userId = id;
	}
	set setDeviceId(id) {
		this.deviceId = id;
	}
}
export default new CognitiveVRAnalyticsCore(c3dSettings) 