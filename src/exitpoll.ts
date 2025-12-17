import Network from './network';
import { CognitiveVRAnalyticsCore } from './core';
import CustomEvents from './customevent';

// Interface for the Answer object structure
interface Answer {
    type: string;
    value: any;
}

// Interface for the FullResponse object structure
interface FullResponse {
    hook?: string;
    userId?: string;
    sceneId?: string;
    sessionId?: string;
    questionSetId?: string;
    questionSetName?: string;
    questionSetVersion?: string;
    answers?: Answer[];
    [key: string]: any;
}

class ExitPoll {
    private core: CognitiveVRAnalyticsCore;
    private network: Network;
    private customEvent: CustomEvents;
    private currentQuestionSetString: string;
    public fullResponse: FullResponse;
    private currentQuestionSet: any;
    private answerType: { [key: string]: string };

    constructor(core: CognitiveVRAnalyticsCore, customEvent: CustomEvents) {
        this.core = core;
        // @ts-ignore: Network expects the default export type
        this.network = new Network(core);
        this.customEvent = customEvent;
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
        };
    }

    requestQuestionSet(hook: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (!this.core.isSessionActive) {
                const msg = 'ExitPoll.requestQuestionSet failed: no session active';
                console.log(msg);
                reject(msg);
                return;
            }
            this.network.networkExitpollGet(hook)
                .then(questionset => {
                    this.receiveQuestionSet(questionset, hook);
                    resolve(true);
                })
                .catch(err => reject(err));
        });
    }

    receiveQuestionSet(questionset: any, hook: string): void {
        this.currentQuestionSetString = JSON.stringify(questionset);
        this.fullResponse['hook'] = hook;
        this.fullResponse['userId'] = this.core.userId;
        this.fullResponse['sceneId'] = this.core.sceneData.sceneId;
        this.fullResponse['sessionId'] = this.core.sessionId;
        this.fullResponse['questionSetId'] = questionset.id;
        
        if (questionset['id']) {
            let splitquestionid = questionset['id'].split(':');
            this.fullResponse['questionSetName'] = splitquestionid[0];
            this.fullResponse['questionSetVersion'] = splitquestionid[1];
        }
        
        this.currentQuestionSet = questionset;
    }

    getQuestionSetString(): string {
        if (!this.currentQuestionSetString) {
            console.log('ExitPoll.currentQuestionSetString no active question set. Returning empty json string');
        }
        return this.currentQuestionSetString;
    }

    getQuestionSet(): any {
        if (!this.currentQuestionSet) {
            console.log('ExitPoll.GetQuestionSet no active question set. Returning empty json');
        }
        return this.currentQuestionSet;
    }

    clearQuestionSet(): void {
        this.currentQuestionSetString = '';
        this.currentQuestionSet = '';
        this.fullResponse = {};
    }

    addAnswer(type: string, answer: any): void {
        if (!type || answer === undefined || answer === null) {
            console.error('ExitPoll.addAnswer: cannot add anser, it takes two arguments, type and answer');
            return;
        }
        let anAnswer: Answer = {
            type: this.answerType[type] ? this.answerType[type] : 'BOOlEAN', // Typo preserved from original JS
            value: answer
        };
        
        if (this.fullResponse['answers'] && Array.isArray(this.fullResponse['answers'])) {
            this.fullResponse.answers.push(anAnswer);
        } else {
            this.fullResponse['answers'] = [anAnswer];
        }
    }

    sendAllAnswers(pos?: number[]): Promise<number | string> {
        return new Promise((resolve, reject) => {

            if (!this.core.isSessionActive) {
                const msg = 'ExitPoll.sendAllAnswers failed: no session active';
                console.log(msg);
                reject(msg);
                return;
            }
            //companyname1234-productname-test/questionSets/:questionset_name/:version#/responses
            if (this.fullResponse.questionSetName && this.fullResponse.questionSetVersion) {
                this.network.networkExitpollPost(this.fullResponse.questionSetName, this.fullResponse.questionSetVersion, this.fullResponse)
                    .then(res => (res === 200) ? resolve(200) : reject(res));
            }

            if (!pos) { pos = [0, 0, 0]; }
            let properties: { [key: string]: any } = {};
            properties['userId'] = this.core.userId;
            properties['questionSetId'] = this.fullResponse.questionSetId;
            properties['hook'] = this.fullResponse.hook;
            
            if (this.fullResponse.answers) {
                for (let i = 0; i < this.fullResponse.answers.length; i++) {
                    //strings are only for voice responses. these do not show up in dash
                    //else bool(0-1), null(-32768), number(0-10)
                    properties[`Answer${i}`] = (typeof this.fullResponse.answers[i].value === 'string') ? 0 :
                        this.fullResponse.answers[i].value;
                }
            }
            this.customEvent.send('cvr.exitpoll', pos, properties);
            this.clearQuestionSet();
        });
    }
}
export default ExitPoll;