export default ExitPoll;
declare class ExitPoll {
    constructor(core: any, customEvent: any);
    core: any;
    network: Network;
    customEvent: any;
    currentQuestionSetString: string;
    fullResponse: {};
    currentQuestionSet: {};
    answerType: {
        happySad: string;
        boolean: string;
        thumbs: string;
        scale: string;
        multiple: string;
        voice: string;
    };
    requestQuestionSet(hook: any): Promise<any>;
    receiveQuestionSet(questionset: any, hook: any): void;
    getQuestionSetString(): string;
    getQuestionSet(): {};
    clearQuestionSet(): void;
    addAnswer(type: any, answer: any): void;
    sendAllAnswers(pos: any): Promise<any>;
}
import Network from './network';
