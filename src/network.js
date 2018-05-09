import Config from "./config";
import SceneData from './scenedata';
class Network {
	constructor() {
		this.c3d = Config;
		this.sd = SceneData;
		this.options = {
			method: 'post',
			// mode: 'no-cors',
			headers: new Headers({
				'Authorization': "APIKEY:DATA " + this.c3d.APIKey,
				'Content-Type': 'application/json'
			}),
		}
	}

	networkCall(suburl, content) {
		let path = "https://" + this.c3d.networkHost + "/v" + this.c3d.networkVersion + "/" + suburl + "/" + this.sd.SceneId + "?version=" + this.sd.VersionNumber;
		this.options.body = content
		fetch(path, this.options)
	}
}
export default Network;