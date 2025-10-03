import C3DAnalytics from '../lib/cjs/index.cjs.js'; 
import settings from '../settings';

// global.console = {
//   warn: jest.fn(),
//   log: jest.fn()
// }

/**
* @jest-environment jsdom
*/


const c3d = new C3DAnalytics(settings);
const scene1 = settings.config.allSceneData[0].sceneName;

beforeEach(() => {
	c3d.core.resetNewUserDeviceProperties();
	if (c3d.isSessionActive()) {
		c3d.endSession();
	};
});


test('Buffer custom events before session starts and not send prematurely', () => {
	let pos = [0, 0, 0];
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(0);
	c3d.customEvent.send('testing1', pos);
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(1);
	c3d.setScene(scene1);
	c3d.startSession();
	c3d.endSession();
});

test('Send pre-session custom events and clear buffer on session end', async () => {
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(0);
	let pos = [0, 0, 0];
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(0);
	c3d.customEvent.send('testing1', pos);
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(1);
	c3d.setScene(scene1);
	c3d.startSession();
	let endSession = await c3d.endSession();
	expect(endSession).toEqual(200)
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(0);
});

test('Manually send pre-session buffered custom events and allow new sessions', async () => {
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(0);
	let pos = [0, 0, 0];
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(0);
	c3d.customEvent.send('testing1', pos);
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(1);
	c3d.startSession();
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(2);
	c3d.setScene(scene1);

	expect(c3d.sendData()).resolves.toEqual(200);
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(0);
	c3d.startSession();
	let endSession = await c3d.endSession();
	expect(endSession).toEqual(200);
});

test('Send pre-session custom events with attached properties', async () => {
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(0);
	let pos = [0, 0, 0];
	let props = {
		age: 21,
		location: 'vancouver'
	};
	c3d.setScene(scene1);
	c3d.customEvent.send('testing1', pos, props)
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(1);
	// c3d.customEvent.send('testing1', pos);
	c3d.setScene(scene1);
	c3d.startSession();
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(2);
	// expect(c3d.customEvent.batchedCustomEvents.length).toBe(2);
	await expect(c3d.sendData()).resolves.toEqual(200);
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(0);
	let endSession = await c3d.endSession();
	expect(endSession).toEqual(200);
});

test('Auto-send custom events when session start hits batch limit', async () => {
	let pos = [0, 0, 0];
	settings.config.customEventBatchSize = 4 //on the third transaction it should send
	let c3d = new C3DAnalytics(settings);

	c3d.setScene(scene1);
	
	c3d.customEvent.send('testing1', pos);
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(1);
	c3d.customEvent.send('testing1', pos);
	c3d.customEvent.send('testing1', pos);

	expect(c3d.customEvent.batchedCustomEvents.length).toBe(3);
	c3d.startSession(); // fourth transaction, should send all here. 
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(0);
	let endSession = await c3d.endSession();
	expect(endSession).toEqual(200);
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(0);

});

test('Auto-send pre-session custom events when batch limit is reached', async () => {
	let pos = [0, 0, 0];
	settings.config.customEventBatchSize = 3 // on the third transaction it should send
	let c3d = new C3DAnalytics(settings);
	c3d.setScene(scene1);
	c3d.customEvent.send('testing1', pos);
	c3d.startSession();
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(2);

	c3d.customEvent.send('testing1', pos);
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(0);
	let endSession = await c3d.endSession();
	expect(endSession).toEqual(200);
});

test('Auto-send custom events multiple times during active session', async () => {
	let pos = [0, 0, 0];
	settings.config.customEventBatchSize = 3 // on the third transaction it should send
	let c3d = new C3DAnalytics(settings);
	c3d.setScene(scene1);

	c3d.startSession();
	c3d.customEvent.send('testing1', pos);
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(2);
	c3d.customEvent.send('testing2', pos);
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(0);
	c3d.customEvent.send('testing1', pos);
	c3d.customEvent.send('testing2', pos);
	c3d.customEvent.send('testing3', pos);
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(0);
	c3d.customEvent.send('testing1', pos);

	await expect(c3d.endSession()).resolves.toEqual(200);
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(0);
});

