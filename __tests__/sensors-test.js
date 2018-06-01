import C3DAnalytics from '../lib';
import settings from '../settings';
require('es6-promise').polyfill();
require('isomorphic-fetch');


//----------------------SENSORS TEST FOR SCENE EXPLORER-----------------------//



// global.console = {
//   warn: jest.fn(),
//   log: jest.fn()
// }

/**
* @jest-environment jsdom
*/

const c3d = new C3DAnalytics(settings);
// c3d.setScene('tutorial');

beforeEach(async () => {
	c3d.core.resetNewUserDevicProperties();
	if (c3d.isSessionActive()) {
		await expect(c3d.endSession()).resolves.toEqual(200);
	};
});

test('Sense then Init ', async () => {
	c3d.setScene('tutorial');

	for (var i = 0; i < 10; i++) {
		c3d.sensor.recordSensor('test-sensor', i);
	}
	c3d.startSession();
	expect(c3d.sensor.sensorCount).toBe(10);
	await expect(c3d.sendData()).resolves.toEqual(200);
	expect(c3d.sensor.sensorCount).toBe(0);
	await expect(c3d.endSession()).resolves.toEqual(200);
});



test('End Session Then Sense', async () => {
	c3d.setScene('tutorial');
	c3d.startSession();
	await expect(c3d.endSession()).resolves.toEqual(200);

	for (var i = 0; i < 10; i++) {
		c3d.sensor.recordSensor('test-sensor', i);
	}
	expect(c3d.sensor.sensorCount).toBe(10);
});


test('Sensor Limit Single ', async () => {
	settings.config.sensorDataLimit = 10;
	const c3d = new C3DAnalytics(settings);

	c3d.setScene('tutorial');
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

test('Sensor Limit Single ', async () => {
	settings.config.sensorDataLimit = 15;
	const c3d = new C3DAnalytics(settings);

	c3d.setScene('tutorial');
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

test('Sensor Limit Many ', async () => {
	settings.config.sensorDataLimit = 15;
	const c3d = new C3DAnalytics(settings);

	c3d.setScene('tutorial');
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


test('Sense and then set Scene', async () => {
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

test('Set Scene then Sense and then then set Scene another scene', async () => {
	settings.config.sensorDataLimit = 15;
	const c3d = new C3DAnalytics(settings);
	c3d.setScene('tutorial');
	c3d.startSession();

	for (var i = 0; i < 5; i++) {
		c3d.sensor.recordSensor('test-sensor', i);
	}
	expect(c3d.sensor.sensorCount).toBe(5);

	for (var i = 0; i < 5; i++) {
		c3d.sensor.recordSensor('test-sensor', i);
	}
	expect(c3d.sensor.sensorCount).toBe(10);
	c3d.setScene('test_scene1');
	expect(c3d.sensor.sensorCount).toBe(0);

	await expect(c3d.endSession()).resolves.toEqual(400); //not valid scene 
});

test('Many Sensors', async () => {
	settings.config.sensorDataLimit = 64;
	const c3d = new C3DAnalytics(settings);
	c3d.setScene('tutorial');
	c3d.startSession();

	for (var i = 0; i < 10; i++) {
		c3d.sensor.recordSensor('test-sensor', i);
	}
	expect(c3d.sensor.sensorCount).toBe(10);

	for (var i = 0; i < 10; i++) {
		c3d.sensor.recordSensor('test-sensor', i);
	}
	expect(c3d.sensor.sensorCount).toBe(20);

	c3d.setScene('tutorial');
	expect(c3d.sensor.sensorCount).toBe(0);

	await expect(c3d.endSession()).resolves.toEqual(200);
});
