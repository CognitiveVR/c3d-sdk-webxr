export default {
    config: {
        APIKey: "", // Insert your API Key from the Cog3D dashboard 
		networkHost: 'data.cognitive3d.com', // data.cognitive3d.com is prod, data.c3ddev.com is dev 
        gazeBatchSize: 64,
        dynamicDataLimit: 64,
        customEventBatchSize: 64,
        sensorDataLimit: 64,
        HMDType: "Meta Quest 2", 
        allSceneData: [
            {
                sceneName: "", // Replace with your Scene Name from Cog3D dashboard
                sceneId: "", // Replace with your Scene ID from Cog3D dashboard
                versionNumber: "1", // Replace with your Scene Version from Cog3D dashboard
            },
        ],
    },
};