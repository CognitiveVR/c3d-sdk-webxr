import C3DAnalytics from '../lib/index.cjs.js';
import settings from '../settings';



//----------------------EXIT POLL TEST -----------------------//
// ENSURE YOU HAVE CREATED A EXIT POLL QUESTION SET ON THE COG3D WEBSITE 
// Remember to assign a hook to your question set --> requestQuestionSet(assigned hook)


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
c3d.setScene(scene1);
c3d.userId = 'webxr_user_id';

beforeEach(async() => {
	c3d.core.resetNewUserDeviceProperties();
	if (c3d.isSessionActive()) {
		await expect(c3d.endSession()).resolves.toEqual(200);
	};
});


test('Fail to request Question Set before session start', async () => {
	await expect(c3d.exitpoll.requestQuestionSet('app_test_js')).rejects.toEqual('ExitPoll.requestQuestionSet failed: no session active');
});


test('Successfully request Question Set after session start', async () => {
	c3d.startSession();
	expect(c3d.isSessionActive()).toBe(true);
	await expect(c3d.exitpoll.requestQuestionSet('app_test_js')).resolves.toEqual(true);
});


test('Return question set as an object', async () => {
    c3d.startSession();
    expect(c3d.isSessionActive()).toBe(true);

    await expect(c3d.exitpoll.requestQuestionSet('app_test_js')).resolves.toEqual(true);

    const questionSet = c3d.exitpoll.getQuestionSet();

    expect(questionSet).toBeInstanceOf(Object);

    expect(questionSet).toHaveProperty('id');
    expect(typeof questionSet.id).toBe('string');

    expect(questionSet).toHaveProperty('name');
    expect(typeof questionSet.name).toBe('string');

    expect(questionSet).toHaveProperty('title');
    expect(typeof questionSet.title).toBe('string');

    expect(questionSet).toHaveProperty('questions');
    expect(Array.isArray(questionSet.questions)).toBe(true);

    if (questionSet.questions.length > 0) {
        const firstQuestion = questionSet.questions[0];
        expect(firstQuestion).toHaveProperty('title');
        expect(typeof firstQuestion.title).toBe('string');
        expect(firstQuestion).toHaveProperty('type');
        expect(typeof firstQuestion.type).toBe('string');
    }
});

test('Return question set as a string', async () => {
    c3d.startSession();
    expect(c3d.isSessionActive()).toBe(true);

    await expect(c3d.exitpoll.requestQuestionSet('app_test_js')).resolves.toEqual(true);

    const questionSetString = c3d.exitpoll.getQuestionSetString();
    
    // Check we received an non-empty string
    expect(typeof questionSetString).toBe('string');
    expect(questionSetString.length).toBeGreaterThan(0);

    // Parse string to check structure 
    let questionSet;
    try {
        questionSet = JSON.parse(questionSetString);
    } catch (e) {
        // This will fail the test if the string is not valid JSON
        throw new Error("Failed to parse question set string into JSON");
    }

    expect(questionSet).toBeInstanceOf(Object);
    expect(questionSet).toHaveProperty('id');
    expect(typeof questionSet.id).toBe('string');
    expect(questionSet).toHaveProperty('name');
    expect(typeof questionSet.name).toBe('string');
    expect(questionSet).toHaveProperty('questions');
    expect(Array.isArray(questionSet.questions)).toBe(true);
});

test('Full exit poll workflow (String)', async () => {
    c3d.startSession();
    expect(c3d.isSessionActive()).toBe(true);
    await expect(c3d.exitpoll.requestQuestionSet('app_test_js')).resolves.toEqual(true);

    const questionSetString = c3d.exitpoll.getQuestionSetString();

    // Verify valid JSON string
    let questionSet;
    try {
        questionSet = JSON.parse(questionSetString);
    } catch (e) {
        throw new Error("Failed to parse question set string into JSON");
    }

    // Check the structure of the object
    expect(questionSet).toBeInstanceOf(Object);
    expect(questionSet).toHaveProperty('id');
    expect(questionSet).toHaveProperty('questions');
    expect(Array.isArray(questionSet.questions)).toBe(true);

    
    expect(c3d.exitpoll.fullResponse.answers).toBe(undefined);
    c3d.exitpoll.addAnswer('boolean', 1);
    expect(c3d.exitpoll.fullResponse.answers.length).toBe(1);
    await expect(c3d.exitpoll.sendAllAnswers()).resolves.toEqual(200)
    expect(c3d.exitpoll.fullResponse.answers).toBe(undefined);
});



test('Complete full exit poll workflow (JSON)', async () => {
    c3d.startSession();
    expect(c3d.isSessionActive()).toBe(true);
    await expect(c3d.exitpoll.requestQuestionSet('app_test_js')).resolves.toEqual(true);

    const questionSet = c3d.exitpoll.getQuestionSet();

    expect(questionSet).toBeInstanceOf(Object);
    expect(questionSet).toHaveProperty('id');
    expect(typeof questionSet.id).toBe('string');
    expect(questionSet).toHaveProperty('name');
    expect(typeof questionSet.name).toBe('string');
    expect(questionSet).toHaveProperty('questions');
    expect(Array.isArray(questionSet.questions)).toBe(true);

    expect(c3d.exitpoll.fullResponse.answers).toBe(undefined);
    c3d.exitpoll.addAnswer('boolean', 1);
    expect(c3d.exitpoll.fullResponse.answers.length).toBe(1);
    await expect(c3d.exitpoll.sendAllAnswers()).resolves.toEqual(200)
    expect(c3d.exitpoll.fullResponse.answers).toBe(undefined);
});


