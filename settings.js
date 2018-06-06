export default {
	config: {
		APIKey: 'L3NAURENC320TQTFBROTMKBN2QUMNWCJ',
		gazeBatchSize: 64,
		dynamicDataLimit: 64,
		customEventBatchSize: 64,
		HMDType: 'rift',
		sensorDataLimit: 64,
		allSceneData: [
			{
				sceneName: 'test_scene1',
				sceneId: 'test_id1',
				versionNumber: 'version1'
			},
			{
				sceneName: 'test_scene2',
				sceneId: 'test_id2',
				versionNumber: 'version2'
			},
			{
				sceneName: 'nawar',
				sceneId: 'nawar_id2',
				versionNumber: '9'
			},
			{
				sceneName: 'tutorial',
				sceneId: 'b9d33399-1e13-428e-9559-7d15f28e9683',
				versionNumber: '3'
			}
		]
		//if a config is not spicificed then use the default value.
	},
}