import C3DAnalytics from '../lib';
require('es6-promise').polyfill();
require('isomorphic-fetch');



let settings = {
	config: {
		APIKey: 'L3NAURENC320TQTFBROTMKBN2QUMNWCJ',
		gazeBatchSize: 12,
		dynamicDataLimit: 20,
		customEventBatchSize: 3,
		HMDType: 'rift',
		sensorDataLimit: 10,
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
			}
		]
		//if a config is not spicificed then use the default value.
	},
};

/**
* @jest-environment jsdom
*/

test('Multiple Start Sessions', () => {
	let c3d = new C3DAnalytics(settings);
	expect(c3d.startSession()).toBe(true);
	expect(c3d.startSession()).toBe(false);
	expect(c3d.startSession()).toBe(false);
	c3d.endSession();
});

test('Can End Session', () => {
	let c3d = new C3DAnalytics(settings);
	c3d.endSession();
	expect(c3d.isSessionActive()).toBe(false);
});

test('Multiple Start & End Sessions', () => {
	let c3d = new C3DAnalytics(settings);
	expect(c3d.startSession()).toBe(true);
	c3d.endSession();
	expect(c3d.startSession()).toBe(true);
	c3d.endSession();
	expect(c3d.startSession()).toBe(true);
	c3d.endSession();
});

test('Initialization and send custom event', () => {
	let c3d = new C3DAnalytics(settings);
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(0);
	expect(c3d.startSession()).toBe(true);
	//start session sends 'Session Start' custom event
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(1);
	c3d.customEvent.send('testing', [0, 0, 0]);
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(2);
	c3d.endSession();
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(0);
	expect(c3d.isSessionActive()).toBe(false);
});

test('Session End', () => {
	let c3d = new C3DAnalytics(settings);
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(0);
	expect(c3d.endSession()).toBe(undefined);
	expect(c3d.isSessionActive()).toBe(false);
});

test('Start session and end session', () => {
	let c3d = new C3DAnalytics(settings);
	expect(c3d.startSession()).toBe(true);
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(1);
	expect(c3d.endSession()).toBe(true);
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(0);
	expect(c3d.isSessionActive()).toBe(false);
});
