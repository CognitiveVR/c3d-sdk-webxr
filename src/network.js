class Network {
	constructor(core) {
		this.core = core;
	}

	networkCall(suburl, content) {
		return new Promise((resolve, reject) => {
			let path = "https://" + this.core.config.networkHost + "/v" + this.core.config.networkVersion + "/" + suburl + "/" + this.core.sceneData.sceneId + "?version=" + this.core.sceneData.versionNumber;
			let options = {
				method: 'post',
				headers: new Headers({
					'Authorization': "APIKEY:DATA " + this.core.config.APIKey,
					'Content-Type': 'application/json'
				}),
				body: JSON.stringify(content)
			}
			if (window && window.navigator && window.navigator.onLine) {
				fetch(path, options);
			} else {
				console.log('Network.networkCall failed: please check internet connection.')
			}
		});
	};

}

export default Network;