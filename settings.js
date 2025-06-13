export default {
    config: {
        // Note: the API key below points to a demo project in our Production environment.
        // You can get your own API key by signing up at https://cognitive3d.com
        // replace it with your own Application API key to send data to your own project.
        APIKey: (() => {
            if (!process.env.C3D_APPLICATION_KEY) {
                throw new Error("Missing C3D_APPLICATION_KEY in environment");
            }
            return process.env.C3D_APPLICATION_KEY;
        })(),
		networkHost: 'data.cognitive3d.com', // data.cognitive3d.com is prod, data.c3ddev.com is dev 
        gazeBatchSize: 64,
        dynamicDataLimit: 64,
        customEventBatchSize: 64,
        sensorDataLimit: 64,
        HMDType: "Meta Quest 2", 
        // Note: Replace `allSceneData` with your own scene data.
        // You can find your Scene Name, Scene ID, and Version Number in the Cognitive3D dashboard for your project.
        allSceneData: [
            {
                sceneName: "BasicScene", // Replace with your Scene Name from Cog3D dashboard
                sceneId: "93f486e4-0e22-4650-946a-e64ce527f915", // Replace with your Scene ID from Cog3D dashboard
                versionNumber: "1", // Replace with your Scene Version from Cog3D dashboard
            },
            {
				sceneName: 'AdvancedScene',
				sceneId: 'f0e6c0f2-717e-4cca-9fe5-39f88068ea40',
				versionNumber: '1'
			}
        ],
    },
};