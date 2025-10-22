import { v4 as uuidv4 } from 'uuid';
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
		this.trackedObjects = new Map();
	}
	registerObjectCustomId(name, meshname, customid, position, rotation, fileType) {
		for (let i = 0; i < this.objectIds.length; i++) {
			if (this.objectIds[i].id === customid) {
				console.log("DynamicObject.registerObjectCustomId object id " + customid + " already registered");
				break;
			}
		}

		let registerId = this.dynamicObjectId(customid, meshname);
		this.objectIds.push(registerId);

        const finalFileType = fileType || "gltf";
		let dome = this.dynamicObjectManifestEntry(registerId.id, name, meshname, finalFileType);
		this.manifestEntries.push(dome);
		this.fullManifest.push(dome);
		let props = [{ "enabled": true }];

		this.addSnapshot(customid, position, rotation, null, props);

		if ((this.snapshots.length + this.manifestEntries.length) >= this.core.config.dynamicDataLimit) {
			this.sendData();
		}
		return customid;
	};

	registerObject(name, meshname, position, rotation, fileType) {
		let foundRecycledId = false;
		let newObjectId = this.dynamicObjectId(uuidv4(), meshname);

		if (!foundRecycledId) {
			this.objectIds.push(newObjectId);
			const finalFileType = fileType || "gltf";
			let dome = this.dynamicObjectManifestEntry(newObjectId.id, name, meshname, finalFileType);
			this.manifestEntries.push(dome);
			this.fullManifest.push(dome);
		}
		let props = [{ "enabled": true }];
		this.addSnapshot(newObjectId.id, position, rotation, null, props);

		if (this.snapshots.length + this.manifestEntries.length >= this.core.config.dynamicDataLimit) {
			this.sendData();
		}
		return newObjectId.id;
	};

    trackObject(id, object, options = {}) {
        if (!id || !object) {
            console.error("DynamicObject.trackObject: id and object must be provided.");
            return;
        }
        // The core SDK just stores a map of the ID to the engine's object.
        this.trackedObjects.set(id, {
            object: object,
			positionThreshold: options.positionThreshold || 1, // default 1 units 
			rotationThreshold: options.rotationThreshold || 1, 
			scaleThreshold: options.scaleThreshold || 0.1
        });
    }
	addSnapshot(objectId, position, rotation, scale, properties) {
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
		//console.log(`Adding snapshot for ${objectId} at position:`, position, "rotation:", rotation);

		let snapshot = this.dynamicObjectSnapshot(position, rotation, objectId, scale, properties);

		if (this.allEngagements[objectId] && Object.keys(this.allEngagements[objectId]).length > 0) {
			//add engagements to snapshot
			for (let e of this.allEngagements[objectId]) {
				if (!snapshot.engagements) {
					snapshot.engagements = [];
				}
				let engagementEvent = {};
				engagementEvent['engagementtype'] = e.name;
				engagementEvent['engagementparent'] = e.id;
				engagementEvent['engagement_count'] = e.engagementNumber;
				engagementEvent['engagement_time'] = e.isActive ? (this.core.getTimestamp() - e.startTime) : e.endTime;
				snapshot.engagements.push(engagementEvent);
			}

			console.log("all engagements pre " + this.allEngagements[objectId].length);
			this.removeInActiveEngagementsOfAnObject(objectId);
			console.log('all engagements post ' + this.allEngagements[objectId].length);
		}
		this.snapshots.push(snapshot);

		if (this.snapshots.length + this.manifestEntries.length >= this.core.config.dynamicDataLimit) {
			this.sendData();
		}
	};
	removeInActiveEngagementsOfAnObject(objectId) {
		let { length: i } = this.allEngagements[objectId];
		while (i--) {
			if (!this.allEngagements[objectId][i].isActive) {
				this.allEngagements[objectId].splice(i, 1);
			}

			if (!this.activeEngagements[objectId][i].isActive) {
				this.activeEngagements[objectId].splice(i, 1);
			}
		}
	}
	sendData() {
	    return new Promise((resolve, reject) => {
	        if (!this.core.isSessionActive) {
				console.log('DynamicObject.sendData failed: no session active');
	            resolve('DynamicObject.sendData failed: no session active');
	            return;
	        }

	        if ((this.manifestEntries.length + this.snapshots.length) === 0) {
	            resolve('no manifest entries/snapshots');
				console.log('no manifest entries/snapshots');
	            return;
	        }
	        let sendJson = {};
	        sendJson['userid'] = this.core.userId;
	        sendJson['timestamp'] = this.core.getTimestamp();
	        sendJson['sessionid'] = this.core.sessionId;
	        sendJson['part'] = this.jsonPart;
	        this.jsonPart++;

	        let manifest = {};
	        for (let element of this.manifestEntries) {
	            let entryValues = {}
	            entryValues["name"] = element.name;
	            entryValues["mesh"] = element.mesh;
	            entryValues["fileType"] = "gltf"; 
	            manifest[element.id] = entryValues;
	        }
	        sendJson['manifest'] = manifest;

	        // console.warn("Cognitive3D SDK: Sending manifest data...", JSON.stringify(manifest, null, 2));

	        let data = [];
	        for (let element of this.snapshots) {
	            let entry = {};
	            entry['id'] = element.id;
	            entry['time'] = element.time;
	            entry['p'] = element.position;
	            entry['r'] = element.rotation;
				if (element.scale) {
					entry['s'] = element.scale;
				}
	            if (element.engagements && element.engagements.length) { entry['engagements'] = element.engagements }
	            if (element.properties) { entry['properties'] = element.properties }
	            data.push(entry);
	        }

	        sendJson['data'] = data;
	        this.network.networkCall('dynamics', sendJson)
	            .then(res => (res === 200) ? resolve(200) : reject(res));
	        this.manifestEntries = [];
	        this.snapshots = [];
	    });
	};
	dynamicObjectSnapshot(position, rotation, objectId, scale, properties) {
		let ss = {};
		//TODO conversion for xyz = -xzy or whatever
		ss['position'] = position;
		ss['rotation'] = rotation;
		ss['time'] = this.core.getTimestamp()
		ss['id'] = objectId;
		if (scale) {
        	ss['scale'] = scale;
    	}
		if (properties) {
			ss['properties'] = properties;
		}
		return ss;
	};
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

	dynamicObjectManifestEntry(id, name, mesh, fileType) {
		return {
			id,
			name,
			mesh,
            fileType
		}
	};

	endSession() {
		this.fullManifest = [];
		this.manifestEntries = [];
		this.objectIds = [];
		this.snapshots = [];
		this.engagementCount = {};
		this.allEngagements = {};
	};

	//re-add all manifest entries when a scene changes.
	//otherwise there could be snapshots for dynamic
	//objects without any identification in the new scene
	refreshObjectManifest() {
		for (var i = 0; i < this.fullManifest.length; i++) {
			var element = this.fullManifest[i];
			this.manifestEntries.push(element);
		}
	};

	removeObject(objectid, position, rotation) {
		//end any engagements if the object had any active
		this.endActiveEngagements(objectid);

		//one final snapshot to send all the ended engagements
		let props = [{ "enabled": false }];
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
						this.activeEngagements[objectId][i].isActive = false;
						this.activeEngagements[objectId][i]['endTime'] = this.core.getTimestamp() - this.activeEngagements[objectId][i].startTime;
						return;
					}
				} else {
					if (this.activeEngagements[objectId][i].name === name) {
						this.activeEngagements[objectId][i].isActive = false;
						this.activeEngagements[objectId][i]['endTime'] = this.core.getTimestamp() - this.activeEngagements[objectId][i].startTime;
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
				if (this.activeEngagements[objectId].isActive &&
					this.activeEngagements[objectId].name === name &&
					this.activeEngagements[objectId].id === parentId) {
					this.activeEngagements[objectId].isActive = false;
					this.activeEngagements[objectId][i]['endTime'] = this.core.getTimestamp() - this.activeEngagements[objectId][i].startTime;
					return;
				}
			} else {
				if (this.activeEngagements[objectId].name === name) {
					this.activeEngagements[objectId].isActive = false;
					this.activeEngagements[objectId][i]['endTime'] = this.core.getTimestamp() - this.activeEngagements[objectId][i].startTime;
					return;
				}
			}
		}
	}

}
export default DynamicObject;