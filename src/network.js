import { fetch, isBrowser } from './utils/environment';

class Network {
  constructor(core) {
    this.core = core;
  }

  /**
   * Check if network is available
   * @returns {boolean} Whether network appears to be available
   */
  isOnline() {
    // In browser, check navigator.onLine
    if (isBrowser && navigator && typeof navigator.onLine === 'boolean') {
      return navigator.onLine;
    }
    // In Node or other environments, assume online
    return true;
  }

  /**
   * Make a network call to the Cognitive3D API
   * @param {string} suburl - API endpoint path
   * @param {object} content - Request payload
   * @returns {Promise} - Promise resolving to response status
   */
  networkCall(suburl, content) {
    return new Promise((resolve, reject) => {
      if (!this.core.sceneData.sceneId || !this.core.sceneData.versionNumber) {
        reject('no scene selected');
        return 'no scene selected';
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
   * @param {string} hook - Question set hook
   * @returns {Promise} - Promise resolving to question set
   */
  networkExitpollGet(hook) {
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
        .then(response => response.json())
        .then(payload => resolve(payload))
        .catch(err => reject(err));
    });
  }

  /**
   * Send question set responses to the Cognitive3D API
   * @param {string} questionsetname - Name of the question set
   * @param {string} questionsetversion - Version of the question set
   * @param {object} content - Response payload
   * @returns {Promise} - Promise resolving to response status
   */
  networkExitpollPost(questionsetname, questionsetversion, content) {
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