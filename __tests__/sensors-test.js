import C3DAnalytics from '../lib/cjs/index.js'; 
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
const scene1 = settings.config.allSceneData[0].sceneName;
const scene2 = settings.config.allSceneData.length > 1 ? settings.config.allSceneData[1].sceneName : null;


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
	c3d.setScene(scene1);

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
	c3d.setScene(scene1);
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

	c3d.setScene(scene1);
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

	c3d.setScene(scene1);
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

	c3d.setScene(scene1);
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

(scene2 ? test : test.skip)('Flush sensor data when scene changes and end session successfully', async () => {
	settings.config.sensorDataLimit = 15;
	const c3d = new C3DAnalytics(settings);
	c3d.setScene(scene1); // Set Scene A 
	c3d.startSession();

	for (var i = 0; i < 5; i++) {
		c3d.sensor.recordSensor('test-sensor', i);
	}
	expect(c3d.sensor.sensorCount).toBe(5);

	for (var i = 0; i < 5; i++) {
		c3d.sensor.recordSensor('test-sensor', i);
	}
	expect(c3d.sensor.sensorCount).toBe(10);
	c3d.setScene(scene2); // Set Scene B - Scene change
	expect(c3d.sensor.sensorCount).toBe(0);

	await expect(c3d.endSession()).resolves.toEqual(200); 
});

(scene2 ? test : test.skip)('Handle large volume sensor data flushing on scene change', async () => {
	settings.config.sensorDataLimit = 64;
	const c3d = new C3DAnalytics(settings);
	c3d.setScene(scene1); // Set Scene A  
	c3d.startSession();

	for (var i = 0; i < 10; i++) {
		c3d.sensor.recordSensor('test-sensor', i);
	}
	expect(c3d.sensor.sensorCount).toBe(10);

	for (var i = 0; i < 10; i++) {
		c3d.sensor.recordSensor('test-sensor', i);
	}
	expect(c3d.sensor.sensorCount).toBe(20);

	c3d.setScene(scene2); // Set Scene B - Scene change 
	expect(c3d.sensor.sensorCount).toBe(0);

	await expect(c3d.endSession()).resolves.toEqual(200);
});
