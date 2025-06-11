import C3DAnalytics from '../lib/index.cjs.js';
import settings from '../settings';


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

test('Check if user properties are correctly set and available after a session has started', async () => {
	settings.config.APIKey = ''; 			// SET API KEY HERE, overrides and should work even if APIKEY was not set in config or settings  
	let c3d = new C3DAnalytics(settings);
	let currentAPI = c3d.getApiKey();
	expect(currentAPI).toEqual(''); 		// SET API KEY HERE 
	c3d.setScene('BasicScene');
	c3d.startSession();
	c3d.setUserName("ali");
	c3d.setUserProperty('age', 30);
	c3d.setUserProperty('location', 'toronto');
	//
	await expect(c3d.sendData()).resolves.toEqual(200);
	let userProperties = c3d.getUserProperties();
	expect(Object.keys(userProperties).length).toEqual(3);
});

test('Examine behavior of sendData() and endSession with null user', async () => {
	c3d.setScene('BasicScene')
	c3d.startSession();
	await expect(c3d.sendData()).resolves.toEqual(200);
	let endSession = await c3d.endSession();
	expect(endSession).toEqual(200);
});



