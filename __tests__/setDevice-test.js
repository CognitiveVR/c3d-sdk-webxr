import C3DAnalytics from '../lib/index.cjs.js';
import settings from '../settings';


// global.console = {
//   warn: jest.fn(),
//   log: jest.fn()
// }

/**
* @jest-environment jsdom
*/


const c3d = new C3DAnalytics(settings);
c3d.setScene('BasicScene');

beforeEach(() => {
	c3d.core.resetNewUserDeviceProperties();
	if (c3d.isSessionActive()) {
		c3d.endSession();
	}
});

test('Apply device properties, set pre-session and end session successfully', async () => {
	c3d.setDeviceName('7741345684915735');
	c3d.setDeviceProperty('DeviceMemory', 128);
	c3d.setDeviceProperty('DeviceOS', "chrome os 16.9f");
	c3d.setDeviceProperty('DevicePlatform', "Desktop");
	let deviceProperties = c3d.getDeviceProperties();
	expect(Object.keys(deviceProperties).length).toEqual(4);

	expect(deviceProperties['cvr.device.name']).toEqual('7741345684915735');
	expect(c3d.startSession()).toEqual(true);
	let endSession = await c3d.endSession();
	expect(endSession).toEqual(200);;
});

test('Apply device properties, set post-session and send data successfully', async () => {
	expect(c3d.startSession()).toEqual(true)
	c3d.setDeviceName('7741345684915735');
	c3d.setDeviceProperty('DeviceCPU', "i7-4770 CPU @ 3.40GHz");
	c3d.setDeviceProperty('DeviceGPU', "GeForce GTX 970");
	c3d.setDeviceProperty('DeviceMemory', 128);
	c3d.setDeviceProperty('DeviceOS', "chrome os 16.9f");
	c3d.setDeviceProperty('DevicePlatform', "Desktop");
	let deviceProperties = c3d.getDeviceProperties();
	expect(Object.keys(deviceProperties).length).toEqual(6);
	await expect(c3d.sendData()).resolves.toEqual(200);
});

test('Updating device properties post-session', async () => {
	c3d.startSession();
	c3d.setDeviceName('7741345684915735');
	c3d.setDeviceName('7741345684915736');
	c3d.setDeviceProperty('DeviceCPU', "i5");
	c3d.setDeviceProperty('DeviceGPU', "GeForce GTX 170");
	c3d.setDeviceProperty('DeviceMemory', 16);
	c3d.setDeviceProperty('DeviceOS', "chrome os 16.9f");

	c3d.setDeviceProperty('DeviceCPU', "i7-4770 CPU @ 3.40GHz");
	c3d.setDeviceProperty('DeviceGPU', "GeForce GTX 970");
	c3d.setDeviceProperty('DeviceMemory', 128);
	c3d.setDeviceProperty('DevicePlatform', "Desktop");
	let deviceProperties = c3d.getDeviceProperties();
	expect(Object.keys(deviceProperties).length).toEqual(6);
	expect(deviceProperties).toEqual({
		"cvr.device.name": "7741345684915736",
		'cvr.device.cpu': "i7-4770 CPU @ 3.40GHz",
		'cvr.device.gpu': "GeForce GTX 970",
		'cvr.device.memory': 128,
		'cvr.device.platform': 'Desktop',
		'cvr.device.os': "chrome os 16.9f"
	});
	let endSession = await c3d.endSession();
	expect(endSession).toEqual(200);;
});

test('Setting device name to empty string post-session', async () => {
	expect(c3d.startSession()).toEqual(true);
	c3d.setDeviceName("");
	let deviceProperties = c3d.getDeviceProperties();
	expect(deviceProperties['cvr.device.name']).toEqual("");
	let endSession = await c3d.endSession();
	expect(endSession).toEqual(200);;
});

test('Reject ending session if device properties set pre-session without active session', async () => {
	c3d.setDeviceName('7741345684915735');
	c3d.setDeviceName('7741345684915736');
	c3d.setDeviceProperty('DeviceOS', "chrome os 16.9f");
	c3d.setDeviceProperty('DeviceMemory', 128);
	expect(c3d.endSession()).rejects.toEqual('session is not active');
});

test('Setting user and device properties post-session', async () => {
	expect(c3d.startSession()).toEqual(true);
	c3d.setDeviceName("7741345684915735");
	c3d.setDeviceProperty('DeviceMemory', 128);
	c3d.setDeviceProperty('DeviceOS', "chrome os 16.9f");
	await expect(c3d.sendData()).resolves.toEqual(200);

	let deviceProperties = c3d.getDeviceProperties();
	expect(Object.keys(deviceProperties).length).toEqual(3);
	c3d.setUserName("john");
	c3d.setUserProperty("location", "vancouver");
	c3d.setUserProperty("location", "seattle");

	let userProperties = c3d.getUserProperties();
	expect(Object.keys(userProperties).length).toEqual(2);
	let endSession = await c3d.endSession();
	expect(endSession).toEqual(200);
});

test('Apply user and device properties set pre-session and end session successfully', async () => {
	c3d.setUserName("john");
	c3d.setUserProperty("location", "vancouver");
	c3d.setUserProperty("location", "seattle");

	c3d.setDeviceName("7741345684915735");
	c3d.setDeviceProperty('DeviceMemory', 128);
	c3d.setDeviceProperty('DeviceOS', "chrome os 16.9f");

	let deviceProperties = c3d.getDeviceProperties();
	expect(Object.keys(deviceProperties).length).toEqual(3);
	let userProperties = c3d.getUserProperties();
	expect(Object.keys(userProperties).length).toEqual(2);
	expect(c3d.startSession()).toEqual(true);
	let endSession = await c3d.endSession();
	expect(endSession).toEqual(200);
});