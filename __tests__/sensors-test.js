import C3DAnalytics from '../lib/index.cjs.js';
import settings from '../settings';

//----------------------SENSORS TEST FOR SCENE EXPLORER-----------------------//



// global.console = {
//   warn: jest.fn(),
//   log: jest.fn()
// }

/**
* @jest-environment jsdom
*/

const c3d = new C3DAnalytics(settings); 
//c3d.setScene('BasicScene');

beforeEach(async () => {
	c3d.core.resetNewUserDeviceProperties();
	if (c3d.isSessionActive()) {
		await expect(c3d.endSession()).resolves.toEqual(200);
	};
});
/*
let c3d = new C3DAnalytics(settings);

beforeEach(async () => {
    c3d = new C3DAnalytics(settings); // Initialize new C3DAnalytics instance for each test

    c3d.core.resetNewUserDeviceProperties();
    if (c3d.isSessionActive()) {
        await expect(c3d.endSession()).resolves.toEqual(200);
    }
});
*/
test('Buffer sensor data before session starts and send successfully after', async () => {
	c3d.setScene('BasicScene');

	for (var i = 0; i < 10; i++) {
		c3d.sensor.recordSensor('test-sensor', i);
	}
	c3d.startSession();
	expect(c3d.sensor.sensorCount).toBe(10);
	await expect(c3d.sendData()).resolves.toEqual(200);
	expect(c3d.sensor.sensorCount).toBe(0);
	await expect(c3d.endSession()).resolves.toEqual(200);
});



test('Record sensor data when session is inactive', async () => {
	c3d.setScene('BasicScene');
	c3d.startSession();
	await expect(c3d.endSession()).resolves.toEqual(200);

	for (var i = 0; i < 10; i++) {
		c3d.sensor.recordSensor('test-sensor', i);
	}
	expect(c3d.sensor.sensorCount).toBe(10);
});


test('Automatically send sensor data when batch limit is reached (single overflow)', async () => {
	settings.config.sensorDataLimit = 10;
	const c3d = new C3DAnalytics(settings);

	c3d.setScene('BasicScene');
	c3d.startSession();

	for (var i = 0; i < 5; i++) {
		c3d.sensor.recordSensor('test-sensor', i);
	}
	expect(c3d.sensor.sensorCount).toBe(5);
	for (var i = 0; i < 6; i++) {
		c3d.sensor.recordSensor('test-sensor', i);
	}
	expect(c3d.sensor.sensorCount).toBe(1);
});

test('Automatically send sensor data when batch limit is reached (exact multiple)', async () => {
	settings.config.sensorDataLimit = 15;
	const c3d = new C3DAnalytics(settings);

	c3d.setScene('BasicScene');
	c3d.startSession();

	for (var i = 0; i < 5; i++) {
		c3d.sensor.recordSensor('test-sensor', i);
	}
	expect(c3d.sensor.sensorCount).toBe(5);
	for (var i = 0; i < 5; i++) {
		c3d.sensor.recordSensor('test-sensor', i);
	}
	expect(c3d.sensor.sensorCount).toBe(10);

	for (var i = 0; i < 5; i++) {
		c3d.sensor.recordSensor('test-sensor', i);
	}
	expect(c3d.sensor.sensorCount).toBe(0);

});

test('Handle multiple automatic sensor data sends when limit is reached', async () => {
	settings.config.sensorDataLimit = 15;
	const c3d = new C3DAnalytics(settings);

	c3d.setScene('BasicScene');
	c3d.startSession();

	for (var i = 0; i < 5; i++) {
		c3d.sensor.recordSensor('test-sensor', i);
	}
	expect(c3d.sensor.sensorCount).toBe(5);

	for (var i = 0; i < 5; i++) {
		c3d.sensor.recordSensor('test-sensor', i);
	}
	expect(c3d.sensor.sensorCount).toBe(10);

	for (var i = 0; i < 5; i++) {
		c3d.sensor.recordSensor('test-sensor', i);
	}
	expect(c3d.sensor.sensorCount).toBe(0);

});


test('Buffer sensor data before session starts and allow manual send', async () => {
	settings.config.sensorDataLimit = 15;
	const c3d = new C3DAnalytics(settings);

	for (var i = 0; i < 5; i++) {
		c3d.sensor.recordSensor('test-sensor', i);
	}
	expect(c3d.sensor.sensorCount).toBe(5);

	for (var i = 0; i < 5; i++) {
		c3d.sensor.recordSensor('test-sensor', i);
	}
	expect(c3d.sensor.sensorCount).toBe(10);

	c3d.startSession();
	expect(c3d.sensor.sensorCount).toBe(10);
	await expect(c3d.sendData()).resolves.toEqual(200);
	expect(c3d.sensor.sensorCount).toBe(0);
	await expect(c3d.endSession()).resolves.toEqual(200);
});

test('Flush sensor data when scene changes and end session successfully', async () => {
	settings.config.sensorDataLimit = 15;
	const c3d = new C3DAnalytics(settings);
	c3d.setScene('BasicScene'); // Set Scene A 
	c3d.startSession();

	for (var i = 0; i < 5; i++) {
		c3d.sensor.recordSensor('test-sensor', i);
	}
	expect(c3d.sensor.sensorCount).toBe(5);

	for (var i = 0; i < 5; i++) {
		c3d.sensor.recordSensor('test-sensor', i);
	}
	expect(c3d.sensor.sensorCount).toBe(10);
	c3d.setScene('AdvancedScene'); // Set Scene B - Scene change
	expect(c3d.sensor.sensorCount).toBe(0);

	await expect(c3d.endSession()).resolves.toEqual(200); 
});

test('Handle large volume sensor data flushing on scene change', async () => {
	settings.config.sensorDataLimit = 64;
	const c3d = new C3DAnalytics(settings);
	c3d.setScene('BasicScene'); // Set Scene A  
	c3d.startSession();

	for (var i = 0; i < 10; i++) {
		c3d.sensor.recordSensor('test-sensor', i);
	}
	expect(c3d.sensor.sensorCount).toBe(10);

	for (var i = 0; i < 10; i++) {
		c3d.sensor.recordSensor('test-sensor', i);
	}
	expect(c3d.sensor.sensorCount).toBe(20);

	c3d.setScene('AdvancedScene'); // Set Scene B - Scene change 
	expect(c3d.sensor.sensorCount).toBe(0);

	await expect(c3d.endSession()).resolves.toEqual(200);
});
