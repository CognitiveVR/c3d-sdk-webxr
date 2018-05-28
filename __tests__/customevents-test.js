import C3DAnalytics from '../lib';
require('es6-promise').polyfill();
require('isomorphic-fetch');



let settings = {
	config: {
		APIKey: 'INTIAL_API',
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

// global.console = {
//   warn: jest.fn(),
//   log: jest.fn()
// }

/**
* @jest-environment jsdom
*/


const c3d = new C3DAnalytics(settings);
beforeEach(() => {
	c3d.core.resetNewUserDevicProperties();
	if (c3d.isSessionActive()) {
		c3d.endSession();
	};
});

afterAll(() => setTimeout(() => {
	console.log('here')
}, 5000));

test('Pre Session No End', () => {
	let pos = [0, 0, 0];
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(0);
	c3d.customEvent.send('testing1', pos);
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(1);
	c3d.startSession();
	c3d.endSession();
});

test('Pre Session End', () => {
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(0);
	let pos = [0, 0, 0];
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(0);
	c3d.customEvent.send('testing1', pos);
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(1);
	c3d.startSession();
	c3d.endSession();
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(0);
});

test('Pre Session send', () => {
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(0);
	let pos = [0, 0, 0];
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(0);
	c3d.customEvent.send('testing1', pos);
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(1);
	c3d.startSession();
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(2);
	expect(c3d.sendData()).toEqual(true);
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(0);
});

test('PreSession Props Send', () => {
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(0);
	let pos = [0, 0, 0];
	let props = {
		age: 21,
		location: 'vancouver'
	};
	c3d.customEvent.send('testing1', pos, props)
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(1);
	// c3d.customEvent.send('testing1', pos);
	c3d.startSession();
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(2);
	// expect(c3d.customEvent.batchedCustomEvents.length).toBe(2);
	c3d.sendData();
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(0);
});

test('Send Limit Pre Session Threshold', () => {
	let pos = [0, 0, 0];
	settings.customEventBatchSize = 3 //on the third transaction it should send
	let c3d = new C3DAnalytics(settings);
	c3d.customEvent.send('testing1', pos);
	c3d.customEvent.send('testing1', pos);
	c3d.customEvent.send('testing1', pos);

	expect(c3d.customEvent.batchedCustomEvents.length).toBe(3);
	c3d.startSession();//fouth transaction, should send all here. 
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(0);
});

test('Send Limit Pre Session', () => {
	let pos = [0, 0, 0];
	settings.customEventBatchSize = 3 //on the third transaction it should send
	let c3d = new C3DAnalytics(settings);

	c3d.customEvent.send('testing1', pos);
	c3d.startSession();
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(2);

	c3d.customEvent.send('testing1', pos);
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(0);
	c3d.endSession();
});

test('Send Limit Session', () => {
	let pos = [0, 0, 0];
	settings.customEventBatchSize = 3 //on the third transaction it should send
	let c3d = new C3DAnalytics(settings);
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
	c3d.endSession();
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(0);
});




