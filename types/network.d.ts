export default Network;
declare class Network {
    constructor(core: any);
    core: any;
    /**
     * Check if network is available
     * @returns {boolean} Whether network appears to be available
     */
    isOnline(): boolean;
    /**
     * Make a network call to the Cognitive3D API
     * @param {string} suburl - API endpoint path
     * @param {object} content - Request payload
     * @returns {Promise} - Promise resolving to response status
     */
    networkCall(suburl: string, content: object): Promise<any>;
    /**
     * Get a question set from the Cognitive3D API
     * @param {string} hook - Question set hook
     * @returns {Promise} - Promise resolving to question set
     */
    networkExitpollGet(hook: string): Promise<any>;
    /**
     * Send question set responses to the Cognitive3D API
     * @param {string} questionsetname - Name of the question set
     * @param {string} questionsetversion - Version of the question set
     * @param {object} content - Response payload
     * @returns {Promise} - Promise resolving to response status
     */
    networkExitpollPost(questionsetname: string, questionsetversion: string, content: object): Promise<any>;
}
