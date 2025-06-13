export default {
    config: {
        APIKey: "R7QW3EYNLG4AYVQ8029R26V30TST6YLE", // Insert your API Key from the Cog3D dashboard 
		networkHost: 'data.cognitive3d.com', // data.cognitive3d.com is prod, data.c3ddev.com is dev 
        gazeBatchSize: 64,
        dynamicDataLimit: 64,
        customEventBatchSize: 64,
        sensorDataLimit: 64,
        HMDType: "Meta Quest 2", 
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