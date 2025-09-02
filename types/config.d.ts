export default defaultConfig;
declare const defaultConfig: Config;
declare class Config {
    LOG: boolean;
    SDKVersion: any;
    networkHost: string;
    APIKey: string;
    networkVersion: string;
    sensorDataLimit: number;
    dynamicDataLimit: number;
    customEventBatchSize: number;
    gazeBatchSize: number;
    GazeInterval: number;
    allSceneData: any[];
    sceneData(sceneName: any, sceneId: any, versionNumber: any): {
        sceneName: any;
        sceneId: any;
        versionNumber: any;
    };
    set settings(settings: any);
    HMDType: any;
}
