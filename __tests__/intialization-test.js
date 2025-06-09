import C3DAnalytics from '../lib/index.cjs.js';
import settings from '../settings';


/*
let settings = {
	config: {
		APIKey: 'YCMPEND2PURSDFAHEHUYEJ6R2F2RQ5QH',
		gazeBatchSize: 64,
		dynamicDataLimit: 64,
		customEventBatchSize: 64,
		HMDType: 'rift',
		sensorDataLimit: 64,
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
			},
			{
				sceneName: 'tutorial',
				sceneId: 'b9d33399-1e13-428e-9559-7d15f28e9683',
				versionNumber: '3'
			}
		]
		//if a config is not spicificed then use the default value.
	},
};
*/

/**
* @jest-environment jsdom
*/

test('Multiple Start Sessions', async () => {
	let c3d = new C3DAnalytics(settings);
	c3d.setScene('BasicScene');
	expect(c3d.startSession()).toBe(true);
	expect(c3d.startSession()).toBe(false);
	expect(c3d.startSession()).toBe(false);
	let endSession = await c3d.endSession();
	expect(endSession).toEqual(200);
});

test('Can End Session', async () => {
	let c3d = new C3DAnalytics(settings);
	expect(c3d.endSession()).rejects.toEqual("session is not active");
	expect(c3d.isSessionActive()).toBe(false);
});

test('Multiple Start & End Sessions', async () => {
	let c3d = new C3DAnalytics(settings);
	expect(c3d.startSession()).toBe(true);
	let endSession = await c3d.endSession();
	expect(endSession).toEqual(200);
	expect(c3d.startSession()).toBe(true);
	endSession = await c3d.endSession();
	expect(endSession).toEqual(200);
	expect(c3d.startSession()).toBe(true);
	endSession = await c3d.endSession();
	expect(endSession).toEqual(200);;
});

test('Initialization and send custom event', async () => {
	let c3d = new C3DAnalytics(settings);
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(0);
	expect(c3d.startSession()).toBe(true);
	//start session sends 'Session Start' custom event
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(1);
	c3d.customEvent.send('testing', [0, 0, 0]);
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(2);
	let endSession = await c3d.endSession();
	expect(endSession).toEqual(200);
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(0);
	expect(c3d.isSessionActive()).toBe(false);
});

test('Session End', async () => {
	let c3d = new C3DAnalytics(settings);
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(0);
	expect(c3d.endSession()).rejects.toEqual("session is not active");
	expect(c3d.isSessionActive()).toBe(false);
});

test('Start session and end session', async () => {
	let c3d = new C3DAnalytics(settings);
	expect(c3d.startSession()).toBe(true);
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(1);
	let endSession = await c3d.endSession();
	expect(endSession).toEqual(200);
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(0);
	expect(c3d.isSessionActive()).toBe(false);
});
