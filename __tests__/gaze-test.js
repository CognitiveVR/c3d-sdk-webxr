import C3DAnalytics from '../lib';
import settings from '../settings';
require('es6-promise').polyfill();
require('isomorphic-fetch');


//----------------------GAZE TEST FOR SCENE EXPLORER-----------------------//



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

test('Gaze then Init Set Scene', async () => {
	let pos = [0, 0, 0];
	let rot = [0, 0, 0, 1];
	c3d.setScene('tutorial');

	for (var i = 0; i < 10; i++) {
		pos[1] = i;
		c3d.gaze.recordGaze(pos, rot);
	}
	expect(c3d.gaze.batchedGaze.length).toBe(10);

	c3d.startSession();
	await c3d.endSession();
	expect(c3d.gaze.batchedGaze.length).toBe(0);//no scene to send to. endsession clears everything
});

test('Gaze on Dynamic', async () => {
	let pos = [0, 0, 0];
	let point = [0, 0, 0];
	let rot = [0, 0, 0, 1];
	c3d.setScene('tutorial');
	c3d.startSession();
	for (var i = 0; i < 10; i++) {
		pos[1] = i;
		c3d.gaze.recordGaze(pos, rot, point);
	}
	expect(c3d.gaze.batchedGaze.length).toBe(10);
	c3d.dynamicObject.registerObjectCustomId("object1", "block", "1", pos, rot);

	for (var i = 0; i < 10; i++) {
		pos[1] = i;
		c3d.gaze.recordGaze(pos, rot, point, '1');
	}
	expect(c3d.gaze.batchedGaze.length).toBe(20);
	await expect(c3d.sendData()).resolves.toEqual(200);
	expect(c3d.gaze.batchedGaze.length).toBe(0);
	await expect(c3d.endSession()).resolves.toEqual(200);
});