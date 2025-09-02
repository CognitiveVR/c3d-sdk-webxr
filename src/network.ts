import { fetch, isBrowser } from './utils/environment';
import CognitiveVRAnalyticsCore from './core';

/**
 * The Network class is responsible for all communication with the Cognitive3D backend API.
 * It handles sending analytics data, fetching configuration, and managing network state.
 */
class Network {
    /** A direct reference to the core SDK instance for accessing session and config data. */
    private core: typeof CognitiveVRAnalyticsCore;

    constructor(core: typeof CognitiveVRAnalyticsCore) {
        this.core = core;
    }

    /**
     * Checks if the network is available by checking the browser's online status.
     * @returns {boolean} Whether the network appears to be available.
     */
    public isOnline(): boolean {
        if (isBrowser && navigator && typeof navigator.onLine === 'boolean') {
            return navigator.onLine;
        }
        return true;
    }

    /**
     * Makes a network call to a specified Cognitive3D API endpoint.
     * @param suburl - The specific API endpoint path (e.g., 'events', 'gaze').
     * @param content - The JSON payload to be sent.
     * @returns A promise that resolves to the HTTP status code or an error message string.
     */
    public async networkCall(suburl: string, content: object): Promise<number | string> {
        if (!this.core.sceneData.sceneId || !this.core.sceneData.versionNumber) {
            return Promise.reject('no scene selected');
        }

        const path = `https://${this.core.config.networkHost}/v${this.core.config.networkVersion}/${suburl}/${this.core.sceneData.sceneId}?version=${this.core.sceneData.versionNumber}`;

        const options: RequestInit = {
            method: 'post',
            headers: {
                'Authorization': `APIKEY:DATA ${this.core.config.APIKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(content)
        };

        if (!this.isOnline()) {
            const message = 'Network.networkCall failed: please check internet connection.';
            console.log(message);
            return Promise.resolve(message);
        }

        try {
            const res = await fetch(path, options);
            return res.status;
        }
        catch (err) {
            console.error('Network error:', err);
            return Promise.reject(err);
        }
    }

    /**
     * Fetches an Exit Poll question set from the Cognitive3D API.
     * @param hook - The unique hook identifier for the desired question set.
     * @returns A promise that resolves to the question set JSON object.
     */
    public async networkExitpollGet(hook: string): Promise<any> {
        const path = `https://${this.core.config.networkHost}/v${this.core.config.networkVersion}/questionSetHooks/${hook}/questionSet`;
        console.log(`Network.networkExitpollGet: ${path}`);

        const options: RequestInit = {
            method: 'get',
            headers: {
                'Authorization': `APIKEY:DATA ${this.core.config.APIKey}`,
                'Content-Type': 'application/json'
            }
        };

        try {
            const response = await fetch(path, options);
            return await response.json();
        } catch (err) {
            return Promise.reject(err);
        }
    }

    /**
     * Sends the user's responses for an Exit Poll to the Cognitive3D API.
     * @param questionsetname - The name of the question set being answered.
     * @param questionsetversion - The version of the question set.
     * @param content - The JSON payload containing the user's answers.
     * @returns A promise that resolves to the HTTP response status code.
     */
    public async networkExitpollPost(questionsetname: string, questionsetversion: string, content: object): Promise<number> {
        const path = `https://${this.core.config.networkHost}/v${this.core.config.networkVersion}/questionSets/${questionsetname}/${questionsetversion}/responses`;

        const options: RequestInit = {
            method: 'post',
            headers: {
                'Authorization': `APIKEY:DATA ${this.core.config.APIKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(content)
        };

        try {
            const res = await fetch(path, options);
            return res.status;
        } catch (err) {
            console.error('Error posting exit poll:', err);
            return Promise.reject(err);
        }
    }
}

export default Network;

