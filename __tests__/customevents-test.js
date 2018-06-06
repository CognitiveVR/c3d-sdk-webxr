import C3DAnalytics from '../lib';
require('es6-promise').polyfill();
require('isomorphic-fetch');



let settings = {
	config: {
		APIKey: 'L3NAURENC320TQTFBROTMKBN2QUMNWCJ',
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


test('Pre Session No End', () => {
	let pos = [0, 0, 0];
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(0);
	c3d.customEvent.send('testing1', pos);
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(1);
	c3d.setScene('tutorial');
	c3d.startSession();
	c3d.endSession();
});

test('Pre Session End', async () => {
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(0);
	let pos = [0, 0, 0];
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(0);
	c3d.customEvent.send('testing1', pos);
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(1);
	c3d.setScene('tutorial');
	c3d.startSession();
	let endSession = await c3d.endSession();
	expect(endSession).toEqual(200)
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(0);
});

test('Pre Session send', async () => {
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(0);
	let pos = [0, 0, 0];
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(0);
	c3d.customEvent.send('testing1', pos);
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(1);
	c3d.startSession();
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(2);
	c3d.setScene('tutorial');

	expect(c3d.sendData()).resolves.toEqual(200);
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(0);
	c3d.startSession();
	let endSession = await c3d.endSession();
	expect(endSession).toEqual(200);
});

test('PreSession Props Send', async () => {
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(0);
	let pos = [0, 0, 0];
	let props = {
		age: 21,
		location: 'vancouver'
	};
	c3d.setScene('tutorial');
	c3d.customEvent.send('testing1', pos, props)
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(1);
	// c3d.customEvent.send('testing1', pos);
	c3d.setScene('tutorial');
	c3d.startSession();
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(2);
	// expect(c3d.customEvent.batchedCustomEvents.length).toBe(2);
	await expect(c3d.sendData()).resolves.toEqual(200);
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(0);
	let endSession = await c3d.endSession();
	expect(endSession).toEqual(200);
});

test('Send Limit Pre Session Threshold', async () => {
	let pos = [0, 0, 0];
	settings.config.customEventBatchSize = 4 //on the third transaction it should send
	let c3d = new C3DAnalytics(settings);

	c3d.setScene('tutorial');
	
	c3d.customEvent.send('testing1', pos);
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(1);
	c3d.customEvent.send('testing1', pos);
	c3d.customEvent.send('testing1', pos);

	expect(c3d.customEvent.batchedCustomEvents.length).toBe(3);
	c3d.startSession();//fouth transaction, should send all here. 
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(0);
	let endSession = await c3d.endSession();
	expect(endSession).toEqual(200);
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(0);

});

test('Send Limit Pre Session', async () => {
	let pos = [0, 0, 0];
	settings.config.customEventBatchSize = 3 //on the third transaction it should send
	let c3d = new C3DAnalytics(settings);
	c3d.setScene('tutorial');
	c3d.customEvent.send('testing1', pos);
	c3d.startSession();
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(2);

	c3d.customEvent.send('testing1', pos);
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(0);
	let endSession = await c3d.endSession();
	expect(endSession).toEqual(200);
});

test('Send Limit Session', async () => {
	let pos = [0, 0, 0];
	settings.config.customEventBatchSize = 3 //on the third transaction it should send
	let c3d = new C3DAnalytics(settings);
	c3d.setScene('tutorial');

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

