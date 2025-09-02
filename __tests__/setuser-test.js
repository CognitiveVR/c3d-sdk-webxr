import C3DAnalytics from '../lib/cjs/index.cjs.js'; 
import settings from '../settings.ts';


// global.console = {
// 	warn: jest.fn(),
// 	log: jest.fn()
// }

/**
* @jest-environment jsdom
*/

/*
const c3d = new C3DAnalytics(settings);
beforeEach(() => {
	c3d.core.resetNewUserDeviceProperties();
	if (c3d.isSessionActive()) {
		c3d.endSession();
	}
});
*/


let c3d;
const scene1 = settings.config.allSceneData[0].sceneName;

beforeEach(async () => { 

    c3d = new C3DAnalytics(settings);
    c3d.core.resetNewUserDeviceProperties();

    if (c3d.isSessionActive()) {
        try {
            await c3d.endSession();
        } catch (error) {
            if (error !== 'session is not active') {
                console.warn('Unexpected error during beforeEach endSession cleanup:', error);
            }
        }
    }
});


test('Set and retrieve userId and deviceId', () => {
	expect(c3d.core.userId).not.toBe('test_id');
	c3d.userId = 'test_id';
	expect(c3d.core.userId).toBe('test_id');
	expect(c3d.core.deviceId).not.toBe('test_device_id');
	c3d.setDeviceName('test_device_id');
	expect(c3d.core.deviceId).toBe('test_device_id');
});

test('Verify custom user-defined properties can be properly associated with the user and retrieved', () => {
	let userPropertiesBeforeSetting = c3d.getUserProperties();
	expect(userPropertiesBeforeSetting).toEqual({});

	c3d.setUserProperty('name', 'ali');
	c3d.setUserProperty('location', 'toronto');
	let userProperties = c3d.getUserProperties();
	expect(userProperties).toEqual({ name: 'ali', location: 'toronto' });
});

test('Check if user properties can be defined and correctly exist before session starts', () => {
	let userPropertiesBefore = c3d.getUserProperties();
	expect(Object.keys(userPropertiesBefore).length).toEqual(0);
	c3d.setUserName("ali");
	c3d.setUserProperty('age', 30);
	c3d.setUserProperty('location', 'toronto');
	let userProperties = c3d.getUserProperties();
	expect(Object.keys(userProperties).length).toEqual(3); // name, age and location 
});

test('User properties are correctly set and available on the instance after a session has started', () => {
	c3d.setScene(scene1);
	c3d.startSession();

	// Set user properties after the session has started 
	c3d.setUserName("Ali");
	c3d.setUserProperty('age', 30);
	c3d.setUserProperty('location', 'Toronto');

	// Verify the properties are correctly set on this c3d instance
	const userProperties = c3d.getUserProperties();
	expect(Object.keys(userProperties).length).toEqual(3);
	expect(userProperties).toEqual({
		'c3d.name': 'Ali',
		'age': 30,
		'location': 'Toronto'
	});
});
test('Examine behavior of sendData() and endSession with null user', async () => {
	c3d.setScene(scene1)
	c3d.startSession();
	await expect(c3d.sendData()).resolves.toEqual(200);
	let endSession = await c3d.endSession();
	expect(endSession).toEqual(200);
});



