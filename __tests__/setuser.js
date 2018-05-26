import C3DAnalytics from '../src';
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

});

test('Should Set User Properties properly', () => {
	let c3d = new C3DAnalytics(settings);

	let userPropertisBeofreSetting = c3d.getUserProperties();
	expect(userPropertisBeofreSetting).toEqual({});

	c3d.setUserProperty('name', 'test_name');
	c3d.setUserProperty('location', 'canada');
	let userPropertis = c3d.getUserProperties();
	expect(userPropertis).toEqual({ name: 'test_name', location: 'canada' });
	//endsession will be run only if session were active 
	c3d.startSession();
	c3d.endSession();
});

test('User PreSession', () => {
	let c3d = new C3DAnalytics(settings);
	let userPropertiesBefore = c3d.getUserProperties();
	expect(Object.keys(userPropertiesBefore).length).toEqual(0);
	c3d.setUserName("john");
	c3d.setUserProperty('age', 38);
	c3d.setUserProperty('location', 'canada');
	let userPropertis = c3d.getUserProperties();
	expect(Object.keys(userPropertis).length).toEqual(3);

	//to reset user, device properties end session will be run only if session were active.
	c3d.startSession();
	c3d.endSession();
});

// TEST(UserSettings, UserPostSession) {
// 	if (TestDelay > 0)
// 		std::this_thread::sleep_for(std::chrono::seconds(TestDelay));

// 	cognitive::CoreSettings settings;
// 	settings.webRequest = &DoWebStuff;
// 	settings.APIKey = TESTINGAPIKEY;
// 	auto cog = cognitive::CognitiveVRAnalyticsCore(settings);

// 	cog.StartSession();
// 	cog.SetUserName("john");
// 	cog.SetUserProperty("age", 21);
// 	cog.SetUserProperty("location", "vancouver");
	
// 	cog.SendData();
// 	EXPECT_EQ(cog.GetUserProperties().size(), 0);
// }


test('User Post Session', () => {
	settings.config.APIKey = 'TEST_API';
	let c3d = new C3DAnalytics(settings);
	let currentAPI= c3d.getApiKey();
	expect(currentAPI).toEqual('TEST_API');
	// c3d.StartSession();
	c3d.setUserName("john");
	c3d.setUserProperty('age', 38);
	c3d.setUserProperty('location', 'canada');
	let userPropertis = c3d.getUserProperties();
	// expect(Object.keys(userPropertis).length).toEqual(3);
	c3d.startSession();
	c3d.endSession();
});



