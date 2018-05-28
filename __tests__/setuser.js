import C3DAnalytics from '../lib';
require('es6-promise').polyfill();
require('isomorphic-fetch');



let settings = {
	config: {
		APIKey: 'INTIAL_API',
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

global.console = {
  warn: jest.fn(),
  log: jest.fn()
}

/**
* @jest-environment jsdom
*/


const c3d = new C3DAnalytics(settings);
beforeEach(() => {
	c3d.core.resetNewUserDevicProperties();
	if(c3d.isSessionActive()){
		c3d.endSession();
	}
});

test('should set userId, deviceId', () => {
	expect(c3d.core.userId).not.toBe('test_id');
	c3d.userId = 'test_id';
	expect(c3d.core.userId).toBe('test_id');
	expect(c3d.core.deviceId).not.toBe('test_device_id');
	c3d.setDeviceName('test_device_id');
	expect(c3d.core.deviceId).toBe('test_device_id');
});

test('Should Set User Properties properly', () => {
	let userPropertisBeofreSetting = c3d.getUserProperties();
	expect(userPropertisBeofreSetting).toEqual({});

	c3d.setUserProperty('name', 'test_name');
	c3d.setUserProperty('location', 'canada');
	let userPropertis = c3d.getUserProperties();
	expect(userPropertis).toEqual({ name: 'test_name', location: 'canada' });
});

test('User PreSession', () => {
	let userPropertiesBefore = c3d.getUserProperties();
	expect(Object.keys(userPropertiesBefore).length).toEqual(0);
	c3d.setUserName("john");
	c3d.setUserProperty('age', 38);
	c3d.setUserProperty('location', 'canada');
	let userPropertis = c3d.getUserProperties();
	expect(Object.keys(userPropertis).length).toEqual(3);
	c3d.startSession();
});

test('User Post Session', () => {
	settings.config.APIKey = 'TEST_API';
	let c3d = new C3DAnalytics(settings);
	let currentAPI = c3d.getApiKey();
	expect(currentAPI).toEqual('TEST_API');
	c3d.startSession();
	c3d.setUserName("john");
	c3d.setUserProperty('age', 21);
	c3d.setUserProperty('location', 'vancouver');
	c3d.sendData();
	let userPropertis = c3d.getUserProperties();
	expect(Object.keys(userPropertis).length).toEqual(3);
});

test('User null pre session', () => {
	console.log('here')
	c3d.startSession();
	c3d.sendData();
	expect(global.console.log).not.toHaveBeenCalledWith("Cognitive3DAnalyticsCore::SendData failed: no session active")
});



