import uuid from 'uuid/v4';
import Network from './network';

class DynamicObject {
	constructor(core, customEvent) {
		this.core = core;
		this.network = new Network(core);
		this.customEvent = customEvent;
		this.generatedIdOffset = 1000;
		this.jsonPart = 1;
		//tracks all used ids in client
		this.objectIds = [];
		//oustanding snapshots of dynamic objects. cleared on send
		this.snapshots = [];
		//all objects that have existed in the scene. resent on scene change
		this.fullManifest = [];
		//all objects that have not yet been sent to SceneExplorer. cleared on send
		this.manifestEntries = [];
		//engagements that are currently active
		this.activeEngagements = {};
		//all engagements that need to be written to snapshots. active or inactive. inactive engagements are removed after being sent
		this.allEngagements = {};
		//count of engagements on dynamic objects of type
		this.engagementCounts = {};
	}
	registerObjectCustomId(name, meshname, customid, position, rotation) {
		for (let i = 0; i < this.objectIds.length; i++) {
			if (this.objectIds[i].id === customid) {
				console.log("DynamicObject.registerObjectCustomId object id " + customid + " already registered");
				break;
			}
		}

		let registerId = this.dynamicObjectId(customid, meshname);
		this.objectIds.push(registerId);

		let dome = this.dynamicObjectManifestEntry(registerId.id, name, meshname);
		this.manifestEntries.push(dome);
		this.fullManifest.push(dome);
		let props = {};
		props['enabled'] = true;

		this.addSnapshot(customid, position, rotation, props);

		if ((this.snapshots.length + this.manifestEntries.length) >= this.core.config.dynamicDataLimit) {
			this.sendData();
		}
		return;
	};

	registerObject(name, meshname, position, rotation) {
		let foundRecycledId = false;
		let newObjectId = this.dynamicObjectId(uuid(), meshname);

		if (!foundRecycledId) {
			this.objectIds.push(newObjectId);
			let dome = this.dynamicObjectManifestEntry(newObjectId.id, name, meshname);
			this.manifestEntries.push(dome);
			this.fullManifest.push(dome);
		}
		let props = {};
		props['enabled'] = true;
		this.addSnapshot(newObjectId.id, position, rotation, props);

		if (this.snapshots.length + this.manifestEntries.length >= this.core.config.dynamicDataLimit) {
			this.sendData();
		}
		return newObjectId.id;
	};


	addSnapshot(objectId, position, rotation, properties) {
		//if dynamic object id is not in manifest, display warning. likely object ids were cleared from scene change
		let foundId = false;
		for (let element of this.objectIds) {
			if (objectId === element.id) {
				foundId = true;
				break;
			}
		}
		if (!foundId) {
			console.warn("DynamicObject::Snapshot cannot find objectId " + objectId + " in full manifest. Did you Register this object?");
		}

		let snapshot = this.dynamicObjectSnapshot(position, rotation, objectId, properties);

		if (this.allEngagements[objectId] && Object.keys(this.allEngagements[objectId]).length > 0) {
			let i = 0;
			//add engagements to snapshot
			for (let e of this.allEngagements[objectId]) {
				if (e.isActive) {
					if (!snapshot.engagements) {
						snapshot.engagements = [];
					}

					let engagementEvent = {};
					engagementEvent['engagementtype'] = e.name;
					engagementEvent['engagementparent'] = e.id;
					engagementEvent['engagement_count'] = e.engagementNumber;
					engagementEvent['engagement_time'] = this.core.getTimestamp() - e.startTime;
					snapshot.engagements.push(engagementEvent);
				}
			}



			console.log("all engagements pre " + this.allEngagements[objectId].length);
			//remove inactive engagements https://en.wikipedia.org/wiki/Erase%E2%80%93remove_idiom
			// this.allEngagements[objectId].erase(:: std:: remove_if(allEngagements[objectId].begin(), allEngagements[objectId].end(), isInactive), allEngagements[objectId].end());
			// cvr -> log -> Info("all engagements post " + std:: to_string(allEngagements[objectId].size()));
		}

		this.snapshots.push(snapshot);
		if (this.snapshots.length + this.manifestEntries.length >= this.core.config.dynamicDataLimit) {
			this.sendData();
		}
	};

	isInactive() {

	};

	sendData() {
		if (!this.core.isSessionActive) {
			console.log("DynamicObject.sendData failed: no session active");
			return;
		}

		if ((this.manifestEntries.length + this.snapshots.length) === 0) {
			return;
		}
		let sendJson = {};
		sendJson['userid'] = this.core.userId;
		sendJson['timestamp'] = this.core.getTimestamp();
		sendJson['sessionid'] = this.core.sessionId;
		sendJson['part'] = this.jsonPart;
		this.jsonPart++

		let manifest = {};
		for (let element of this.manifestEntries) {
			let entryValues = {}
			entryValues["name"] = element.name;
			entryValues["mesh"] = element.meshname;
			manifest[element.id] = entryValues;
		}
		sendJson['manifest'] = manifest;

		let data = [];

		for (let element of this.snapshots) {
			let entry = {};
			entry['id'] = element.id;
			entry['time'] = element.time;
			entry['p'] = element.position;
			entry['r'] = element.rotation;
			if (element.properties) { entry['properties'] = element.properties }
			data.push(entry);
		}

		sendJson['data'] = data;
		this.network.networkCall('dynamics', sendJson);
		this.manifestEntries = [];
		this.snapshots = [];
	};

	dynamicObjectSnapshot(position, rotation, objectId, properties) {
		let ss = {};
		//TODO conversion for xyz = -xzy or whatever
		ss['position'] = position;
		ss['rotation'] = rotation;
		ss['time'] = this.core.getTimestamp()
		ss['id'] = objectId;
		if (properties) {
			ss['properties'] = properties;
		}
		return ss;
	};

	// dynamicObjectEngagementEvent(id, engagementName, engagementNumber) {
	// 	let engagementEvent = {};
	// 	engagementEvent['isActive'] = true;

	// 	engagementEvent['startTime'] = -1;
	// 	engagementEvent['name'] = "";
	// 	engagementEvent['objectId'] = "";
	// 	engagementEvent['engagementNumber'] = 0;
	// 	return engagementEvent;
	// };

	dynamicObjectEngagementEvent(id, engagementName, engagementNumber) {
		let engagementEvent = {};
		engagementEvent['isActive'] = true;
		engagementEvent['startTime'] = this.core.getTimestamp();
		engagementEvent['name'] = engagementName;
		engagementEvent['id'] = id;
		engagementEvent['engagementNumber'] = engagementNumber;
		return engagementEvent;
	};

	//used in the client to track which ids are used and which can be reused
	dynamicObjectId(id, meshname) {
		return {
			id,
			used: true,
			meshname
		}
	};

	dynamicObjectManifestEntry(id, name, mesh) {
		return {
			id,
			name,
			mesh
		}
	};

	endSession() {
		this.fullManifest = [];
		this.manifestEntries = [];
		this.objectIds = [];
		this.snapshots = [];
		// this.engagementCount = null;
		this.allEngagements = {};

	};

	//re-add all manifest entries when a scene changes.
	//otherwise there could be snapshots for dynamic 
	//objects without any identification in the new scene
	refreshObjectManifest() {
		for (let element of this.fullManifest) {
			this.manifestEntries.push(element);
		}
	};

	removeObject(objectid, position, rotation) {
		//end any engagements if the object had any active
		this.endActiveEngagements(objectid);

		//one final snapshot to send all the ended engagements
		let props = {};
		props['enabled'] = false;
		this.addSnapshot(objectid, position, rotation, props);

		for (let i = 0; i < this.objectIds.length; i++) {
			if (this.objectIds[i].id === objectid) {
				this.objectIds[i].used = false;
				return;
			}
		}
	};

	beginEngagement(objectId, name, parentId = null) {
		//parentId is the Id of the object that we are engaging with 
		//objectId is the Id of the object getting engaged
		console.log("DynamicObject::beginEngagement engagement " + name + " on object " + objectId);
		if (!this.engagementCounts[objectId]) {
			this.engagementCounts[objectId] = {};
		}
		if (!this.engagementCounts[objectId][name]) {
			this.engagementCounts[objectId][name] = 1;
		} else {
			this.engagementCounts[objectId][name] = this.engagementCounts[objectId][name] + 1;
		}

		let engagement = this.dynamicObjectEngagementEvent(parentId, name, this.engagementCounts[objectId][name]);
		if (!this.activeEngagements[objectId]) {
			this.activeEngagements[objectId] = [];
		}
		if (!this.allEngagements[objectId]) {
			this.allEngagements[objectId] = [];
		}
		this.activeEngagements[objectId].push(engagement);
		this.allEngagements[objectId].push(engagement);
	};

	endActiveEngagements(objectId) {
		if (!this.activeEngagements[objectId]) return;
		for (let i = 0; i < this.activeEngagements[objectId].length; i++) {
			if (this.activeEngagements[objectId][i].isActive) {
				this.activeEngagements[objectId][i].isActive = false
			}
		}
	};

	endEngagement(objectId, name, parentId) {
		//parentId is the Id of the object that we are engaging with 
		//objectId is the Id of the object getting engaged
		if (this.activeEngagements[objectId]) {
			for (let i = 0; i < this.activeEngagements[objectId].length; i++) {
				if (parentId) {
					if (this.activeEngagements[objectId][i].isActive && this.activeEngagements[objectId][i].name === name && this.activeEngagements[objectId][i].id === parentId) {
						console.log('here1')
						this.activeEngagements[objectId][i].isActive = false;
						return;
					}
				} else {
					if (this.activeEngagements[objectId][i].name === name) {
						this.activeEngagements[objectId][i].isActive = false;
						return;
					}
				}
			}
		}
		// otherwise create and end the engagement
		console.log("DynamicObject::EndEngagement engagement " + name + " not found on object" + objectId + ". Begin+End");
		this.beginEngagement(objectId, name, parentId);
		for (let i = 0; i < this.activeEngagements[objectId].length; i++) {

			if (parentId) {
				debugger;
				if (this.activeEngagements[objectId].isActive &&
					this.activeEngagements[objectId].name === name &&
					this.activeEngagements[objectId].id === parentId) {
					this.activeEngagements[objectId].isActive = false;
					return;
				}
			} else {
				if (this.activeEngagements[objectId].name === name) {
					debugger;
					this.activeEngagements[objectId].isActive = false;
					return;
				}
			}
			// auto rit = activeEngagements[objectId].rbegin();
			// for (; rit != activeEngagements[objectId].rend(); ++rit) {
			// 	if (rit -> Name  name) {
			// 		rit -> isActive = false;
			// 		return;
			// 	}
		}
	}

}
export default DynamicObject;