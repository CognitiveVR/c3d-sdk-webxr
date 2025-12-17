import coreInstance, { CognitiveVRAnalyticsCore } from './core';
import GazeTracker from './gazetracker';
import CustomEvent from './customevent';
import Network from './network';
import Sensor from './sensors';
import ExitPoll from './exitpoll';
import DynamicObject from './dynamicobject';
import FPSTracker, { FPSMetrics } from './utils/Framerate';
import HMDOrientationTracker, { OrientationData } from './utils/HMDOrientation';
import Profiler from './utils/Profiler';
import ControllerTracker from './utils/ControllerTracker'; 
// @ts-ignore
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import BoundaryTracker from './utils/BoundaryTracker';
import { Settings, SceneConfig } from './config';

import {
  getDeviceMemory,
  getScreenHeight,
  getScreenWidth,
  getHardwareConcurrency,
  getConnection,
  getGPUInfo,
  isBrowser
} from './utils/environment';

import { 
  XRSessionManager,
  getHMDInfo,
  getEnabledFeatures,
  XRSessionManager as XRSessionManagerType
} from './utils/webxr';

interface C3DConstructorSettings {
    config: Settings;
}

class C3D {
  public core: CognitiveVRAnalyticsCore;
  public xrSessionManager: XRSessionManagerType | null;
  public gazeRaycaster: (() => any) | null;
  public lastInputType: 'none' | 'hand' | 'controller';
  public network: Network;
  public gaze: GazeTracker;
  public customEvent: CustomEvent;
  public hmdOrientation: HMDOrientationTracker;
  public profiler: Profiler;
  public controllerTracker: ControllerTracker;
  public sensor: Sensor;
  public exitpoll: ExitPoll;
  public dynamicObject: DynamicObject;
  public fpsTracker: FPSTracker;
  public renderer: any;
  public boundaryTracker: BoundaryTracker;

  constructor(settings?: C3DConstructorSettings, renderer: any = null) {
    this.core = coreInstance;
    
    if (settings) { 
        this.core.config.settings = settings.config; 
    }

    this.xrSessionManager = null; 
    this.gazeRaycaster = null;

    this.setUserProperty("c3d.version", this.core.config.SDKVersion);  
    this.lastInputType = 'none';
    
    const self = this as any;
    
    // @ts-ignore
    this.network = new Network(this.core);
    this.gaze = new GazeTracker(this.core);
    this.customEvent = new CustomEvent(this.core);
    this.hmdOrientation = new HMDOrientationTracker();
    this.profiler = new Profiler(self);
    this.controllerTracker = new ControllerTracker(self);
    this.sensor = new Sensor(this.core);
    this.exitpoll = new ExitPoll(this.core, this.customEvent);
    this.dynamicObject = new DynamicObject(this.core, this.customEvent);
    this.fpsTracker = new FPSTracker(); 
    this.renderer = renderer; 
    this.boundaryTracker = new BoundaryTracker(self);

    const deviceMemory = getDeviceMemory();
    if (deviceMemory) {
      this.setDeviceProperty('DeviceMemory', deviceMemory * 1000); 
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

  async startSession(xrSession: XRSession | null = null): Promise<boolean> { 
    if (this.core.isSessionActive) { return false; }

    if (isBrowser) {
        try {
            // @ts-ignore
            const fp = await FingerprintJS.load();
            // @ts-ignore
            const result = await fp.get();
            
            this.core.setDeviceId = result.visitorId;
            this.setSessionProperty("c3d.deviceid", result.visitorId); 
            this.setSessionProperty("c3d.deviceid.confidence", result.confidence.score);
            // console.log('Device ID:', result.visitorId);
        } catch (error) {
            console.warn('FingerprintJS failed:', error);
        }
    }
  
    if (this.renderer) { 
      this.profiler.start(this.renderer);
    }
    this.fpsTracker.start((metrics: FPSMetrics) => {
      this.sensor.recordSensor('c3d.fps.avg', metrics.avg);
      this.sensor.recordSensor('c3d.fps.1pl', metrics['1pl']);
    });

    if (xrSession) {  
      this.xrSessionManager = new XRSessionManager(this.gaze, xrSession, this.dynamicObject, this.gazeRaycaster);
      
      let sessionInfo = null;
      try {
        sessionInfo = await this.xrSessionManager.start();
      } catch (e) {
        console.error("C3D: Failed to start XRSessionManager. Gaze tracking may be disabled.", e);
      }

      this.controllerTracker.start(xrSession);

      if (sessionInfo && sessionInfo.boundedReferenceSpace) {
          this.boundaryTracker.start(xrSession, sessionInfo.boundedReferenceSpace);
          console.log('C3D: Boundary tracking started with bounded-floor reference space');
      } else {
          console.warn('C3D: Boundary tracking not available');
      }

      const referenceSpace = sessionInfo ? sessionInfo.referenceSpace : null;

      if (referenceSpace) {
        this.hmdOrientation.start(
          xrSession,
          referenceSpace,
          (orientation: OrientationData) => {
            this.sensor.recordSensor('c3d.hmd.pitch', orientation.pitch);
            this.sensor.recordSensor('c3d.hmd.yaw', orientation.yaw);
          }
        );
      } else {
        console.warn('C3D: Could not start HMD orientation tracking, no reference space available.');
      }
      
      // @ts-ignore
      const features = getEnabledFeatures(xrSession);
      this.setDeviceProperty("HandTracking", features.handTracking);
      this.setDeviceProperty("EyeTracking", features.eyeTracking);
    }
    else{
        console.warn("C3D: No XR session was provided. Gaze data will not be tracked.");
    }

    if (xrSession && xrSession.inputSources) { 
        const hmdInfo = getHMDInfo(xrSession.inputSources);
        if (hmdInfo) {
            this.setDeviceProperty('VRModel', hmdInfo.VRModel);
            this.setDeviceProperty('VRVendor', hmdInfo.VRVendor);
        } 

        const checkInputType = (sources: XRInputSourceArray) => {
            const hasHand = Array.from(sources).some(source => source.hand);
            const hasController = Array.from(sources).some(source => !source.hand && source.targetRayMode === 'tracked-pointer');
            
            let currentInputType: 'none' | 'hand' | 'controller' = 'none';
            if (hasHand) {
                currentInputType = 'hand';
            } else if (hasController) {
                currentInputType = 'controller';
            }

            if (currentInputType !== this.lastInputType) {
                this.customEvent.send('c3d.input.tracking.changed', [0,0,0], {
                    "Previously Tracking": this.lastInputType,
                    "Now Tracking": currentInputType
                });
                this.lastInputType = currentInputType;
            }
        };

        checkInputType(xrSession.inputSources);

        // @ts-ignore
        xrSession.addEventListener('inputsourceschange', (event: any) => {  
            const xrEvent = event as XRInputSourcesChangeEvent;
            checkInputType(xrEvent.session.inputSources);
            
            const newHmdInfo = getHMDInfo(xrEvent.session.inputSources);
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
  
  endSession(): Promise<number | string> {
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
      if (this.boundaryTracker) {
          this.boundaryTracker.stop(); 
      }      
      if (this.xrSessionManager) {
          this.xrSessionManager.stop();
          this.xrSessionManager = null;
      }
      
      const props: any = {};
      const endPos = [0, 0, 0];
      const sessionLength = this.core.getTimestamp() - (this.core.sessionTimestamp as number);
      props['sessionlength'] = sessionLength;
      props['Reason'] = "User exited the application";

      this.customEvent.send('c3d.sessionEnd', endPos, props);

      this.sendData()
        .then(res => {
          this.core.setSessionTimestamp = '';
          this.core.setSessionId = '';
          this.core.setSessionStatus = false;
          this.core.resetNewUserDeviceProperties();

          this.gaze.endSession();
          this.customEvent.endSession();
          this.sensor.endSession();
          this.dynamicObject.endSession();

          resolve(res);
        })
        .catch(err => reject(err));
    });
  }

  getCurrentInputType(): 'hand' | 'controller' | 'none' {
      return this.lastInputType;
  }

  sceneData(name: string, id: string, version: string): SceneConfig {
    return this.core.getSceneData(name, id, version);
  }

  config(property: string, value: any): void {
    // @ts-ignore
    this.core.config[property] = value;
  }

  addToAllSceneData(scene: SceneConfig): void {
    this.core.config.allSceneData.push(scene);
  }

  setScene(name: string): void {
    console.log(`CognitiveVRAnalytics::SetScene: ${name}`);
    if (this.core.sceneData.sceneId) {
      this.sendData();
      this.dynamicObject.refreshObjectManifest();
    }

    if (this.boundaryTracker) {
        this.boundaryTracker.forceBoundaryUpdate();
    }

    this.core.setScene(name);
  }

  set allSceneData(allSceneData: SceneConfig[]) {
    this.core.config.allSceneData = allSceneData;
  }

   sendData(): Promise<number | string> {
    return new Promise((resolve, reject) => {
      if (!this.core.isSessionActive) {
        resolve("Cognitive3DAnalyticsCore::SendData failed: no session active");
        return;
      }
      
      if (!this.core.sceneData.sceneId) { 
        reject('no scene selected'); 
        return;
      }

      const custom = this.customEvent.sendData();
      const gaze = this.gaze.sendData();
      const sensor = this.sensor.sendData();
      const dynamicObject = this.dynamicObject.sendData();

      Promise.all([custom, gaze, sensor, dynamicObject])
        .then(() => resolve(200))
        .catch(err => reject(err));
    });
  }

  isSessionActive(): boolean { return this.core.isSessionActive; }
  wasInitSuccessful(): boolean { return this.core.isSessionActive; }
  getSessionTimestamp(): number | string { return this.core.getSessionTimestamp(); }
  getSessionId(): string { return this.core.getSessionId(); }

  getUserProperties(): any {    
    const allProps = this.core.sessionProperties || {};
    const userProps: any = {};
    const deviceKeys = new Set(Object.values(this.core.devicePropertyMap));
    deviceKeys.add('c3d.device.name'); 

    for (const key in allProps) {
        if (!deviceKeys.has(key) && !key.startsWith('c3d.session.') && !key.startsWith('c3d.cohort.') && !key.startsWith('c3d.experiment.') && !key.startsWith('c3d.trial.') && !key.startsWith('c3d.participant.')) {
            userProps[key] = allProps[key];
        }
    }
    const participantPrefix = 'c3d.participant.';
    for (const key in allProps) {
        if (key.startsWith(participantPrefix)) {
             userProps[key.substring(participantPrefix.length)] = allProps[key];
        }
    }
     if (allProps['c3d.name']) {
        userProps['c3d.name'] = allProps['c3d.name'];
     }
    return userProps;
  }

  getDeviceProperties(): any {
    const allProps = this.core.sessionProperties || {};
    const deviceProps: any = {};
    const deviceKeys = new Set(Object.values(this.core.devicePropertyMap));
    deviceKeys.add('c3d.device.name'); 

    for (const key in allProps) {
        if (deviceKeys.has(key)) {
            deviceProps[key] = allProps[key];
        }
    }
    return deviceProps;
  }

  set userId(userId: string) { this.core.setUserId = userId; }
  
  setUserProperty(propertyOrObject: string | object, value?: any): void {
      if (typeof propertyOrObject === 'object') {
          Object.entries(propertyOrObject).forEach(([key, val]) => this.core.setUserProperty(key, val));
      } else if (typeof propertyOrObject === 'string') {
          this.core.setUserProperty(propertyOrObject, value);
      }
  }

  setParticipantFullName(name: string): void { this.core.setUserId = name; this.setUserProperty('c3d.name', name); }
  setParticipantId(id: string): void { this.core.setUserId = id; this.setParticipantProperty('id', id); }
  setSessionName(name: string): void { this.setUserProperty('c3d.sessionname', name); }
  setAppVersion(version: string): void { this.setDeviceProperty('AppVersion', version); }
  setLobbyId(id: string): void { this.core.setLobbyId(id); }
  setDeviceName(name: string): void { this.core.setDeviceId = name; this.core.setSessionProperty('c3d.device.name', name); }

  setDeviceProperty(propertyOrObject: string | object, value?: any): void {
      if (typeof propertyOrObject === 'object') {
          Object.entries(propertyOrObject).forEach(([key, val]) => this.core.setDeviceProperty(key, val));
      } else if (typeof propertyOrObject === 'string') {
          this.core.setDeviceProperty(propertyOrObject, value);
      }
  }

  setSessionProperty(propertyOrObject: string | object, value?: any): void {
    if (typeof propertyOrObject === 'object') {
        Object.entries(propertyOrObject).forEach(([key, val]) => this.core.setSessionProperty(key, val));
    } else if (typeof propertyOrObject === 'string') {
        this.core.setSessionProperty(propertyOrObject, value);
    }
  }
  setParticipantProperty(key: string, value: any): void { this.setSessionProperty('c3d.participant.' + key, value); }
  setParticipantProperties(obj: object): void { Object.entries(obj).forEach(([key, value]) => this.setParticipantProperty(key, value)); }
  setSessionTag(tag: string, value: boolean = true): void { if (typeof tag !== 'string' || tag.length === 0 || tag.length > 12) return; this.setSessionProperty('c3d.sessiontag.' + tag, value); }
  set deviceId(deviceId: string) { this.core.setDeviceId = deviceId; }
  getApiKey(): string { return this.core.getApiKey(); }
  getSceneId(): string { return this.core.sceneData.sceneId; }
}

export default C3D;