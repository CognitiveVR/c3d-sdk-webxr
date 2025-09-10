import { SceneData } from './src/config';

// Defines the structure for the main configuration object used in tests.
interface SettingsConfig {
    APIKey: string;
    networkHost: string;
    gazeBatchSize: number;
    dynamicDataLimit: number;
    customEventBatchSize: number;
    sensorDataLimit: number;
    allSceneData: SceneData[];
}

// Defines the overall shape of the settings export.
interface Settings {
    config: SettingsConfig;
}

const settings: Settings = {
    config: {
        // You can get your own Application API key by signing up at https://cognitive3d.com
        // Replace it with your own Application API key to send data to your own project.
        // See README.md for more details on setting up your environment.
        APIKey: (() => {
            if (!process.env.C3D_APPLICATION_KEY) {
                throw new Error("Missing C3D_APPLICATION_KEY environment variable. Please set it before running tests.");
            }
            return process.env.C3D_APPLICATION_KEY;
        })(),
		networkHost: 'data.cognitive3d.com', // Use 'data.c3ddev.com' for development
        gazeBatchSize: 64,
        dynamicDataLimit: 64,
        customEventBatchSize: 64,
        sensorDataLimit: 64,
        // Note: Replace `allSceneData` with your own scene data.
        // You can find your Scene Name, Scene ID, and Version Number in the Cognitive3D dashboard for your project.
        allSceneData: [
            {
                sceneName: "BasicScene", // Replace with your Scene Name from Cog3D dashboard
                sceneId: "93f486e4-0e22-4650-946a-e64ce527f915", // Replace with your Scene ID from Cog3D dashboard
                versionNumber: "1", // Replace with your Scene Version from Cog3D dashboard
            },
            {
				sceneName: 'AdvancedScene', // At least two scenes are required to pass all test cases.
				sceneId: 'f0e6c0f2-717e-4cca-9fe5-39f88068ea40',
				versionNumber: '1'
			}
        ],
    },
};

export default settings;

