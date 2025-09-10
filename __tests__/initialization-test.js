import C3DAnalytics from '../lib/cjs/index.cjs.js'; 
import settings from '../settings';


/**
* @jest-environment jsdom
*/

const scene1 = settings.config.allSceneData[0].sceneName;

test('Prevent starting multiple sessions simultaneously', async () => {
	let c3d = new C3DAnalytics(settings);
	c3d.setScene(scene1);
	expect(await c3d.startSession()).toBe(true);
    // Subsequent calls should return a promise that resolves to false
	expect(await c3d.startSession()).toBe(false);
	expect(await c3d.startSession()).toBe(false);
	let endSession = await c3d.endSession();
	expect(endSession).toEqual(200);
});

test('Reject ending session when no session is active', async () => {
	let c3d = new C3DAnalytics(settings);
	await expect(c3d.endSession()).rejects.toEqual("session is not active");
	expect(c3d.isSessionActive()).toBe(false);
});

test('Allow multiple consecutive start-end session cycles', async () => {
	let c3d = new C3DAnalytics(settings);
	expect(await c3d.startSession()).toBe(true);
	let endSession = await c3d.endSession();
	expect(endSession).toEqual(200);

	expect(await c3d.startSession()).toBe(true);
	endSession = await c3d.endSession();
	expect(endSession).toEqual(200);

	expect(await c3d.startSession()).toBe(true);
	endSession = await c3d.endSession();
	expect(endSession).toEqual(200);;
});

test('Send custom events and clear buffer on session end', async () => {
	let c3d = new C3DAnalytics(settings);
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(0);
	expect(await c3d.startSession()).toBe(true);
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(1);
	c3d.customEvent.send('testing', [0, 0, 0]);
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(2);
	let endSession = await c3d.endSession();
	expect(endSession).toEqual(200);
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(0);
	expect(c3d.isSessionActive()).toBe(false);
});

test('Reject ending session when inactive and verify event buffer state', async () => {
	let c3d = new C3DAnalytics(settings);
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(0);
	await expect(c3d.endSession()).rejects.toEqual("session is not active");
	expect(c3d.isSessionActive()).toBe(false);
});

test('Successfully start and end a basic session', async () => {
	let c3d = new C3DAnalytics(settings);
	expect(await c3d.startSession()).toBe(true);
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(1);
	let endSession = await c3d.endSession();
	expect(endSession).toEqual(200);
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(0);
	expect(c3d.isSessionActive()).toBe(false);
});