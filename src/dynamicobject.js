import Network from './network';
import uuid from 'uuid/v4';

class DynamicObjectId {
	constructor(id, meshname) {
		id = id;
		used = true;
		meshname = meshname
	}
}


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

		//all engagements that need to be written to snapshots. active or inactive. inactive engagements are removed after being sent
		this.allEngagements = {};
	}
	registerObjectCustomId(name, meshname, customid, position, rotation) {
		for (let i = 0; i < this.objectIds.length; i++) {
			if (this.objectIds[i].id === customid) {
				console.log("DynamicObject.registerObjectCustomId object id " + customid + " already registered");
				break;
			}
		}

		let registerId = this.dynamicObjectId(id, meshname);
		this.objectIds.push(registerId);

		let dome = this.dynamicObjectManifestEntry(registerId.id, name, meshname);
		this.manifestEntries.push(dome);
		this.fullManifest.push(dome);
		let props = {};
		props['enabled'] = true;

		// this.addSnapshot(customid, position, rotation, props);

		if (this.snapshots.length + this.manifestEntries.length >= this.core.config.dynamicDataLimit) {
			this.sendData();
		}
		return;
	};

	registerObject(name, mushname, position, rotation) {
		let foundRecycledId = false;
		let newObjectId = this.dynamicObjectId('0', meshname);

		let nextObjectId = uuid();
		for (let element of this.objectIds) {
			if (element.id === nextObjectId) { nextObjectId = uuid(); continue; }
			if (element.used) { continue; }
			if (element.meshname === meshname) {
				//found an unused objectid
				element.used = true;
				newObjectId = element;
				foundRecycledId = true;
				break;
			}
		}

		if (!foundRecycledId) {
			newObjectId = DynamicObjectId(newObjectId, meshname);
			objectIds.push(newObjectId);
			let dome = DynamicObjectManifestEntry(newObjectId.Id, name, meshname);

			manifestEntries.push(dome);
			fullManifest.push(dome);
		}

		let props = {};
		props['enabled'] = true;
		this.addSnapShot(newObjectId.id, position, rotation, props);
		if (this.snapshots.length + this.manifestEntries.length >= this.core.config.dynamicDataLimit) {
			this.sendData();
		}
		return newObjectId.id;
	};


	addSnapshot(objectId, position, rotation, properties) {
		//if dynamic object id is not in manifest, display warning. likely object ids were cleared from scene change
		let foundId = false;
		for (let element of this.objectIds) {
			if (objectId == element.Id) {
				foundId = true;
				break;
			}
		}
		if (!foundId) {
			console.warn("DynamicObject::Snapshot cannot find objectId " + objectId + " in full manifest. Did you Register this object?");
		}

		let snapshot = this.dynamicObjectSnapshot(position, rotation, objectId, properties);


		if (Object.keys(this.allEngagements[objectId]).length > 0) {
			let i = 0;

			//add engagements to snapshot
			for (let e of this.allEngagements[objectId]) {
				if (e.isActive) {
					let engagementEvent = {};
					engagementEvent['engagementparent'] = objectId;
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

		snapshots.emplace_back(snapshot);

		if (snapshots.size() + manifestEntries.size() >= cvr -> config -> DynamicDataLimit) {
			SendData();
		}
	}

	isInactive() {

	};

	sendData() {
		console.log('sendData.........')
	}
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
	}
	dynamicObjectEngagementEvent(id, engagementName, engagementNumber) {
		let engagementEvent = {};
		engagementEvent['isActive'] = true;

		engagementEvent['startTime'] = -1;
		engagementEvent['name'] = "";
		engagementEvent['objectId'] = "";
		engagementEvent['engagementNumber'] = 0;
		return engagementEvent;
	};



	//used in the client to track which ids are used and which can be reused
	dynamicObjectId(id, meshname) {
		return {
			id,
			used: true
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
}
export default DynamicObject;