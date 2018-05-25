import C3DAnalytics from '../lib';
require('es6-promise').polyfill();
require('isomorphic-fetch');



let settings = {
	config: {
		APIKey: 'L3NAURENC320TQTFBROTMKBN2QUMNWCJ',
		gazeBatchSize: 12,
		dynamicDataLimit: 20,
		customEventBatchSize: 3,
		HMDType: 'rift',
		sensorDataLimit: 10,
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
			}
		]
		//if a config is not spicificed then use the default value.
	},
};

/**
* @jest-environment jsdom
*/


test('should set userId, deviceId', () => {
	let c3d = new C3DAnalytics(settings);

	expect(c3d.core.userId).not.toBe('test_id');
	c3d.userId = 'test_id';
	expect(c3d.core.userId).toBe('test_id');

	expect(c3d.core.deviceId).not.toBe('test_device_id');
	c3d.setDeviceName('test_device_id');
	expect(c3d.core.deviceId).toBe('test_device_id');

	c3d.endSession();
});

test('Should Set User Properties properly', () => {
	let c3d = new C3DAnalytics(settings);
	let userPropertisBeofreSetting = c3d.getUserProperties();

	expect(userPropertisBeofreSetting).toEqual({});
	c3d.setUserProperty('name', 'test_name');
	c3d.setUserProperty('location', 'canada');
	let userPropertis = c3d.getUserProperties();
	expect(userPropertis).toEqual({ name: 'test_name', location: 'canada' });
	c3d.endSession();
});

test('User PreSession', () => {
	let c3d = new C3DAnalytics(settings);
	c3d.setUserName("john");
	c3d.setUserProperty('age', 38);
	c3d.setUserProperty('location', 'canada');
	let userPropertis = c3d.getUserProperties();
	expect(Object.keys(userPropertis).length).toEqual(3);
	c3d.endSession();
});



