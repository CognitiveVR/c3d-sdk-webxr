import Config from "./config";
import SceneData from './scenedata';
class Network {
	constructor(core) {
		this.core = core;
	}


	networkCall(suburl, content) {
		return new Promise((resolve, reject) => {
			let path = "https://" + this.core.config.networkHost + "/v" + this.core.config.networkVersion + "/" + suburl + "/" + this.core.sceneData.SceneId + "?version=" + this.core.sceneData.VersionNumber;
			let options = {
				method: 'post',
				headers: new Headers({
					'Authorization': "APIKEY:DATA " + this.core.config.APIKey,
					'Content-Type': 'application/json'
				}),
				body: JSON.stringify(content)
			}
			fetch(path, options);
		});
	};
}

export default Network;