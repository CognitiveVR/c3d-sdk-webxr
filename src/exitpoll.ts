import Network, { QuestionSet } from './network';
import { CognitiveVRAnalyticsCore, SessionPropertyValue } from './core';
import CustomEvents from './customevent';

// Interface for the Answer object structure
interface Answer {
    type: string;
    value: SessionPropertyValue | null;
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
    [key: string]: unknown; 
}

class ExitPoll {
    private core: CognitiveVRAnalyticsCore;
    private network: Network;
    private customEvent: CustomEvents;
    private currentQuestionSetString: string;
    public fullResponse: FullResponse;
    private currentQuestionSet: QuestionSet | null; 
    private answerType: { [key: string]: string };

    constructor(core: CognitiveVRAnalyticsCore, customEvent: CustomEvents) {
        this.core = core;
        // @ts-ignore: Network expects the default export type
        this.network = new Network(core);
        this.customEvent = customEvent;
        this.currentQuestionSetString = '';
        this.fullResponse = {};
        this.currentQuestionSet = null;
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

    receiveQuestionSet(questionset: QuestionSet, hook: string): void { 
        this.currentQuestionSetString = JSON.stringify(questionset);
        this.fullResponse['hook'] = hook;
        this.fullResponse['userId'] = this.core.userId;
        this.fullResponse['sceneId'] = this.core.sceneData.sceneId;
        this.fullResponse['sessionId'] = this.core.sessionId;
        this.fullResponse['questionSetId'] = questionset.id;
        
        if (questionset.id) {
            let splitquestionid = questionset.id.split(':');
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

    getQuestionSet(): QuestionSet | null {
        if (!this.currentQuestionSet) {
            console.log('ExitPoll.GetQuestionSet no active question set. Returning empty json');
        }
        return this.currentQuestionSet;
    }

    clearQuestionSet(): void {
        this.currentQuestionSetString = '';
        this.currentQuestionSet = null;
        this.fullResponse = {};
    }

    addAnswer(type: string, answer: SessionPropertyValue | null): void { 
        if (!type || answer === undefined) {
            console.error('ExitPoll.addAnswer: cannot add answer, it takes two arguments, type and answer');
            return;
        }
        let anAnswer: Answer = {
            type: this.answerType[type] ? this.answerType[type] : 'BOOlEAN', 
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
            
            if (this.fullResponse.questionSetName && this.fullResponse.questionSetVersion) {
                this.network.networkExitpollPost(this.fullResponse.questionSetName, this.fullResponse.questionSetVersion, this.fullResponse)
                    .then(res => (res === 200) ? resolve(200) : reject(res));
            }

            if (!pos) { pos = [0, 0, 0]; }
            let properties: Record<string, SessionPropertyValue> = {}; 
            properties['userId'] = this.core.userId;
            
            if (this.fullResponse.questionSetId) properties['questionSetId'] = this.fullResponse.questionSetId;
            if (this.fullResponse.hook) properties['hook'] = this.fullResponse.hook;
            
            if (this.fullResponse.answers) {
                for (let i = 0; i < this.fullResponse.answers.length; i++) {
                    const ans = this.fullResponse.answers[i];
                    // strings are only for voice responses. these do not show up in dash
                    if (ans.value !== null) {
                         properties[`Answer${i}`] = (typeof ans.value === 'string') ? 0 : ans.value;
                    }
                }
            }
            this.customEvent.send('cvr.exitpoll', pos, properties);
            this.clearQuestionSet();
        });
    }
}
export default ExitPoll;