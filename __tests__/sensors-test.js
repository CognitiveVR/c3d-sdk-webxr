import C3DAnalytics from '../lib/cjs/index.cjs.js';
import settings from '../settings.ts';

//----------------------SENSORS TEST FOR SCENE EXPLORER-----------------------//

/**
 * @jest-environment jsdom
 */

// Use a variable for the instance to allow re-initialization in tests
let c3d;
const scene1 = settings.config.allSceneData[0].sceneName;
const scene2 = settings.config.allSceneData.length > 1 ? settings.config.allSceneData[1].sceneName : null;

beforeEach(async () => {
	// Initialize a fresh instance for each test to ensure isolation
	c3d = new C3DAnalytics(settings);
	c3d.core.resetNewUserDeviceProperties();
	if (c3d.isSessionActive()) {
		await c3d.endSession().catch(() => { /* ignore errors in cleanup */ });
	};
});

test('Buffer sensor data before session starts and send successfully after', async () => {
	await c3d.setScene('BasicScene');

	for (var i = 0; i < 10; i++) {
		c3d.sensor.recordSensor('test-sensor', i);
	}
	await c3d.startSession();
	expect(c3d.sensor.sensorCount).toBe(10);
	await expect(c3d.sendData()).resolves.toEqual(200);
	expect(c3d.sensor.sensorCount).toBe(0);
	await expect(c3d.endSession()).resolves.toEqual(200);
});



test('Record sensor data when session is inactive', async () => {
	await c3d.setScene('BasicScene');
	await c3d.startSession();
	await expect(c3d.endSession()).resolves.toEqual(200);

	for (var i = 0; i < 10; i++) {
		c3d.sensor.recordSensor('test-sensor', i);
	}
	expect(c3d.sensor.sensorCount).toBe(10);
});


test('Automatically send sensor data when batch limit is reached (single overflow)', async () => {
	// Modify the config on the test-specific instance
	c3d.core.config.sensorDataLimit = 10;

	// Mock the network call to resolve instantly
	jest.spyOn(c3d.sensor.network, 'networkCall').mockResolvedValue(200);

	await c3d.setScene('BasicScene');
	await c3d.startSession();

	for (var i = 0; i < 5; i++) {
		c3d.sensor.recordSensor('test-sensor', i);
	}
	expect(c3d.sensor.sensorCount).toBe(5);

	for (var i = 0; i < 6; i++) {
		c3d.sensor.recordSensor('test-sensor', i);
	}

	// Wait for the async sendData to complete before asserting
	await new Promise(process.nextTick);

	expect(c3d.sensor.sensorCount).toBe(1);
});

test('Automatically send sensor data when batch limit is reached (exact multiple)', async () => {
	// Modify the config on the test-specific instance
	c3d.core.config.sensorDataLimit = 15;

	// Mock the network call to resolve instantly
	jest.spyOn(c3d.sensor.network, 'networkCall').mockResolvedValue(200);

	await c3d.setScene('BasicScene');
	await c3d.startSession();

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
	
	// Wait for the async sendData to complete before asserting
	await new Promise(process.nextTick);

	expect(c3d.sensor.sensorCount).toBe(0);

});

test('Handle multiple automatic sensor data sends when limit is reached', async () => {
	// Modify the config on the test-specific instance
	c3d.core.config.sensorDataLimit = 15;

	// Mock the network call to resolve instantly
	jest.spyOn(c3d.sensor.network, 'networkCall').mockResolvedValue(200);

	await c3d.setScene('BasicScene');
	await c3d.startSession();

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

	// Wait for the async sendData to complete before asserting
	await new Promise(process.nextTick);
	
	expect(c3d.sensor.sensorCount).toBe(0);

});


test('Buffer sensor data before session starts and allow manual send', async () => {
	// Modify the config on the test-specific instance
	c3d.core.config.sensorDataLimit = 15;

	for (var i = 0; i < 5; i++) {
		c3d.sensor.recordSensor('test-sensor', i);
	}
	expect(c3d.sensor.sensorCount).toBe(5);

	for (var i = 0; i < 5; i++) {
		c3d.sensor.recordSensor('test-sensor', i);
	}
	expect(c3d.sensor.sensorCount).toBe(10);

	await c3d.startSession();
	expect(c3d.sensor.sensorCount).toBe(10);
	await expect(c3d.sendData()).resolves.toEqual(200);
	expect(c3d.sensor.sensorCount).toBe(0);
	await expect(c3d.endSession()).resolves.toEqual(200);
});

(scene2 ? test : test.skip)('Flush sensor data when scene changes and end session successfully', async () => {
	// Modify the config on the test-specific instance
	c3d.core.config.sensorDataLimit = 15;

	// Mock all network calls to resolve instantly
	jest.spyOn(c3d.sensor.network, 'networkCall').mockResolvedValue(200);
	jest.spyOn(c3d.customEvent.network, 'networkCall').mockResolvedValue(200);
	jest.spyOn(c3d.dynamicObject.network, 'networkCall').mockResolvedValue(200);
	jest.spyOn(c3d.gaze.network, 'networkCall').mockResolvedValue(200);


	await c3d.setScene(scene1); // Set Scene A
	await c3d.startSession();

	for (var i = 0; i < 5; i++) {
		c3d.sensor.recordSensor('test-sensor', i);
	}
	expect(c3d.sensor.sensorCount).toBe(5);

	for (var i = 0; i < 5; i++) {
		c3d.sensor.recordSensor('test-sensor', i);
	}
	expect(c3d.sensor.sensorCount).toBe(10);
	await c3d.setScene(scene2); // Set Scene B - Scene change should trigger sendData
	expect(c3d.sensor.sensorCount).toBe(0);

	await expect(c3d.endSession()).resolves.toEqual(200);
});

(scene2 ? test : test.skip)('Handle large volume sensor data flushing on scene change', async () => {
	// Modify the config on the test-specific instance
	c3d.core.config.sensorDataLimit = 64;

	// Mock all network calls to resolve instantly
	jest.spyOn(c3d.sensor.network, 'networkCall').mockResolvedValue(200);
	jest.spyOn(c3d.customEvent.network, 'networkCall').mockResolvedValue(200);
	jest.spyOn(c3d.dynamicObject.network, 'networkCall').mockResolvedValue(200);
	jest.spyOn(c3d.gaze.network, 'networkCall').mockResolvedValue(200);


	await c3d.setScene(scene1); // Set Scene A
	await c3d.startSession();

	for (var i = 0; i < 10; i++) {
		c3d.sensor.recordSensor('test-sensor', i);
	}
	expect(c3d.sensor.sensorCount).toBe(10);

	for (var i = 0; i < 10; i++) {
		c3d.sensor.recordSensor('test-sensor', i);
	}
	expect(c3d.sensor.sensorCount).toBe(20);

	await c3d.setScene(scene2); // Set Scene B - Scene change
	expect(c3d.sensor.sensorCount).toBe(0);

	await expect(c3d.endSession()).resolves.toEqual(200);
});

