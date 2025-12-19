import Config from "./config";
import { SceneConfig } from "./config";

export interface DevicePropertyMap {
    [key: string]: string;
}

export interface SessionProperties {
    [key: string]: any;
}

export class CognitiveVRAnalyticsCore {
    public config: typeof Config;
    public isSessionActive: boolean;
    public sceneData: SceneConfig;
    public userId: string;
    public deviceId: string;
    public sessionId: string;
    public sessionTimestamp: number | string;
    public sessionProperties: SessionProperties;
    public sentSessionProperties: SessionProperties;
    public lobbyId: string;
    public devicePropertyMap: DevicePropertyMap;

    constructor() {
        this.config = Config;
        this.isSessionActive = false;
        this.sceneData = this.getCurrentScene();
        this.userId = '';
        this.deviceId = '';
        this.sessionId = '';
        this.sessionTimestamp = '';
        this.sessionProperties = {}; 
        this.sentSessionProperties = {}; 
        this.lobbyId = '';
        this.devicePropertyMap = {
            AppName: 'c3d.app.name',
            AppVersion: 'c3d.app.version',
            AppEngine: 'c3d.app.engine',
            AppEngineVersion: 'c3d.app.engine.version',
            Browser: 'c3d.device.browser',
            DeviceType: 'c3d.device.type',
            DeviceModel: 'c3d.device.model',
            DeviceMemory: 'c3d.device.memory',
            DeviceOS: 'c3d.device.os',
            DevicePlatform: 'c3d.device.platform',
            DeviceCPU: 'c3d.device.cpu',
            DeviceCPUCores: 'c3d.device.available.cpu.threads',
            DeviceCPUVendor: 'c3d.device.cpu.vendor',
            DeviceGPU: 'c3d.device.gpu',
            DeviceGPUDriver: 'c3d.device.gpu.driver',
            DeviceGPUVendor: 'c3d.device.gpu.vendor',
            DeviceGPUMemory: 'c3d.device.gpu.memory',
            DeviceScreenHeight: 'c3d.device.screen.height',
            DeviceScreenWidth: 'c3d.device.screen.width',
            EyeTracking: 'c3d.device.eyetracking.enabled',
            HandTracking: 'c3d.app.handtracking.enabled',
            NetworkEffectiveType: 'c3d.network.effectiveType',
            NetworkDownlink: 'c3d.network.downlink',
            NetworkRTT: 'c3d.network.rtt',
            SDKType: 'c3d.sdk.type',
            SDKVersion: 'c3d.sdk.version',
            VRModel: 'c3d.device.hmd.type',
            VRVendor: 'c3d.device.vendor',
        };
    }

    getSessionTimestamp(): number | string {
        if (!this.sessionTimestamp) {
            this.sessionTimestamp = Math.floor(this.getTimestamp());
        }
        return this.sessionTimestamp;
    }

    getCurrentScene(): SceneConfig {
        let scene: SceneConfig;
        if (this.config.allSceneData.length === 1) {
            scene = this.config.allSceneData[0];
        } else {
            scene = {
                sceneName: '',
                sceneId: '',
                versionNumber: ''
            };
        }
        return scene;
    }

    setScene(name: string): void {
        let foundScene = false;
        for (let i = 0; i <= this.config.allSceneData.length - 1; i++) {
            if (this.config.allSceneData[i].sceneName === name) {
                this.sceneData = this.config.allSceneData[i];
                foundScene = true;
                break;
            }
        }
        if (!foundScene) {
            console.error("CognitiveVRAnalyticsCore::SetScene Config scene ids does not contain key for scene " + name);
            this.sceneData.sceneName = '';
            this.sceneData.sceneId = '';
            this.sceneData.versionNumber = '';
        }
    }

    getTimestamp(): number {
        return Date.now() / 1000;
    }

    getSessionId(): string {
        if (!this.sessionId) {
            this.sessionId = `${this.sessionTimestamp}_${this.deviceId}`;
        }
        return this.sessionId;
    }

    getSceneData(sceneName: string, sceneId: string, versionNumber: string): SceneConfig {
        return {
            sceneName: sceneName,
            sceneId: sceneId,
            versionNumber: versionNumber
        };
    }

    set setSessionId(id: string) {
        this.sessionId = id;
    }

    set setUserId(id: string) {
        this.userId = id;
    }

    set setDeviceId(id: string) {
        this.deviceId = id;
    }

    set setSessionStatus(active: boolean) {
        this.isSessionActive = active;
    }

    set setSessionTimestamp(value: number | string) {
        this.sessionTimestamp = value;
    }

    setUserProperty(key: string, value: any): void {
        this.sessionProperties = this.sessionProperties || {};
        this.sessionProperties[key] = value;
    }

    setDeviceProperty(key: string, value: any): void {
        this.sessionProperties = this.sessionProperties || {};
        const mappedKey = this.devicePropertyMap[key] || key;
        this.sessionProperties[mappedKey] = value;
    }

    setSessionProperty(key: string, value: any): void {
        this.sessionProperties = this.sessionProperties || {};
        this.sessionProperties[key] = value;
    }

    getApiKey(): string {
        return this.config.APIKey;
    }

    devicePropertyString(property: string, value: any): string {
        return this.devicePropertyMap[property] ? this.devicePropertyMap[property] : "unknown.property";
    }

    resetNewUserDeviceProperties(): void {
        this.sessionProperties = {};
        this.sentSessionProperties = {};
    }

    setLobbyId(id: string): void {
        this.lobbyId = id;
    }
}

export default new CognitiveVRAnalyticsCore();