import C3DAnalytics from '../lib/index.cjs.js';
import settings from '../settings';



//----------------------GAZE TEST FOR SCENE EXPLORER-----------------------//



// global.console = {
//   warn: jest.fn(),
//   log: jest.fn()
// }

/**
* @jest-environment jsdom
*/

const c3d = new C3DAnalytics(settings);
const scene1 = settings.config.allSceneData[0].sceneName;
const scene2 = settings.config.allSceneData[1].sceneName;

beforeEach(async () => {
	c3d.core.resetNewUserDeviceProperties();
	if (c3d.isSessionActive()) {
		await expect(c3d.endSession()).resolves.toEqual(200);
	};
});

test('Buffer gaze data pre-session and clear on session end', async () => {
	let pos = [0, 0, 0];
	let rot = [0, 0, 0, 1];
	c3d.setScene(scene1);

	for (var i = 0; i < 10; i++) {
		pos[1] = i;
		c3d.gaze.recordGaze(pos, rot);
	}
	expect(c3d.gaze.batchedGaze.length).toBe(10);

	c3d.startSession();
	await c3d.endSession();
	expect(c3d.gaze.batchedGaze.length).toBe(0); // no scene to send to - endSession clears everything
});

test('Record gaze data with and without dynamic object ID and send successfully', async () => {
	let pos = [0, 0, 0];
	let point = [0, 0, 0];
	let rot = [0, 0, 0, 1];
	c3d.setScene(scene1);
	c3d.startSession();
	for (var i = 0; i < 10; i++) {
		pos[1] = i;
		c3d.gaze.recordGaze(pos, rot, point); // no object id 
	}
	expect(c3d.gaze.batchedGaze.length).toBe(10);
	c3d.dynamicObject.registerObjectCustomId("object1", "block", "1", pos, rot); 

	for (var i = 0; i < 10; i++) {
		pos[1] = i;
		c3d.gaze.recordGaze(pos, rot, point, '1'); // with object id = '1'  
	}
	expect(c3d.gaze.batchedGaze.length).toBe(20);
	await expect(c3d.sendData()).resolves.toEqual(200);
	expect(c3d.gaze.batchedGaze.length).toBe(0);
	await expect(c3d.endSession()).resolves.toEqual(200);
});