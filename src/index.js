import CognitiveVRAnalyticsCore from './core';
import GazeTracker from './gazetracker';
import CustomEvent from './customevent';
import Network from './network';
import Sensor from './sensors';
import ExitPoll from './exitpoll';
import DynamicObject from './dynamicobject';
import {
  getDeviceMemory,
  getScreenHeight,
  getScreenWidth,
  getSystemInfo,// getOS, getplatform and getPlatformType
  getHardwareConcurrency,
  getConnection
} from './utils/environment';
import { getHMDInfo } from './utils/webxr';

class C3D {
  constructor(settings) {
    this.core = CognitiveVRAnalyticsCore;
    if (settings) { this.core.config.settings = settings.config; }

    this.network = new Network(this.core);
    this.gaze = new GazeTracker(this.core);
    this.customEvent = new CustomEvent(this.core);
    this.sensor = new Sensor(this.core);
    this.exitpoll = new ExitPoll(this.core, this.customEvent);
    this.dynamicObject = new DynamicObject(this.core, this.customEvent);

    // Set default device properties using environment utils
    const deviceMemory = getDeviceMemory();
    if (deviceMemory) {
      this.setDeviceProperty('DeviceMemory', deviceMemory * 1000);
    }
    const systemInfo = getSystemInfo() 
    if(systemInfo){ 
      this.setDeviceProperty('DevicePlatform', getSystemInfo().deviceType);
      this.setDeviceProperty('DeviceOS', getSystemInfo().os);
      this.setDeviceProperty('Browser', getSystemInfo().browser)
    }
    
    const platform = getSystemInfo().deviceType;

    if (platform) {
      this.setDeviceProperty('DeviceType', getSystemInfo().deviceType);
    }

    const screenHeight = getScreenHeight();
    if (screenHeight) {
      this.setDeviceProperty('DeviceScreenHeight', screenHeight);
    }

    const screenWidth = getScreenWidth();
    if (screenWidth) {
      this.setDeviceProperty('DeviceScreenWidth', screenWidth);
    }

    const hardwareConcurrency = getHardwareConcurrency();
    if (hardwareConcurrency) {
      this.setDeviceProperty('DeviceCPUCores', hardwareConcurrency);
    }

    const connection = getConnection();
    if (connection) {
        this.setDeviceProperty('NetworkEffectiveType', connection.effectiveType);
        this.setDeviceProperty('NetworkDownlink', connection.downlink);
        this.setDeviceProperty('NetworkRTT', connection.rtt);
    }
    /*
    this.setDeviceProperty('DevicePlatform', getPlatformType());
    this.setDeviceProperty('DeviceOS', getOS());
    */ 

  }

  startSession(xrSession) { // Developers will need to pass the live xr session to c3d.startsession
    if (this.core.isSessionActive) { return false; }
    
    if (xrSession && xrSession.inputSources) { // check what is connected right now 
        const hmdInfo = getHMDInfo(xrSession.inputSources);
        if (hmdInfo) {
            this.setDeviceProperty('VRModel', hmdInfo.VRModel);
            this.setDeviceProperty('VRVendor', hmdInfo.VRVendor);
        } else {
            this.setDeviceProperty('VRModel', 'Unknown VR Headset');
            this.setDeviceProperty('VRVendor', 'Unknown Vendor');

        }

        xrSession.addEventListener('inputsourceschange', (event) => { // if controllers were previously off, check now 
            const newHmdInfo = getHMDInfo(event.session.inputSources);
            if (newHmdInfo) {
                this.setDeviceProperty('VRModel', newHmdInfo.VRModel);
                this.setDeviceProperty('VRVendor', newHmdInfo.VRVendor);
            }
        });
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
    return new Promise((resolve, reject) => {
      if (!this.core.isSessionActive) {
        reject('session is not active');
        return;
      }

      // Calculate session length
      const props = {};
      const endPos = [0, 0, 0];
      const sessionLength = this.core.getTimestamp() - this.core.sessionTimestamp;
      props['sessionLength'] = sessionLength;

      this.customEvent.send('Session End', endPos, props);

      this.sendData()
        .then(res => {
          // Clear out session's start timestamp, id and status
          this.core.setSessionTimestamp = '';
          this.core.setSessionId = '';
          this.core.setSessionStatus = false;
          this.core.resetNewUserDeviceProperties();

          // Clear out data containers for events
          this.gaze.endSession();
          this.customEvent.endSession();
          this.sensor.endSession();
          this.dynamicObject.endSession();

          resolve(res);
        })
        .catch(err => reject(err));
    });
  }

  sceneData(name, id, version) {
    return this.core.getSceneData(name, id, version);
  }

  config(property, value) {
    this.core.config[property] = value;
  }

  addToAllSceneData(scene) {
    this.core.config.allSceneData.push(scene);
  }

  setScene(name) {
    console.log(`CognitiveVRAnalytics::SetScene: ${name}`);
    if (this.core.sceneData.sceneId) {
      this.sendData();
      this.dynamicObject.refreshObjectManifest();
    }
    this.core.setScene(name);
  }

  set allSceneData(allSceneData) {
    this.core.allSceneData = allSceneData;
  }

   sendData() {
    return new Promise((resolve, reject) => {
      if (!this.core.isSessionActive) {
        console.log("Cognitive3DAnalyticsCore::SendData failed: no session active");
        resolve("Cognitive3DAnalyticsCore::SendData failed: no session active");
        return;
      }
      
      if (!this.core.sceneData.sceneId) {  // Check for a scene ID before attempting to send any data
        reject('no scene selected'); 
        return;
      }

      const custom = this.customEvent.sendData();
      const gaze = this.gaze.sendData();
      const sensor = this.sensor.sendData();
      const dynamicObject = this.dynamicObject.sendData();

      const promises = [custom, gaze, sensor, dynamicObject];

      Promise.all(promises)
        .then(() => resolve(200))
        .catch(err => reject(err));
    });
  }

  isSessionActive() {
    return this.core.isSessionActive;
  }

  wasInitSuccessful() {
    return this.core.isSessionActive;
  }

  getSessionTimestamp() {
    return this.core.getSessionTimestamp();
  }

  getSessionId() {
    return this.core.getSessionId();
  }

  getUserProperties() {
    return this.core.newUserProperties;
  }

  getDeviceProperties() {
    return this.core.newDeviceProperties;
  }

  set userId(userId) {
    this.core.setUserId = userId;
  }

  setUserProperty(property, value) {
    this.core.setUserProperty(property, value);
  }

  setUserName(name) {
    this.core.setUserId = name;
    this.setUserProperty('cvr.name', name);
  }

  setSessionName(name) {
    this.setUserProperty('cvr.sessionname', name);
  }

  setLobbyId(id) {
    this.core.setLobbyId(id);
  }

  setDeviceName(name) {
    this.core.setDeviceId = name;
    this.core.newDeviceProperties['cvr.device.name'] = name;
  }

  setDeviceProperty(property, value) {
    this.core.setDeviceProperty(property, value);
  }

  set deviceId(deviceId) {
    this.core.setDeviceId = deviceId;
  }

  getApiKey() {
    return this.core.getApiKey();
  }

  getSceneId() {
    return this.core.sceneData.sceneId;
  }
}


export default C3D;