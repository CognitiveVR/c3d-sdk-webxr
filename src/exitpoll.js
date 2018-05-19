import Network from './network'
import CustomEvent from './customevent'
class ExitPoll {
	constructor(core) {
		this.core = core;
		this.network = new Network(core);
		this.customEvent = new CustomEvent(core)
		this.currentQuestionSetString = '';
		this.fullResponse = {};
		this.currentQuestionSet = {};
		this.answerType = {
			happySad: 'HAPPYSAD',
			boolean: 'BOOLEAN',
			thumbs: 'THUMBS',
			scale: 'SCALE',
			multiple: 'MULTIPLE',
			voice: 'VOICE'
		}
	}
	requestQuestionSet(hook) {
		return new Promise((resolve, reject) => {
			if (!this.core.isSessionActive) {
				console.log('ExitPoll.requestQuestionSet failed: no session active');
				return;
			}

			this.network.networkExitpollGet(hook, this.exitPollCalback)
				.then(questionset => {
					this.receiveQuestionSet(questionset, hook)
					resolve();
				})
		});
	};

	receiveQuestionSet(questionset, hook) {
		this.currentQuestionSetString = JSON.stringify(questionset);
		this.fullResponse['hook'] = hook;
		this.fullResponse['userId'] = this.core.userId;
		this.fullResponse['sceneId'] = this.core.sceneData.sceneId;
		this.fullResponse['sessionId'] = this.core.sessionId;
		this.fullResponse['questionSetId'] = questionset.id;
		let splitquestionid = questionset['id'].split(':');
		this.fullResponse['questionSetName'] = splitquestionid[0];
		this.fullResponse['questionSetVersion'] = splitquestionid[1];
		this.currentQuestionSet = questionset;
	};

	getQuestionSetString() {
		if (!this.currentQuestionSetString) {
			console.log('ExitPoll.currentQuestionSetString no active question set. Returning empty json string');
		}
		return this.currentQuestionSetString;
	};

	getQuestionSet() {
		if (!this.currentQuestionSet) {
			console.log('ExitPoll.GetQuestionSet no active question set. Returning empty json');
		}
		return this.currentQuestionSet;
	};

	ClearQuestionSet() {
		this.currentQuestionSetString = '';
		this.currentQuestionSet = '';
		this.fullResponse = {};
	};
	addAnswer(type, answer) {
		if (!type || answer === undefined || answer === null) {
			console.error('ExitPoll.addAnswer: cannot add anser, it takes two arguments, type and answer');
			return;
		}
		let anAnswer = {};
		anAnswer['type'] = this.answerType[type] ? this.answerType[type] : 'BOOlEAN';
		anAnswer['value'] = answer;
		if (this.fullResponse['answers'] && Array.isArray(this.fullResponse['answers'])) {
			this.fullResponse.answers.push(anAnswer);
		} else {
			this.fullResponse['answers'] = [anAnswer];
		}
	};
	sendAllAnswers(pos) {
		if (!this.core.isSessionActive) {
			console.log('ExitPoll.sendAllAnswers failed: no session active');
			return;
		}

		//companyname1234-productname-test/questionSets/:questionset_name/:version#/responses
		// this.network.networkExitpollPost(this.fullResponse.questionSetName, this.fullResponse.questionSetVersion, this.fullResponse);

		//TODO: send this as a transaction too
		if (!pos) { pos = [0, 0, 0] }
		// let properties = {};
		// properties['userId'] = this.core.uerId;
		// properties['questionSetId'] = this.fullResponse.questionSetId;
		// properties['hook'] = this.fullResponse.hook;
		// properties['answers']= this.fullResponse.answers;
		this.customEvent.printSomething();
		// cvr -> customevent -> Send('cvr.exitpoll', pos, properties);

		// ClearQuestionSet();
	}
}
export default ExitPoll;