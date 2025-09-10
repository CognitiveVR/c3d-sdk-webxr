import C3DAnalytics from '../lib/cjs/index.cjs.js'; 
import settings from '../settings';


//---------------------- DYNAMICS  -----------------------//



// global.console = {
//   warn: jest.fn(),
//   log: jest.fn()
// }

/**
* @jest-environment jsdom
*/

const c3d = new C3DAnalytics(settings);

const scene1 = settings.config.allSceneData[0].sceneName;
const scene2 = settings.config.allSceneData.length > 1 ? settings.config.allSceneData[1].sceneName : null;

c3d.setScene(scene1);

beforeEach(async () => {
	c3d.core.resetNewUserDeviceProperties();
	if (c3d.isSessionActive()) {
		await expect(c3d.endSession()).resolves.toEqual(200);
	};
});

test('Initialize Session, Register Objects, and Send Data', async () => {
	c3d.startSession();
	let pos = [0, 0, 0];
	let rot = [0, 0, 0, 1];
	let object1Id = c3d.dynamicObject.registerObject("object1", "lamp", pos, rot);
	let object2Id = c3d.dynamicObject.registerObject("object2", "lamp", pos, rot);
	expect(c3d.dynamicObject.fullManifest.length).toBe(2);
	expect(c3d.dynamicObject.manifestEntries.length).toBe(2);
	expect(c3d.dynamicObject.snapshots.length).toBe(2);
	await expect(c3d.endSession()).resolves.toEqual(200);
});

test('Register Objects, Add Snapshots, and Then Send Data', async () => {
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


test('Register Objects in One Scene, Add Snapshots, and Then Send Data', async () => {
	const c3d = new C3DAnalytics(settings);
	c3d.setScene(scene1);
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



test('Register Objects and Add Snapshots with Custom Settings', async () => {

	const c3d = new C3DAnalytics(settings);
	c3d.setScene(scene1);
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

(scene2 ? test : test.skip)('Reset Object Manifest on Scene Change', async () => {
	const c3d = new C3DAnalytics(settings);
	c3d.setScene(scene1); // Set Scene A 
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
	c3d.setScene(scene2); // Set Scene B, refreshes object manifest

	expect(c3d.dynamicObject.manifestEntries.length).toBe(2);

	c3d.dynamicObject.addSnapshot(object1Id, pos, rot);
	c3d.dynamicObject.addSnapshot(object2Id, pos, rot);

	expect(c3d.dynamicObject.manifestEntries.length).toBe(2);
	await expect(c3d.sendData()).resolves.toEqual(200);
	expect(c3d.dynamicObject.manifestEntries.length).toBe(0);

	await expect(c3d.endSession()).resolves.toEqual(200);

});


test('Register Objects with Custom IDs and Send Data', async () => {

	const c3d = new C3DAnalytics(settings);
	c3d.setScene(scene1);
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

test('Register Multiple Objects with Custom IDs', async () => {
	const c3d = new C3DAnalytics(settings);

	c3d.setScene(scene1);
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



test('Automatically Send Snapshots When Batch Limit is Reached', async () => { 

	settings.config.dynamicDataLimit = 5; // keep custom config here
	const c3d = new C3DAnalytics(settings);

	c3d.setScene(scene1);
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


test('Automatically Send Manifest When Batch Limit is Reached', async () => { 
	settings.config.dynamicDataLimit = 5; // custom config 

	const c3d = new C3DAnalytics(settings);

	c3d.setScene(scene1);
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


test('Buffer Objects Registered Before a Session Starts and Send on Start', async () => {
	settings.config.dynamicDataLimit = 5;

	const c3d = new C3DAnalytics(settings);

	c3d.setScene(scene1);
	const pos = [0, 0, 0];
	const rot = [0, 0, 0, 1];


	c3d.dynamicObject.registerObjectCustomId("object1", "lamp", '1', pos, rot);
	expect(c3d.dynamicObject.manifestEntries.length).toBe(1);
	c3d.dynamicObject.registerObjectCustomId("object2", "lamp", '2', pos, rot);
	c3d.dynamicObject.registerObjectCustomId("object3", "lamp", '3', pos, rot); //limit send
	c3d.dynamicObject.registerObjectCustomId("object4", "lamp", '4', pos, rot);
	c3d.dynamicObject.registerObjectCustomId("object5", "lamp", '5', pos, rot);
	c3d.dynamicObject.registerObjectCustomId("object6", "lamp", '6', pos, rot);

	expect(c3d.dynamicObject.manifestEntries.length).toBe(6);

	c3d.startSession();
	c3d.dynamicObject.registerObjectCustomId("object7", "lamp", '7', pos, rot);
	expect(c3d.dynamicObject.manifestEntries.length).toBe(0);

	await expect(c3d.endSession()).resolves.toEqual(200);
});

test('Handle Engagements for Objects That Are Not Yet Registered', async () => {
	const c3d = new C3DAnalytics(settings);
	c3d.setScene(scene1);
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

(scene2 ? test : test.skip)('Track Engagements Across Multiple Scene Changes', async () => {
	const c3d = new C3DAnalytics(settings);
	c3d.setScene(scene1);
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

	c3d.setScene(scene2);
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

test('End Engagements When an Object is Removed from the Scene', async () => {
	const c3d = new C3DAnalytics(settings);
	c3d.setScene(scene1);
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


