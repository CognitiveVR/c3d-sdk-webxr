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
    HMDType?: string; 
    allSceneData?: SceneConfig[];
}

class Config {
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
    public HMDType?: string; 

    constructor() {
        this.LOG = false;
        this.SDKVersion = typeof __SDK_VERSION__ !== 'undefined' ? __SDK_VERSION__ : 'dev';
        
        this.networkHost = (process.env.NODE_ENV === 'production')
            ? 'data.cognitive3d.com'
            : 'data.c3ddev.com';
            
        this.APIKey = ''; 
        this.networkVersion = '0';
        this.sensorDataLimit = 512;
        this.dynamicDataLimit = 512;
        this.customEventBatchSize = 256;
        this.gazeBatchSize = 256;
        this.GazeInterval = 0.1; 
        this.allSceneData = [];
    }

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
        // Direct assignment for booleans/critical paths if needed, or included in loop
        if (settings.LOG !== undefined) this.LOG = settings.LOG;

        // Map Settings keys to Config keys
        const keys: (keyof Settings)[] = [
            'SDKVersion', 'networkHost', 'APIKey', 'networkVersion',
            'sensorDataLimit', 'dynamicDataLimit', 'customEventBatchSize',
            'gazeBatchSize', 'GazeInterval', 'HMDType', 'allSceneData'
        ];

        for (const key of keys) {
            if (settings[key] !== undefined) {
                // @ts-ignore: TypeScript doesn't like dynamic key assignment without strict typing of the map
                this[key] = settings[key];
            }
        }
    }
}

const defaultConfig = new Config();
export default defaultConfig;