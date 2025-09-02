import Config, { SceneData } from "./config";

/**
 * A generic interface for objects that hold arbitrary key-value pairs.
 */
export interface Properties {
    [key: string]: any;
}

/**
 * Defines the structure for the mapping of simplified device property names to their
 * corresponding internal Cognitive3D property keys.
 */
export interface DevicePropertyMap {
    [key: string]: string;
}

/**
 * The core class of the Cognitive3D SDK. It manages the session state, user and device
 * properties, and scene information. It acts as the central hub that other modules
 * in the SDK interact with.
 */
class CognitiveVRAnalyticsCore {
    /** A singleton instance of the Config class. */
    public config: typeof Config;

    /** A boolean flag indicating whether a session is currently active. */
    public isSessionActive: boolean;

    /** Holds the data for the currently active scene. */
    public sceneData: SceneData;

    /** The unique identifier for the current user. */
    public userId: string;

    /** The unique identifier for the current device. */
    public deviceId: string;

    /** The unique identifier for the current session. */
    public sessionId: string;

    /** The Unix timestamp (in seconds) when the session started. */
    public sessionTimestamp: number | '';

    /** A collection of new device properties that have not yet been sent to the backend. */
    public newDeviceProperties: Properties;

    /** A collection of new user properties that have not yet been sent to the backend. */
    public newUserProperties: Properties;

    /** An identifier for a multiplayer lobby or shared experience. */
    public lobbyId: string;

    /** A map to translate user-friendly property names to the required backend keys. */
    public devicePropertyMap: DevicePropertyMap;

    constructor() {
        this.config = Config;
        this.isSessionActive = false;
        this.sceneData = this.getCurrentScene();
        this.userId = '';
        this.deviceId = '';
        this.sessionId = '';
        this.sessionTimestamp = '';
        this.newDeviceProperties = {};
        this.newUserProperties = {};
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

    /**
     * Gets the start timestamp of the session. If not set, it initializes it.
     * @returns The session start timestamp in seconds.
     */
    public getSessionTimestamp(): number {
        if (!this.sessionTimestamp) {
            this.sessionTimestamp = Math.floor(this.getTimestamp());
        }
        return this.sessionTimestamp as number;
    }

    /**
     * Determines the current scene based on the configuration.
     * @returns The SceneData for the current scene.
     */
    public getCurrentScene(): SceneData {
        if (this.config.allSceneData.length === 1) {
            return this.config.allSceneData[0];
        } else {
            return { sceneName: '', sceneId: '', versionNumber: '' };
        }
    }

    /**
     * Sets the active scene by its name.
     * @param name - The name of the scene to set as active.
     */
    public setScene(name: string): void {
        const foundScene = this.config.allSceneData.find(scene => scene.sceneName === name);

        if (foundScene) {
            this.sceneData = foundScene;
        } else {
            console.error(`CognitiveVRAnalyticsCore::SetScene Config scene ids does not contain key for scene ${name}`);
            this.sceneData = { sceneName: '', sceneId: '', versionNumber: '' };
        }
    }

    /**
     * Gets the current Unix timestamp in seconds.
     * @returns The current timestamp.
     */
    public getTimestamp(): number {
        return Date.now() / 1000;
    }

    /**
     * Gets the unique ID for the current session. If not set, it generates one.
     * @returns The session ID string.
     */
    public getSessionId(): string {
        if (!this.sessionId) {
            const identifier = this.userId || this.deviceId;
            this.sessionId = `${this.getSessionTimestamp()}_${identifier}`;
        }
        return this.sessionId;
    }
    
    /**
     * A utility function to create a SceneData object.
     * @param sceneName - The user-friendly name of the scene.
     * @param sceneId - The unique identifier for the scene.
     * @param versionNumber - The version of the scene.
     * @returns A structured SceneData object.
     */
    public getSceneData(sceneName: string, sceneId: string, versionNumber: string): SceneData {
        return {
            sceneName,
            sceneId,
            versionNumber
        };
    }

    public set setSessionId(id: string) {
        this.sessionId = id;
    }

    public set setUserId(id: string) {
        this.userId = id;
    }

    public set setDeviceId(id: string) {
        this.deviceId = id;
    }

    public set setSessionStatus(active: boolean) {
        this.isSessionActive = active;
    }

    public set setSessionTimestamp(value: number | '') {
        this.sessionTimestamp = value;
    }

    /**
     * Sets a custom property for the current user.
     * @param propertyType - The name of the property.
     * @param value - The value of the property.
     */
    public setUserProperty(propertyType: string, value: any): void {
        this.newUserProperties[propertyType] = value;
    }

    /**
     * Sets a property for the current device.
     * @param property - The user-friendly name of the property.
     * @param value - The value of the property.
     */
    public setDeviceProperty(property: string, value: any): void {
        this.newDeviceProperties[this.devicePropertyString(property)] = value;
    }

    /**
     * Retrieves the API key from the configuration.
     * @returns The application's API key.
     */
    public getApiKey(): string {
        return this.config.APIKey;
    }

    /**
     * Translates a user-friendly device property name to its internal key.
     * @param property - The user-friendly property name.
     * @returns The internal Cognitive3D property key.
     */
    public devicePropertyString(property: string): string {
        return this.devicePropertyMap[property] || "unknown.property";
    }

    /**
     * Clears any unsent user and device properties.
     */
    public resetNewUserDeviceProperties(): void {
        this.newUserProperties = {};
        this.newDeviceProperties = {};
    }

    /**
     * Sets the ID for the current lobby or multiplayer session.
     * @param id - The lobby identifier.
     */
    public setLobbyId(id: string): void {
        this.lobbyId = id;
    }
}

export default new CognitiveVRAnalyticsCore();

