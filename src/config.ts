// Declare the global build variable injected by Rollup
declare const __SDK_VERSION__: string;

// Interface for a single scene's data
export interface SceneConfig {
    sceneName: string;
    sceneId: string;
    versionNumber: string;
}

// Interface for the settings object passed to the setter
export interface Settings {
    LOG?: boolean;
    SDKVersion?: string;
    networkHost?: string;
    APIKey?: string;
    networkVersion?: string;
    sensorDataLimit?: number;
    dynamicDataLimit?: number;
    customEventBatchSize?: number;
    gazeBatchSize?: number;
    GazeInterval?: number;
    HMDType?: string; // Explicitly added to fix your specific error
    allSceneData?: SceneConfig[];
}

class Config {
    // 1. Declare properties so TypeScript knows they exist on 'this'
    public LOG: boolean;
    public SDKVersion: string;
    public networkHost: string;
    public APIKey: string;
    public networkVersion: string;
    public sensorDataLimit: number;
    public dynamicDataLimit: number;
    public customEventBatchSize: number;
    public gazeBatchSize: number;
    public GazeInterval: number;
    public allSceneData: SceneConfig[];
    public HMDType?: string; // Optional property

    constructor() {
        this.LOG = false;
        // Check if the global variable is defined (it might not be in tests)
        this.SDKVersion = typeof __SDK_VERSION__ !== 'undefined' ? __SDK_VERSION__ : 'dev';
        
        this.networkHost = (process.env.NODE_ENV === 'production')
            ? 'data.cognitive3d.com'
            : 'data.c3ddev.com';
            
        this.APIKey = ''; // SET APIKEY for PROD or DEV
        this.networkVersion = '0';
        this.sensorDataLimit = 512;
        this.dynamicDataLimit = 512;
        this.customEventBatchSize = 256;
        this.gazeBatchSize = 256;
        this.GazeInterval = 0.1; // this corresponds to 10 Hz
        this.allSceneData = [];
    }

    /**
     * Helper to create a scene data object
     */
    sceneData(sceneName: string, sceneId: string, versionNumber: string): SceneConfig {
        return {
            sceneName,
            sceneId,
            versionNumber
        };
    }

    /**
     * Setter to apply bulk settings
     */
    set settings(settings: Settings) {
        if (settings.LOG !== undefined) {
            this.LOG = settings.LOG;
        }
        if (settings.SDKVersion) {
            this.SDKVersion = settings.SDKVersion;
        }
        if (settings.networkHost) {
            this.networkHost = settings.networkHost;
        }
        if (settings.APIKey) {
            this.APIKey = settings.APIKey;
        }
        if (settings.networkVersion) {
            this.networkVersion = settings.networkVersion;
        }
        if (settings.sensorDataLimit) {
            this.sensorDataLimit = settings.sensorDataLimit;
        }
        if (settings.dynamicDataLimit) {
            this.dynamicDataLimit = settings.dynamicDataLimit;
        }
        if (settings.customEventBatchSize) {
            this.customEventBatchSize = settings.customEventBatchSize;
        }
        if (settings.gazeBatchSize) {
            this.gazeBatchSize = settings.gazeBatchSize;
        }
        if (settings.GazeInterval) {
            this.GazeInterval = settings.GazeInterval;
        }
        if (settings.HMDType) {
            this.HMDType = settings.HMDType;
        }
        if (settings.allSceneData) {
            this.allSceneData = settings.allSceneData;
        }
    }
}

const defaultConfig = new Config();
export default defaultConfig;