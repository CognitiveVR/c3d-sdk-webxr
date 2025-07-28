import CognitiveVRAnalyticsCore from './core';
import GazeTracker from './gazetracker';
import CustomEvent from './customevent';
import Network from './network';
import Sensor from './sensors';
import ExitPoll from './exitpoll';
import DynamicObject from './dynamicobject';
import FPSTracker from './utils/Framerate';
import HMDOrientationTracker from './utils/HMDOrientation';
import Profiler from './utils/Profiler';
import ControllerTracker from './utils/ControllerTracker'; 

import {
  getDeviceMemory,
  getScreenHeight,
  getScreenWidth,
  getHardwareConcurrency,
  getConnection,
  getGPUInfo
} from './utils/environment';

import { 
  XRSessionManager,
  getHMDInfo,
  getEnabledFeatures 
} from './utils/webxr';

class C3D {
  constructor(settings, renderer = null) {
    this.core = CognitiveVRAnalyticsCore;
    if (settings) { this.core.config.settings = settings.config; }

    this.xrSessionManager = null; 

    this.setUserProperty("c3d.version", this.core.config.SDKVersion);  
    this.setDeviceProperty("SDKType", "WebXR"); 
    this.lastInputType = 'none'; // Can be 'none', 'hand', or 'controller'
    this.network = new Network(this.core);
    this.gaze = new GazeTracker(this.core);
    this.customEvent = new CustomEvent(this.core);
    this.hmdOrientation = new HMDOrientationTracker();
    this.profiler = new Profiler(this);
    this.controllerTracker = new ControllerTracker(this);
    this.sensor = new Sensor(this.core);
    this.exitpoll = new ExitPoll(this.core, this.customEvent);
    this.dynamicObject = new DynamicObject(this.core, this.customEvent);
    this.fpsTracker = new FPSTracker(); 

    // Set default device properties using environment utils
    const deviceMemory = getDeviceMemory();
    if (deviceMemory) {
      this.setDeviceProperty('DeviceMemory', deviceMemory * 1000); 
    }
    if (renderer) {
        this.profiler.start(renderer); 
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
    const gpuInfo = getGPUInfo();
    if (gpuInfo) {
      this.setDeviceProperty('DeviceGPU', gpuInfo.renderer);
      this.setDeviceProperty('DeviceGPUVendor', gpuInfo.vendor);
    }
  }
  async startSession(xrSession = null) { 
    if (this.core.isSessionActive) { return false; }
    
    this.fpsTracker.start(metrics => {
      this.sensor.recordSensor('c3d.fps.avg', metrics.avg);
      this.sensor.recordSensor('c3d.fps.1pl', metrics['1pl']);

    });

    if (xrSession) {  
      this.xrSessionManager = new XRSessionManager(this.gaze, xrSession);
      
      await this.xrSessionManager.start();
      this.controllerTracker.start(xrSession);
      const referenceSpace = this.xrSessionManager.referenceSpace;
      if (referenceSpace) {
        this.hmdOrientation.start(
          xrSession,
          referenceSpace,
          (orientation) => {
            this.sensor.recordSensor('c3d.hmd.pitch', orientation.pitch);
            this.sensor.recordSensor('c3d.hmd.yaw', orientation.yaw);
          }
        );
      } else {
        console.warn('C3D: Could not start HMD orientation tracking, no reference space available.');
      }
      const features = getEnabledFeatures(xrSession);
      this.setDeviceProperty("HandTracking", features.handTracking);
      this.setDeviceProperty("EyeTracking", features.eyeTracking);
    }
    else{
        console.warn("C3D: No XR session was provided. Gaze data will not be tracked for this session. This session will be tagged as junk on the Cognitive3D Dashboard, find the session under Test Mode.");
    }

    if (xrSession && xrSession.inputSources) { // check what is connected right now 
        const hmdInfo = getHMDInfo(xrSession.inputSources);
        if (hmdInfo) {
            this.setDeviceProperty('VRModel', hmdInfo.VRModel);
            this.setDeviceProperty('VRVendor', hmdInfo.VRVendor);
        } 

  const checkInputType = (sources) => {
            const hasHand = Array.from(sources).some(source => source.hand);
            const hasController = Array.from(sources).some(source => !source.hand && source.targetRayMode === 'tracked-pointer');
            
            let currentInputType = 'none';
            if (hasHand) {
                currentInputType = 'hand';
            } else if (hasController) {
                currentInputType = 'controller';
            }

            if (currentInputType !== this.lastInputType) {
                console.log(`Cognitive3D: Input changed from '${this.lastInputType}' to '${currentInputType}'.`);
                this.customEvent.send('c3d.input.tracking.changed', [0,0,0], {
                    "Previously Tracking": this.lastInputType,
                    "Now Tracking": currentInputType
                });
                this.lastInputType = currentInputType;
            }
        };

        checkInputType(xrSession.inputSources);

        xrSession.addEventListener('inputsourceschange', (event) => {  // Check whenever the input sources change
            checkInputType(event.session.inputSources);
            
            // HMD info might change
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
    this.customEvent.send('Session Start', [0, 0, 0]);
    return true;
  }
  
  
  endSession() {
    return new Promise((resolve, reject) => {
      if (!this.core.isSessionActive) {
        reject('session is not active');
        return;
      }
      this.fpsTracker.stop();  
      this.profiler.stop();
      if (this.hmdOrientation) {
          this.hmdOrientation.stop();
      }
      
      if (this.controllerTracker) {
          this.controllerTracker.stop(); 
      }      
      if (this.xrSessionManager) {
      this.xrSessionManager.stop();
      this.xrSessionManager = null;
      }
      
      // Calculate session length
      const props = {};
      const endPos = [0, 0, 0];
      const sessionLength = this.core.getTimestamp() - this.core.sessionTimestamp;
      props['sessionlength'] = sessionLength;
      props['Reason'] = "User exited the application";


      this.customEvent.send('c3d.sessionEnd', endPos, props);

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
  /**
   * Checks the current primary input method.
   * @returns {'hand' | 'controller' | 'none'} The current input type.
   */
  getCurrentInputType() {
      return this.lastInputType;
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
    this.setUserProperty('c3d.name', name);
  }

  setSessionName(name) {
    this.setUserProperty('c3d.sessionname', name);
  }

  setLobbyId(id) {
    this.core.setLobbyId(id);
  }

  setDeviceName(name) {
    this.core.setDeviceId = name;
    this.core.newDeviceProperties['c3d.device.name'] = name;
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