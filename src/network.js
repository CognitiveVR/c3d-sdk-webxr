import Config from "./config";
import SceneData from './scenedata';
class Network {
	constructor(config) {
		this.c3d = config;
		this.sd = SceneData;
	}


	networkCall(suburl, content) {
		let options = {
			method: 'post',
			headers: new Headers({
				'Authorization': "APIKEY:DATA " + this.c3d.APIKey,
				'Content-Type': 'application/json'
			}),
			body: JSON.stringify(content)
		}
		let path = "https://" + this.c3d.networkHost + "/v" + this.c3d.networkVersion + "/" + suburl + "/" + this.sd.SceneId + "?version=" + this.sd.VersionNumber;
		fetch(path, options)
	}
}

export default Network;