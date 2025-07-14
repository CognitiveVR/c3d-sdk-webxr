import C3DAnalytics from '../lib/cjs/index.js'; 
import settings from '../settings';

//jest.setTimeout(10000); // 10 seconds

//----------------------SETTING SCENE KEYS FOR SCENE EXPLORER-----------------------//



// global.console = {
//   warn: jest.fn(),
//   log: jest.fn()
// }

/**
* @jest-environment jsdom
*/

/*
const c3d = new C3DAnalytics(settings);
beforeEach(() => {
	c3d.core.resetNewUserDeviceProperties();
	if (c3d.isSessionActive()) {
		c3d.endSession();
	};
});
*/ 

let c3d; 
const scene1 = settings.config.allSceneData[0].sceneName;

beforeEach(async () => {
    
    c3d = new C3DAnalytics(settings);
    c3d.core.resetNewUserDeviceProperties();
	
    if (c3d.isSessionActive()) {
        try {
            await c3d.endSession();
        } catch (error) {
            if (error !== 'session is not active') {
                console.warn('Unexpected error during beforeEach endSession cleanup:', error);
            }
        }
    }
});


test('Test if SDK can buffer custom events even if no scene is explicitly set', async () => {
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
	await expect(c3d.endSession()).rejects.toEqual('no scene selected');
});


test('Should successfully initialize SDK with a configured scene', async () => {
    c3d.setScene(scene1); 
    expect(c3d.core.sceneData.sceneName).toEqual("BasicScene");
    expect(c3d.core.sceneData.sceneId).toEqual("93f486e4-0e22-4650-946a-e64ce527f915"); 
    expect(c3d.core.sceneData.versionNumber).toEqual("1"); 

    c3d.startSession();

    const testPos = [1.0, 2.0, 3.0];
    const testProps = { 'item': 'test_object', 'value': 100 };
    c3d.customEvent.send('TestEventInScene', testPos, testProps);

    // End the session, expecting successful data transmission for the set scene
    await expect(c3d.endSession()).resolves.toEqual(200); 
});
