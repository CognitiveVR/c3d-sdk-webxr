import C3DAnalytics from '../src';
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
c3d.setScene('tutorial');
c3d.userId = 'test_id';

beforeEach(async() => {
	c3d.core.resetNewUserDevicProperties();
	if (c3d.isSessionActive()) {
		await expect(c3d.endSession()).resolves.toEqual(200);
	};
});


test('should not be able to request a question set before starting a session', async () => {
	await expect(c3d.exitpoll.requestQuestionSet('app_test_js')).rejects.toEqual('ExitPoll.requestQuestionSet failed: no session active');
});


test('should be able to request a question after starting a session', async () => {
	c3d.startSession();
	expect(c3d.isSessionActive()).toBe(true);
	await expect(c3d.exitpoll.requestQuestionSet('app_test_js')).resolves.toEqual(true);
});


test('should be able to return question set as an object', async () => {
	c3d.startSession();
	expect(c3d.isSessionActive()).toBe(true);
	await expect(c3d.exitpoll.requestQuestionSet('app_test_js')).resolves.toEqual(true);
	expect(c3d.exitpoll.getQuestionSet()).toEqual({"customerId": "placeholder", "id": "testing_app_qs:1", "name": "testing_app_qs", "questions": [{"title": "test_app", "type": "BOOLEAN"}], "status": "active", "title": "testing_app_qs", "version": 1})
});

test('should be able to return question set as a string', async () => {
	c3d.startSession();
	expect(c3d.isSessionActive()).toBe(true);
	await expect(c3d.exitpoll.requestQuestionSet('app_test_js')).resolves.toEqual(true);
	expect(c3d.exitpoll.getQuestionSetString()).toEqual("{\"id\":\"testing_app_qs:1\",\"name\":\"testing_app_qs\",\"customerId\":\"placeholder\",\"status\":\"active\",\"title\":\"testing_app_qs\",\"version\":1,\"questions\":[{\"type\":\"BOOLEAN\",\"title\":\"test_app\"}]}")
});


test('Request Then Get string then Answer', async () => {
	c3d.startSession();
	expect(c3d.isSessionActive()).toBe(true);
	await expect(c3d.exitpoll.requestQuestionSet('app_test_js')).resolves.toEqual(true);
	expect(c3d.exitpoll.getQuestionSetString()).toEqual("{\"id\":\"testing_app_qs:1\",\"name\":\"testing_app_qs\",\"customerId\":\"placeholder\",\"status\":\"active\",\"title\":\"testing_app_qs\",\"version\":1,\"questions\":[{\"type\":\"BOOLEAN\",\"title\":\"test_app\"}]}");
	expect(c3d.exitpoll.fullResponse.answers).toBe(undefined);
	c3d.exitpoll.addAnswer('boolean', 1);
	expect(c3d.exitpoll.fullResponse.answers.length).toBe(1);
	await expect(c3d.exitpoll.sendAllAnswers()).resolves.toEqual(200)
	expect(c3d.exitpoll.fullResponse.answers).toBe(undefined);
});



test('Request Then Get Json then Answer', async () => {
	c3d.startSession();
	expect(c3d.isSessionActive()).toBe(true);
	await expect(c3d.exitpoll.requestQuestionSet('app_test_js')).resolves.toEqual(true);
	expect(c3d.exitpoll.getQuestionSet()).toEqual({"customerId": "placeholder", "id": "testing_app_qs:1", "name": "testing_app_qs", "questions": [{"title": "test_app", "type": "BOOLEAN"}], "status": "active", "title": "testing_app_qs", "version": 1});
	expect(c3d.exitpoll.fullResponse.answers).toBe(undefined);
	c3d.exitpoll.addAnswer('boolean', 1);
	expect(c3d.exitpoll.fullResponse.answers.length).toBe(1);
	await expect(c3d.exitpoll.sendAllAnswers()).resolves.toEqual(200)
	expect(c3d.exitpoll.fullResponse.answers).toBe(undefined);
});



