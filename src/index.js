import CognitiveVRAnalyticsCore from './core'
import GazeTracker from "./gazetracker";
import CustomEvent from "./customevent";
import Network from './network';
import Sensor from './sensors';
import ExitPoll from './exitpoll';
import DynamicObject from './dynamicobject';

class C3D {
	constructor(settings) {
		this.core = CognitiveVRAnalyticsCore;
		if (settings) { this.core.config.settings = settings.config; }
		this.network = new Network(this.core);
		this.gaze = new GazeTracker(this.core);
		this.customEvent = new CustomEvent(this.core);
		this.sensor = new Sensor(this.core)
		this.exitpoll = new ExitPoll(this.core, this.customEvent);
		this.dynamicObject = new DynamicObject(this.core, this.customEvent);
		(typeof navigator !== 'undefined') && navigator.deviceMemory && this.setDeviceProperty('DeviceMemory', window.navigator.deviceMemory * 1000);
		(typeof window !== 'undefined') && window.navigator && window.navigator.platform && this.setDeviceProperty('DeviceType', window.navigator.platform);
		(typeof window !== 'undefined') && window.screen && window.screen.height && this.setDeviceProperty('DeviceScreenHeight', window.screen.height);
		(typeof window !== 'undefined') && window.screen && window.screen.width && this.setDeviceProperty('DeviceScreenWidth', window.screen.width);
		this.setDeviceProperty('DevicePlatform', this.getPlatformType());
		this.setDeviceProperty('DeviceOS', this.getOS());
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

		//calculate session length
		let props = {};
		let endPos = [0, 0, 0];
		let sessionLength = this.core.getTimestamp() - this.core.sessionTimestamp;
		props['sessionLength'] = sessionLength;

		this.customEvent.send('Session End', endPos, props);

		this.sendData();

		//clear out session's start timestamp, id and status.
		this.core.setSessionTimestamp = '';
		this.core.setSessionId = '';
		this.core.setSessionStatus = false;

		//clear out data containers for events 

		this.gaze.endSession();
		this.customEvent.endSession();
		this.sensor.endSession();
		this.dynamicObject.endSession();

	};
	sceneData(name, id, version) {
		return this.core.getSceneData(name, id, version);
	};

	getOS() {
		let userAgent = window.navigator.userAgent,
			platform = window.navigator.platform,
			macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'],
			windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'],
			iosPlatforms = ['iPhone', 'iPad', 'iPod'],
			os = null;
		if (macosPlatforms.indexOf(platform) !== -1) {
			os = 'MacOS';
		} else if (iosPlatforms.indexOf(platform) !== -1) {
			os = 'iOS';
		} else if (windowsPlatforms.indexOf(platform) !== -1) {
			os = 'Windows';
		} else if (/Android/.test(userAgent)) {
			os = 'Android';
		} else if (!os && /Linux/.test(platform)) {
			os = 'Linux';
		}
		return os || 'unknown';
	};

	getPlatformType() {
		if (window && window.navigator) {
			if (window.navigator.userAgent.match(/mobile/i)) {
				return 'Mobile';
			} else if (window.navigator.userAgent.match(/iPad|Android|Touch/i)) {
				return 'Tablet';
			} else {
				return 'Desktop';
			}
		}
	};
	config(property, value) {
		this.core.config[property] = value;
	};

	addToAllSceneData(scene) {
		this.core.config.allSceneData.push(scene);
	};

	setScene(name) {
		console.log("CognitiveVRAnalytics::SetScene: " + name);
		if(this.core.sceneData.sceneId){
			this.sendData();
			this.dynamicObject.refreshObjectManifest();
		}
		this.core.setScene(name);
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
		this.dynamicObject.sendData();
	};
	isSessionActive() {
		return this.core.isSessionActive;
	};
	//notsure if needed;
	wasInitSuccessful() {
		return this.core.isSessionActive;
	};
	getSessionTimestamp() {
		return this.core.getSessionTimestamp();
	};
	getSessionId() {
		return this.core.getSessionId();
	};
	getUserProperties() {
		return this.core.newUserProperties ;
	};
	getDeviceProperties() {
		return this.core.newDeviceProperties ;
	};
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
	getApiKey() {
		return this.core.getApiKey();
	};
	getSceneId() {
		return this.core.sceneData.sceneId;
	};

}
export default C3D;
