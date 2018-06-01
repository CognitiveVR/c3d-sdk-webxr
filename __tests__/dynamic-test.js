import C3DAnalytics from '../src';
import settings from '../settings';
require('es6-promise').polyfill();
require('isomorphic-fetch');


//---------------------- DYNAMICS  -----------------------//



// global.console = {
//   warn: jest.fn(),
//   log: jest.fn()
// }

/**
* @jest-environment jsdom
*/

const c3d = new C3DAnalytics(settings);
c3d.setScene('tutorial');

beforeEach(async () => {
	c3d.core.resetNewUserDevicProperties();
	if (c3d.isSessionActive()) {
		await expect(c3d.endSession()).resolves.toEqual(200);
	};
});

test('Init Register Send', async () => {
	c3d.startSession();
	let pos = [0, 0, 0];
	let rot = [0, 0, 0, 1];
	let object1Id = c3d.dynamicObject.registerObject("object1", "lamp", pos, rot);
	let object2Id = c3d.dynamicObject.registerObject("object2", "lamp", pos, rot);
	expect(c3d.dynamicObject.fullManifest.length).toBe(2);
	expect(c3d.dynamicObject.manifestEntries.length).toBe(2);
	expect(c3d.dynamicObject.snapshots.length).toBe(2);
	// await expect(c3d.endSession()).resolves.toEqual(200);
});

test('Init Register Send Add Snapshot ', async () => {
	c3d.startSession();
	let pos = [0, 0, 0];
	let rot = [0, 0, 0, 1];
	let object1Id = c3d.dynamicObject.registerObject("object1", "lamp", pos, rot);
	let object2Id = c3d.dynamicObject.registerObject("object2", "lamp", pos, rot);
	expect(c3d.dynamicObject.fullManifest.length).toBe(2);
	expect(c3d.dynamicObject.manifestEntries.length).toBe(2);
	expect(c3d.dynamicObject.snapshots.length).toBe(2);
	pos = [0, 0, 5];
	c3d.dynamicObject.addSnapshot(object1Id, pos, rot);
	pos = [0, 1, 6];
	c3d.dynamicObject.addSnapshot(object2Id, pos, rot);
	expect(c3d.dynamicObject.snapshots.length).toBe(4);

	pos = [0, 0, 7];
	c3d.dynamicObject.addSnapshot(object1Id, pos, rot);
	pos = [0, 2, 8];
	c3d.dynamicObject.addSnapshot(object2Id, pos, rot);
	expect(c3d.dynamicObject.snapshots.length).toBe(6);

	pos = [0, 0, 9];
	c3d.dynamicObject.addSnapshot(object1Id, pos, rot);
	pos = [0, 3, 10];
	c3d.dynamicObject.addSnapshot(object2Id, pos, rot);
	expect(c3d.dynamicObject.snapshots.length).toBe(8);
	await expect(c3d.sendData()).resolves.toEqual(200);
	expect(c3d.dynamicObject.fullManifest.length).toBe(2);
	expect(c3d.dynamicObject.manifestEntries.length).toBe(0);
	expect(c3d.dynamicObject.snapshots.length).toBe(0);
	await expect(c3d.endSession()).resolves.toEqual(200);
});


test('Init Register Scene Add', async () => {
	const c3d = new C3DAnalytics(settings);
	c3d.setScene('tutorial');
	c3d.startSession();
	let pos = [0, 0, 0];
	let rot = [0, 0, 0, 1];

	let object1Id = c3d.dynamicObject.registerObject("object1", "lamp", pos, rot);
	let object2Id = c3d.dynamicObject.registerObject("object2", "lamp", pos, rot);

	expect(c3d.dynamicObject.fullManifest.length).toBe(2);
	expect(c3d.dynamicObject.manifestEntries.length).toBe(2);
	expect(c3d.dynamicObject.snapshots.length).toBe(2);

	pos = [0, 0, 5];
	c3d.dynamicObject.addSnapshot(object1Id, pos, rot);

	pos = [0, 1, 6];
	c3d.dynamicObject.addSnapshot(object2Id, pos, rot);
	expect(c3d.dynamicObject.snapshots.length).toBe(4);

	pos = [0, 0, 7];
	c3d.dynamicObject.addSnapshot(object1Id, pos, rot);

	pos = [0, 2, 8];
	c3d.dynamicObject.addSnapshot(object2Id, pos, rot);
	expect(c3d.dynamicObject.snapshots.length).toBe(6);

	pos = [0, 0, 9];
	c3d.dynamicObject.addSnapshot(object1Id, pos, rot);

	pos = [0, 3, 10];
	c3d.dynamicObject.addSnapshot(object2Id, pos, rot);

	await expect(c3d.sendData()).resolves.toEqual(200);
	expect(c3d.dynamicObject.snapshots.length).toBe(0);
	expect(c3d.dynamicObject.manifestEntries.length).toBe(0);
	expect(c3d.dynamicObject.fullManifest.length).toBe(2);
	await expect(c3d.endSession()).resolves.toEqual(200);
});



test('Init Register Scene Add snapshot', async () => {
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
				},
				{
					sceneName: 'one',
					sceneId: 'b9d33399-1e13-428e-9559-7d15f28e9683',
					versionNumber: '3'
				},
				{
					sceneName: 'two',
					sceneId: 'b9d33399-1e13-428e-9559-7d15f28e9683',
					versionNumber: '3'
				},
			]
			//if a config is not spicificed then use the default value.
		},
	};
	const c3d = new C3DAnalytics(settings);
	c3d.setScene('tutorial');
	c3d.startSession();
	let pos = [0, 0, 0];
	let rot = [0, 0, 0, 1];

	let object1Id = c3d.dynamicObject.registerObject("object1", "lamp", pos, rot);
	let object2Id = c3d.dynamicObject.registerObject("object2", "lamp", pos, rot);

	expect(c3d.dynamicObject.fullManifest.length).toBe(2);
	expect(c3d.dynamicObject.manifestEntries.length).toBe(2);
	expect(c3d.dynamicObject.snapshots.length).toBe(2);

	pos = [0, 0, 5];
	c3d.dynamicObject.addSnapshot(object1Id, pos, rot);

	pos = [0, 1, 6];
	c3d.dynamicObject.addSnapshot(object2Id, pos, rot);
	expect(c3d.dynamicObject.snapshots.length).toBe(4);

	pos = [0, 0, 7];
	c3d.dynamicObject.addSnapshot(object1Id, pos, rot);

	pos = [0, 2, 8];
	c3d.dynamicObject.addSnapshot(object2Id, pos, rot);
	expect(c3d.dynamicObject.snapshots.length).toBe(6);

	pos = [0, 0, 9];
	c3d.dynamicObject.addSnapshot(object1Id, pos, rot);

	pos = [0, 3, 10];
	c3d.dynamicObject.addSnapshot(object2Id, pos, rot);

	await expect(c3d.sendData()).resolves.toEqual(200);
	expect(c3d.dynamicObject.snapshots.length).toBe(0);
	expect(c3d.dynamicObject.manifestEntries.length).toBe(0);
	expect(c3d.dynamicObject.fullManifest.length).toBe(2);
	await expect(c3d.endSession()).resolves.toEqual(200);
});

test('Reset ObjectIds Scene Change', async () => {
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
				},
				{
					sceneName: 'one',
					sceneId: 'b9d33399-1e13-428e-9559-7d15f28e9683',
					versionNumber: '3'
				},
				{
					sceneName: 'two',
					sceneId: 'b9d33399-1e13-428e-9559-7d15f28e9683',
					versionNumber: '3'
				},
			]
			//if a config is not spicificed then use the default value.
		},
	};

	const c3d = new C3DAnalytics(settings);
	c3d.setScene('one');
	c3d.startSession();
	const pos = [0, 0, 0];
	const rot = [0, 0, 0, 1];

	const object1Id = c3d.dynamicObject.registerObject("object1", "lamp", pos, rot);
	const object2Id = c3d.dynamicObject.registerObject("object2", "lamp", pos, rot);

	const props = {
		enabled: true
	};

	c3d.dynamicObject.addSnapshot(object1Id, pos, rot, props);
	expect(c3d.dynamicObject.manifestEntries.length).toBe(2);
	c3d.dynamicObject.addSnapshot(object1Id, pos, rot);
	c3d.setScene('two');//refreshes object manifest

	expect(c3d.dynamicObject.manifestEntries.length).toBe(2);

	c3d.dynamicObject.addSnapshot(object1Id, pos, rot);
	c3d.dynamicObject.addSnapshot(object2Id, pos, rot);

	expect(c3d.dynamicObject.manifestEntries.length).toBe(2);
	await expect(c3d.sendData()).resolves.toEqual(200);
	expect(c3d.dynamicObject.manifestEntries.length).toBe(0);

	await expect(c3d.endSession()).resolves.toEqual(200);

});


test('Custom Id', async () => {
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
				},
				{
					sceneName: 'one',
					sceneId: 'b9d33399-1e13-428e-9559-7d15f28e9683',
					versionNumber: '3'
				},
				{
					sceneName: 'two',
					sceneId: 'b9d33399-1e13-428e-9559-7d15f28e9683',
					versionNumber: '3'
				},
			]
			//if a config is not spicificed then use the default value.
		},
	};

	const c3d = new C3DAnalytics(settings);
	c3d.setScene('one');
	c3d.startSession();
	const pos = [0, 0, 0];
	const rot = [0, 0, 0, 1];
	const object1Id = '1';
	const object2Id = '2';

	c3d.dynamicObject.registerObjectCustomId("object1", "lamp", object1Id, pos, rot);
	c3d.dynamicObject.registerObjectCustomId("object2", "lamp", object2Id, pos, rot);

	expect(c3d.dynamicObject.manifestEntries.length).toBe(2);
	c3d.dynamicObject.addSnapshot(object1Id, pos, rot);
	c3d.dynamicObject.addSnapshot(object1Id, pos, rot);
	c3d.dynamicObject.addSnapshot(object2Id, pos, rot);
	expect(c3d.dynamicObject.snapshots.length).toBe(5);
	await expect(c3d.sendData()).resolves.toEqual(200);
	expect(c3d.dynamicObject.snapshots.length).toBe(0);
	await expect(c3d.endSession()).resolves.toEqual(200);

});

test('CustomId Multiples', async () => {
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
				},
				{
					sceneName: 'one',
					sceneId: 'b9d33399-1e13-428e-9559-7d15f28e9683',
					versionNumber: '3'
				},
				{
					sceneName: 'two',
					sceneId: 'b9d33399-1e13-428e-9559-7d15f28e9683',
					versionNumber: '3'
				},
			]
			//if a config is not spicificed then use the default value.
		},
	};

	const c3d = new C3DAnalytics(settings);

	c3d.setScene('one');
	c3d.startSession();
	const pos = [0, 0, 0];
	const rot = [0, 0, 0, 1];
	const object1Id = '1';
	const object2Id = '2';
	const object3Id = '3';

	c3d.dynamicObject.registerObjectCustomId("object1", "lamp", object1Id, pos, rot);
	c3d.dynamicObject.registerObjectCustomId("object2", "lamp", object2Id, pos, rot);
	c3d.dynamicObject.registerObjectCustomId("object2", "lamp", object3Id, pos, rot);

	expect(c3d.dynamicObject.objectIds.length).toBe(3);
	expect(c3d.dynamicObject.manifestEntries.length).toBe(3);
	expect(c3d.dynamicObject.fullManifest.length).toBe(3);

	await expect(c3d.endSession()).resolves.toEqual(200);

});



test('Limit Snapshots ', async () => {
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
				},
				{
					sceneName: 'one',
					sceneId: 'b9d33399-1e13-428e-9559-7d15f28e9683',
					versionNumber: '3'
				},
				{
					sceneName: 'two',
					sceneId: 'b9d33399-1e13-428e-9559-7d15f28e9683',
					versionNumber: '3'
				},
			]
			//if a config is not spicificed then use the default value.
		},
	};
	settings.config.dynamicDataLimit = 5;

	const c3d = new C3DAnalytics(settings);

	c3d.setScene('one');
	c3d.startSession();
	const pos = [0, 0, 0];
	const rot = [0, 0, 0, 1];
	const object1Id = '1';

	c3d.dynamicObject.registerObjectCustomId("object1", "lamp", object1Id, pos, rot);

	expect(c3d.dynamicObject.manifestEntries.length).toBe(1);
	expect(c3d.dynamicObject.objectIds.length).toBe(1);
	c3d.dynamicObject.addSnapshot(object1Id, pos, rot);
	c3d.dynamicObject.addSnapshot(object1Id, pos, rot);
	expect(c3d.dynamicObject.snapshots.length).toBe(3);
	c3d.dynamicObject.addSnapshot(object1Id, pos, rot);
	expect(c3d.dynamicObject.snapshots.length).toBe(0);
	c3d.dynamicObject.addSnapshot(object1Id, pos, rot);
	c3d.dynamicObject.addSnapshot(object1Id, pos, rot);
	expect(c3d.dynamicObject.snapshots.length).toBe(2);

	await expect(c3d.endSession()).resolves.toEqual(200);

});


test('Limit Register ', async () => {
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
				},
				{
					sceneName: 'one',
					sceneId: 'b9d33399-1e13-428e-9559-7d15f28e9683',
					versionNumber: '3'
				},
				{
					sceneName: 'two',
					sceneId: 'b9d33399-1e13-428e-9559-7d15f28e9683',
					versionNumber: '3'
				},
			]
			//if a config is not spicificed then use the default value.
		},
	};

	settings.config.dynamicDataLimit = 5;

	const c3d = new C3DAnalytics(settings);

	c3d.setScene('one');
	c3d.startSession();
	const pos = [0, 0, 0];
	const rot = [0, 0, 0, 1];


	c3d.dynamicObject.registerObjectCustomId("object1", "lamp", '1', pos, rot);
	expect(c3d.dynamicObject.manifestEntries.length).toBe(1);
	c3d.dynamicObject.registerObjectCustomId("object2", "lamp", '2', pos, rot);
	c3d.dynamicObject.registerObjectCustomId("object3", "lamp", '3', pos, rot); //limit send
	expect(c3d.dynamicObject.manifestEntries.length).toBe(0);

	c3d.dynamicObject.registerObjectCustomId("object4", "lamp", '4', pos, rot);
	expect(c3d.dynamicObject.manifestEntries.length).toBe(1);

	c3d.dynamicObject.registerObjectCustomId("object5", "lamp", '5', pos, rot);
	expect(c3d.dynamicObject.manifestEntries.length).toBe(2);

	await expect(c3d.endSession()).resolves.toEqual(200);
});


test('Limit Pre Session', async () => {
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
				},
				{
					sceneName: 'one',
					sceneId: 'b9d33399-1e13-428e-9559-7d15f28e9683',
					versionNumber: '3'
				},
				{
					sceneName: 'two',
					sceneId: 'b9d33399-1e13-428e-9559-7d15f28e9683',
					versionNumber: '3'
				},
			]
			//if a config is not spicificed then use the default value.
		},
	};

	settings.config.dynamicDataLimit = 5;

	const c3d = new C3DAnalytics(settings);

	c3d.setScene('one');
	const pos = [0, 0, 0];
	const rot = [0, 0, 0, 1];


	c3d.dynamicObject.registerObjectCustomId("object1", "lamp", '1', pos, rot);
	expect(c3d.dynamicObject.manifestEntries.length).toBe(1);
	c3d.dynamicObject.registerObjectCustomId("object2", "lamp", '2', pos, rot);
	c3d.dynamicObject.registerObjectCustomId("object3", "lamp", '3', pos, rot); //limit send
	c3d.dynamicObject.registerObjectCustomId("object4", "lampa", '4', pos, rot);
	c3d.dynamicObject.registerObjectCustomId("object5", "lamp", '5', pos, rot);
	c3d.dynamicObject.registerObjectCustomId("object6", "lamp", '6', pos, rot);

	expect(c3d.dynamicObject.manifestEntries.length).toBe(6);

	c3d.startSession();
	c3d.dynamicObject.registerObjectCustomId("object7", "lamp", '7', pos, rot);
	expect(c3d.dynamicObject.manifestEntries.length).toBe(0);

	await expect(c3d.endSession()).resolves.toEqual(200);
});


test('Limit Register ', async () => {
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
				},
				{
					sceneName: 'one',
					sceneId: 'b9d33399-1e13-428e-9559-7d15f28e9683',
					versionNumber: '3'
				},
				{
					sceneName: 'two',
					sceneId: 'b9d33399-1e13-428e-9559-7d15f28e9683',
					versionNumber: '3'
				},
			]
			//if a config is not spicificed then use the default value.
		},
	};

	settings.config.dynamicDataLimit = 5;

	const c3d = new C3DAnalytics(settings);

	c3d.setScene('one');
	c3d.startSession();
	const pos = [0, 0, 0];
	const rot = [0, 0, 0, 1];


	c3d.dynamicObject.registerObjectCustomId("object1", "lamp", '1', pos, rot);
	expect(c3d.dynamicObject.manifestEntries.length).toBe(1);
	c3d.dynamicObject.registerObjectCustomId("object2", "lamp", '2', pos, rot);
	c3d.dynamicObject.registerObjectCustomId("object3", "lamp", '3', pos, rot); //limit send
	expect(c3d.dynamicObject.manifestEntries.length).toBe(0);

	c3d.dynamicObject.registerObjectCustomId("object4", "lamp", '4', pos, rot);
	expect(c3d.dynamicObject.manifestEntries.length).toBe(1);

	c3d.dynamicObject.registerObjectCustomId("object5", "lamp", '5', pos, rot);
	expect(c3d.dynamicObject.manifestEntries.length).toBe(2);

	await expect(c3d.endSession()).resolves.toEqual(200);
});


test('Engagement Never Register', async () => {
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
				},
				{
					sceneName: 'one',
					sceneId: 'b9d33399-1e13-428e-9559-7d15f28e9683',
					versionNumber: '3'
				},
				{
					sceneName: 'two',
					sceneId: 'b9d33399-1e13-428e-9559-7d15f28e9683',
					versionNumber: '3'
				},
			]
			//if a config is not spicificed then use the default value.
		},
	};

	const c3d = new C3DAnalytics(settings);
	c3d.setScene('one');
	c3d.startSession();

	const pos = [0, 0, 0];
	const rot = [0, 0, 0, 1];

	c3d.startSession();
	expect(c3d.dynamicObject.manifestEntries.length).toBe(0);
	c3d.dynamicObject.beginEngagement('1', 'grab', 'right_hand');
	c3d.dynamicObject.addSnapshot('1', pos, rot);
	c3d.dynamicObject.endEngagement('1', 'grab', 'right_hand');

	expect(Object.keys(c3d.dynamicObject.activeEngagements).length).toBe(1);
	expect(c3d.dynamicObject.manifestEntries.length).toBe(0);

	c3d.dynamicObject.registerObjectCustomId("object1", "lamp", "1", pos, rot);
	expect(c3d.dynamicObject.manifestEntries.length).toBe(1);
	await expect(c3d.sendData()).resolves.toEqual(200);
	expect(Object.keys(c3d.dynamicObject.activeEngagements).length).toBe(1);
	expect(Object.keys(c3d.dynamicObject.allEngagements).length).toBe(1);

	await expect(c3d.endSession()).resolves.toEqual(200);
});


test('Engagement Scenes', async () => {
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
				},
				{
					sceneName: 'one',
					sceneId: 'b9d33399-1e13-428e-9559-7d15f28e9683',
					versionNumber: '3'
				},
				{
					sceneName: 'two',
					sceneId: 'b9d33399-1e13-428e-9559-7d15f28e9683',
					versionNumber: '3'
				},
			]
			//if a config is not spicificed then use the default value.
		},
	};

	const c3d = new C3DAnalytics(settings);
	c3d.setScene('one');
	c3d.startSession();

	const pos = [0, 0, 0];
	const rot = [0, 0, 0, 1];

	c3d.startSession();
	const object1Id = c3d.dynamicObject.registerObject("object1", "lamp", pos, rot);
	expect(c3d.dynamicObject.manifestEntries.length).toBe(1);
	const object2Id = c3d.dynamicObject.registerObject("object2", "lamp", pos, rot);
	expect(c3d.dynamicObject.manifestEntries.length).toBe(2);

	c3d.dynamicObject.beginEngagement(object1Id, 'grab', 'right_hand');

	c3d.dynamicObject.addSnapshot(object1Id, pos, rot);
	c3d.dynamicObject.endEngagement(object1Id, 'grab', 'right_hand');

	expect(Object.keys(c3d.dynamicObject.activeEngagements).length).toBe(1);
	expect(Object.keys(c3d.dynamicObject.allEngagements).length).toBe(1);

	c3d.setScene('two');
	expect(c3d.dynamicObject.manifestEntries.length).toBe(2);
	c3d.dynamicObject.beginEngagement(object1Id, 'grab', 'right_hand');
	c3d.dynamicObject.addSnapshot(object1Id, pos, rot);
	c3d.dynamicObject.addSnapshot(object2Id, pos, rot);
	c3d.dynamicObject.beginEngagement(object2Id, 'grab', 'right_hand');
	c3d.dynamicObject.endEngagement(object1Id, 'grab', 'right_hand');
	c3d.dynamicObject.endEngagement(object2Id, 'grab', 'right_hand');
	expect(Object.keys(c3d.dynamicObject.activeEngagements).length).toBe(2);
	expect(Object.keys(c3d.dynamicObject.allEngagements).length).toBe(2);

	expect(c3d.dynamicObject.manifestEntries.length).toBe(2);
	await expect(c3d.sendData()).resolves.toEqual(200);
	expect(c3d.dynamicObject.manifestEntries.length).toBe(0);
	await expect(c3d.sendData()).resolves.toEqual(200);
	await expect(c3d.endSession()).resolves.toEqual(200);
});

test('Engagement Remove', async () => {
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
				},
				{
					sceneName: 'one',
					sceneId: 'b9d33399-1e13-428e-9559-7d15f28e9683',
					versionNumber: '3'
				},
				{
					sceneName: 'two',
					sceneId: 'b9d33399-1e13-428e-9559-7d15f28e9683',
					versionNumber: '3'
				},
			]
			//if a config is not spicificed then use the default value.
		},
	};

	const c3d = new C3DAnalytics(settings);
	c3d.setScene('one');
	c3d.startSession();

	const pos = [0, 0, 0];
	const rot = [0, 0, 0, 1];

	c3d.startSession();
	c3d.dynamicObject.registerObjectCustomId("object2", "lamp", '1', pos, rot);
	c3d.dynamicObject.beginEngagement('1', 'grab', 'right_hand');
	c3d.dynamicObject.addSnapshot('1', pos, rot);
	c3d.dynamicObject.removeObject('1', pos,rot)

	expect(Object.keys(c3d.dynamicObject.activeEngagements).length).toBe(1);
	await expect(c3d.sendData()).resolves.toEqual(200);
	expect(Object.keys(c3d.dynamicObject.activeEngagements).length).toBe(1);
	expect(Object.keys(c3d.dynamicObject.activeEngagements).length).toBe(1);
	await expect(c3d.endSession()).resolves.toEqual(200);
});


