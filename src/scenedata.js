class SceneData {
	constructor() {
		this.SceneName = '';
		this.SceneId = '';
		this.VersionNumber = '';
	}
	set sceneName(sceneName) {
		this.SceneName = sceneName;
	}
	set sceneId(sceneId) {
		this.SceneId = sceneId;
	}
	set versionNumber(versionNumber) {
		this.VersionNumber = versionNumber;
	}

}
let intialSceneData = new SceneData();
export default intialSceneData;