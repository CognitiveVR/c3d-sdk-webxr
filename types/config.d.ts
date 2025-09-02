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
declare class Config {
    LOG: boolean;
    SDKVersion: string;
    networkHost: string;
    APIKey: string;
    networkVersion: string;
    sensorDataLimit: number;
    dynamicDataLimit: number;
    customEventBatchSize: number;
    gazeBatchSize: number;
    GazeInterval: number;
    allSceneData: SceneData[];
    HMDType?: string;
    /**
     * Creates a SceneData object.
     */
    sceneData(sceneName: string, sceneId: string, versionNumber: string): SceneData;
    /**
     * Merges new settings into the current configuration.
     * @param newSettings - An object with properties to override in the config.
     */
    set settings(newSettings: Partial<Config>);
}
declare const defaultConfig: Config;
export default defaultConfig;
