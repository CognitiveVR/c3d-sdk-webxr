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
	let object2Is = c3d.dynamicObject.registerObject("object2", "lamp", pos, rot);
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
	let object2Is = c3d.dynamicObject.registerObject("object2", "lamp", pos, rot);
	expect(c3d.dynamicObject.fullManifest.length).toBe(2);
	expect(c3d.dynamicObject.manifestEntries.length).toBe(2);
	expect(c3d.dynamicObject.snapshots.length).toBe(2);
	pos = [0, 0, 5];
	c3d.dynamicObject.addSnapshot(object1Id, pos, rot);
	pos = [0, 1, 6];
	c3d.dynamicObject.addSnapshot(object2Is, pos, rot);
	expect(c3d.dynamicObject.snapshots.length).toBe(4);

	pos = [0, 0, 7];
	c3d.dynamicObject.addSnapshot(object1Id, pos, rot);
	pos = [0, 2, 8];
	c3d.dynamicObject.addSnapshot(object2Is, pos, rot);
	expect(c3d.dynamicObject.snapshots.length).toBe(6);

	pos = [0, 0, 9];
	c3d.dynamicObject.addSnapshot(object1Id, pos, rot);
	pos = [0, 3, 10];
	c3d.dynamicObject.addSnapshot(object2Is, pos, rot);
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
	let object2Is = c3d.dynamicObject.registerObject("object2", "lamp", pos, rot);

	expect(c3d.dynamicObject.fullManifest.length).toBe(2);
	expect(c3d.dynamicObject.manifestEntries.length).toBe(2);
	expect(c3d.dynamicObject.snapshots.length).toBe(2);

	pos = [0, 0, 5];
	c3d.dynamicObject.addSnapshot(object1Id, pos, rot);

	pos = [0, 1, 6];
	c3d.dynamicObject.addSnapshot(object2Is, pos, rot);
	expect(c3d.dynamicObject.snapshots.length).toBe(4);

	pos = [0, 0, 7];
	c3d.dynamicObject.addSnapshot(object1Id, pos, rot);

	pos = [0, 2, 8];
	c3d.dynamicObject.addSnapshot(object2Is, pos, rot);
	expect(c3d.dynamicObject.snapshots.length).toBe(6);

	pos = [0, 0, 9];
	c3d.dynamicObject.addSnapshot(object1Id, pos, rot);

	pos = [0, 3, 10];
	c3d.dynamicObject.addSnapshot(object2Is, pos, rot);

	await expect(c3d.sendData()).resolves.toEqual(200);
	expect(c3d.dynamicObject.snapshots.length).toBe(0);
	expect(c3d.dynamicObject.manifestEntries.length).toBe(0);
	expect(c3d.dynamicObject.fullManifest.length).toBe(2);
	await expect(c3d.endSession()).resolves.toEqual(200);
});


