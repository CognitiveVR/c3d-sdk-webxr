
/**
 * Shape of data for a single scene.
 */
export interface SceneData {
    sceneName: string;
    sceneId: string;
    versionNumber: string;
}
/**
 * Manages all configuration settings for the SDK.
 */
class Config {
    public LOG: boolean = false;
    public SDKVersion: string = typeof __SDK_VERSION__ !== 'undefined' ? __SDK_VERSION__ : 'dev';
    public networkHost: string = (process.env.NODE_ENV === 'production')
        ? 'data.cognitive3d.com'
        : 'data.c3ddev.com';
    public APIKey: string = '';
    public networkVersion: string = '0';
    public sensorDataLimit: number = 64;
    public dynamicDataLimit: number = 64;
    public customEventBatchSize: number = 64;
    public gazeBatchSize: number = 64;
    public GazeInterval: number = 0.1; // corresponds to 10 Hz
    public allSceneData: SceneData[] = [];
    public HMDType?: string;
    
    /**
     * Creates a SceneData object.
     */
    public sceneData(sceneName: string, sceneId: string, versionNumber: string): SceneData {
        return {
            sceneName,
            sceneId,
            versionNumber
        };
    }
    /**
     * Merges new settings into the current configuration.
     * @param newSettings - An object with properties to override in the config.
     */
    public set settings(newSettings: Partial<Config>) {
        Object.assign(this, newSettings);
    }
}

const defaultConfig = new Config();
export default defaultConfig;