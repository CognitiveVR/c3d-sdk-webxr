import { fetch, isBrowser } from './utils/environment';
import Core from './core';

// Define the shape of the QuestionSet response
export interface QuestionSet {
    id: string;
    [key: string]: any; // TODO: Replace 'any' with specific QuestionSet property types
}

class Network {
    private core: typeof Core;

    constructor(core: typeof Core) {
        this.core = core;
    }

    /**
     * Check if network is available
     * @returns {boolean} Whether network appears to be available
     */
    isOnline(): boolean {
        // In browser, check navigator.onLine
        if (isBrowser && navigator && typeof navigator.onLine === 'boolean') {
            return navigator.onLine;
        }
        // In Node or other environments, assume online
        return true;
    }

    /**
     * Make a network call to the Cognitive3D API
     * @param suburl - API endpoint path
     * @param content - Request payload
     * @returns Promise resolving to response status or rejection
     */
    networkCall(suburl: string, content: object): Promise<number | string> {
        return new Promise((resolve, reject) => {
            if (!this.core.sceneData.sceneId || !this.core.sceneData.versionNumber) {
                const msg = 'no scene selected';
                reject(msg);
                return;
            }

            const path = `https://${this.core.config.networkHost}/v${this.core.config.networkVersion}/${suburl}/${this.core.sceneData.sceneId}?version=${this.core.sceneData.versionNumber}`;

            const options = {
                method: 'post',
                headers: {
                    'Authorization': `APIKEY:DATA ${this.core.config.APIKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(content)
            };

            // Check network connectivity
            if (this.isOnline()) {
                fetch(path, options)
                    .then(res => resolve(res.status))
                    .catch(err => {
                        console.error('Network error:', err);
                        reject(err);
                    });
            } else {
                const message = 'Network.networkCall failed: please check internet connection.';
                console.log(message);
                resolve(message);
            }
        });
    }

    /**
     * Get a question set from the Cognitive3D API
     * @param hook - Question set hook
     */
    networkExitpollGet(hook: string): Promise<QuestionSet> {
        return new Promise((resolve, reject) => {
            const path = `https://${this.core.config.networkHost}/v${this.core.config.networkVersion}/questionSetHooks/${hook}/questionSet`;

            console.log(`Network.networkExitpollGet: ${path}`);

            const options = {
                method: 'get',
                headers: {
                    'Authorization': `APIKEY:DATA ${this.core.config.APIKey}`,
                    'Content-Type': 'application/json'
                }
            };

            fetch(path, options)
                .then(response => response.json() as Promise<QuestionSet>)
                .then(payload => resolve(payload))
                .catch(err => reject(err));
        });
    }

    /**
     * Send question set responses to the Cognitive3D API
     * @param questionsetname - Name of the question set
     * @param questionsetversion - Version of the question set
     * @param content - Response payload
     */
    networkExitpollPost(questionsetname: string, questionsetversion: string, content: object): Promise<number> {
        return new Promise((resolve, reject) => {
            const options = {
                method: 'post',
                headers: {
                    'Authorization': `APIKEY:DATA ${this.core.config.APIKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(content)
            };

            const path = `https://${this.core.config.networkHost}/v${this.core.config.networkVersion}/questionSets/${questionsetname}/${questionsetversion}/responses`;

            fetch(path, options)
                .then(res => res.status)
                .then(res => resolve(res))
                .catch(err => {
                    console.error('Error posting exit poll:', err);
                    reject(err);
                });
        });
    }
}

export default Network;