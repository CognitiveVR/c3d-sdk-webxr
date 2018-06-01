import C3DAnalytics from '../lib';
import settings from '../settings';
require('es6-promise').polyfill();
require('isomorphic-fetch');


//----------------------SETTING SCENE KEYS FOR SCENE EXPLORER-----------------------//



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


test('Pre Session No End', async () => {
	let pos = [0, 0, 0]
	c3d.startSession();
	c3d.customEvent.send('testing', pos);
	pos[2] = 1;
	c3d.customEvent.send('testing2', pos);
	pos[2] = 2;
	c3d.customEvent.send('testing2', pos);
	expect(c3d.customEvent.batchedCustomEvents.length).toBe(4);
	expect(c3d.core.sceneData.sceneName).toEqual("");
	expect(c3d.core.sceneData.sceneId).toEqual("");
	expect(c3d.core.sceneData.versionNumber).toEqual("");
	expect(c3d.endSession()).rejects.toEqual('no scene selected');
});

test('init scenes', async () => {
	let scene1 = c3d.sceneData('tutorial_test', 'DELETE_ME_1', '0');
	let scene2 = c3d.sceneData('menu', 'DELETE_ME_2', '0');
	let scene3 = c3d.sceneData('finalboss', 'DELETE_ME_3', '0');
	settings.config.allSceneData.push(scene1);
	settings.config.allSceneData.push(scene2);
	settings.config.allSceneData.push(scene3);
	let c3d1 = new C3DAnalytics(settings);
	c3d1.setScene('tutorial_test');
	expect(c3d1.core.sceneData.sceneName).toEqual("tutorial_test");
	expect(c3d1.core.sceneData.sceneId).toEqual("DELETE_ME_1");
	expect(c3d1.core.sceneData.versionNumber).toEqual("0");
	expect(c3d.endSession()).rejects.toEqual('session is not active');
});
