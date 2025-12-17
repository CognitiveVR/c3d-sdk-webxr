import { v4 as uuidv4 } from 'uuid';
import Network from './network';
import { CognitiveVRAnalyticsCore } from './core';
import CustomEvents from './customevent';

// --- Interfaces for Internal State ---

export interface DynamicObjectId {
    id: string;
    used: boolean;
    meshname: string;
}

export interface ManifestEntry {
    id: string;
    name: string;
    mesh: string;
    fileType: string;
}

export interface EngagementEvent {
    isActive: boolean;
    startTime: number;
    name: string;
    id: string | null; // parentId
    engagementNumber: number;
    endTime?: number;
}

export interface Snapshot {
    position: number[];
    rotation: number[];
    time: number;
    id: string;
    scale?: number[] | null;
    properties?: any;
    engagements?: any[];
}

export interface TrackedObjectEntry {
    object: any; // Engine-specific object (Three.js Object3D, etc.)
    positionThreshold: number;
    rotationThreshold: number;
    scaleThreshold: number;
    [key: string]: any; // Allow for engine-specific lastPosition/lastRotation storage
}

class DynamicObject {
    private core: CognitiveVRAnalyticsCore;
    private network: Network;
    private customEvent: CustomEvents;
    private generatedIdOffset: number;
    private jsonPart: number;
    
    // tracks all used ids in client
    public objectIds: DynamicObjectId[];
    
    // oustanding snapshots of dynamic objects. cleared on send
    public snapshots: Snapshot[];
    
    // all objects that have existed in the scene. resent on scene change
    public fullManifest: ManifestEntry[];
    
    // all objects that have not yet been sent to SceneExplorer. cleared on send
    public manifestEntries: ManifestEntry[];
    
    // engagements that are currently active: { objectId: [EngagementEvent, ...] }
    public activeEngagements: { [objectId: string]: EngagementEvent[] };
    
    // all engagements that need to be written to snapshots
    public allEngagements: { [objectId: string]: EngagementEvent[] };
    
    // count of engagements on dynamic objects of type: { objectId: { engagementName: count } }
    private engagementCounts: { [objectId: string]: { [name: string]: number } };
    
    public trackedObjects: Map<string, TrackedObjectEntry>;

    constructor(core: CognitiveVRAnalyticsCore, customEvent: CustomEvents) {
        this.core = core;
        // @ts-ignore
        this.network = new Network(core);
        this.customEvent = customEvent;
        this.generatedIdOffset = 1000;
        this.jsonPart = 1;
        this.objectIds = [];
        this.snapshots = [];
        this.fullManifest = [];
        this.manifestEntries = [];
        this.activeEngagements = {};
        this.allEngagements = {};
        this.engagementCounts = {};
        this.trackedObjects = new Map();
    }

    registerObjectCustomId(name: string, meshname: string, customid: string, position: number[], rotation: number[], fileType?: string): string {
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

        if (this.core.isSessionActive && (this.snapshots.length + this.manifestEntries.length >= this.core.config.dynamicDataLimit)) {
            this.sendData();
        }
        return customid;
    }

    registerObject(name: string, meshname: string, position: number[], rotation: number[], fileType?: string): string {
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

        if (this.core.isSessionActive && (this.snapshots.length + this.manifestEntries.length >= this.core.config.dynamicDataLimit)) {
            this.sendData();
        }
        return newObjectId.id;
    }

    trackObject(id: string, object: any, options: { positionThreshold?: number, rotationThreshold?: number, scaleThreshold?: number } = {}): void {
        if (!id || !object) {
            console.error("DynamicObject.trackObject: id and object must be provided.");
            return;
        }
        // Core SDK just stores a map of the ID to the engine's object.
        this.trackedObjects.set(id, {
            object: object,
            positionThreshold: options.positionThreshold || 0.01, // default units 
            rotationThreshold: options.rotationThreshold || 0.5, 
            scaleThreshold: options.scaleThreshold || 0.05
        });
    }

    addSnapshot(objectId: string, position: number[], rotation: number[], scale?: number[] | null, properties?: any): void {
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
                let engagementEvent: any = {};
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

        if (this.core.isSessionActive && (this.snapshots.length + this.manifestEntries.length >= this.core.config.dynamicDataLimit)) {
            this.sendData();
        }
    }

    removeInActiveEngagementsOfAnObject(objectId: string): void {
        let { length: i } = this.allEngagements[objectId];
        while (i--) {
            if (!this.allEngagements[objectId][i].isActive) {
                this.allEngagements[objectId].splice(i, 1);
            }

            if (this.activeEngagements[objectId] && this.activeEngagements[objectId][i] && !this.activeEngagements[objectId][i].isActive) {
                this.activeEngagements[objectId].splice(i, 1);
            }
        }
    }

    sendData(): Promise<number | string> {
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
            let sendJson: any = {};
            sendJson['userid'] = this.core.userId;
            sendJson['timestamp'] = this.core.getTimestamp();
            sendJson['sessionid'] = this.core.sessionId;
            sendJson['part'] = this.jsonPart;
            this.jsonPart++;

            let manifest: any = {};
            for (let element of this.manifestEntries) {
                let entryValues: any = {};
                entryValues["name"] = element.name;
                entryValues["mesh"] = element.mesh;
                entryValues["fileType"] = "gltf"; 
                manifest[element.id] = entryValues;
            }
            sendJson['manifest'] = manifest;

            // console.warn("Cognitive3D SDK: Sending manifest data...", JSON.stringify(manifest, null, 2));

            let data: any[] = [];
            for (let element of this.snapshots) {
                let entry: any = {};
                entry['id'] = element.id;
                entry['time'] = element.time;
                entry['p'] = element.position;
                entry['r'] = element.rotation;
                if (element.scale) {
                    entry['s'] = element.scale;
                }
                if (element.engagements && element.engagements.length) { entry['engagements'] = element.engagements; }
                if (element.properties) { entry['properties'] = element.properties; }
                data.push(entry);
            }

            sendJson['data'] = data;
            this.network.networkCall('dynamics', sendJson)
                .then(res => (res === 200) ? resolve(200) : reject(res));
            this.manifestEntries = [];
            this.snapshots = [];
        });
    }

    dynamicObjectSnapshot(position: number[], rotation: number[], objectId: string, scale?: number[] | null, properties?: any): Snapshot {
        let ss: Snapshot = {
            position: position,
            rotation: rotation,
            time: this.core.getTimestamp(),
            id: objectId
        };
        //TODO conversion for xyz = -xzy or whatever
        if (scale) {
            ss.scale = scale;
        }
        if (properties) {
            ss.properties = properties;
        }
        return ss;
    }

    dynamicObjectEngagementEvent(id: string | null, engagementName: string, engagementNumber: number): EngagementEvent {
        let engagementEvent: EngagementEvent = {
            isActive: true,
            startTime: this.core.getTimestamp(),
            name: engagementName,
            id: id,
            engagementNumber: engagementNumber
        };
        return engagementEvent;
    }

    //used in the client to track which ids are used and which can be reused
    dynamicObjectId(id: string, meshname: string): DynamicObjectId {
        return {
            id,
            used: true,
            meshname
        };
    }

    dynamicObjectManifestEntry(id: string, name: string, mesh: string, fileType: string): ManifestEntry {
        return {
            id,
            name,
            mesh,
            fileType
        };
    }

    endSession(): void {
        this.fullManifest = [];
        this.manifestEntries = [];
        this.objectIds = [];
        this.snapshots = [];
        this.engagementCounts = {};
        this.allEngagements = {};
        this.activeEngagements = {};
        this.trackedObjects.clear();
    }

    //re-add all manifest entries when a scene changes.
    //otherwise there could be snapshots for dynamic
    //objects without any identification in the new scene
    refreshObjectManifest(): void {
        for (var i = 0; i < this.fullManifest.length; i++) {
            var element = this.fullManifest[i];
            this.manifestEntries.push(element);
        }
    }

    removeObject(objectid: string, position: number[], rotation: number[]): void {
        //end any engagements if the object had any active
        this.endActiveEngagements(objectid);

        //one final snapshot to send all the ended engagements
        let props = [{ "enabled": false }];
        this.addSnapshot(objectid, position, rotation, null, props);

        for (let i = 0; i < this.objectIds.length; i++) {
            if (this.objectIds[i].id === objectid) {
                this.objectIds[i].used = false;
                return;
            }
        }
    }

    beginEngagement(objectId: string, name: string, parentId: string | null = null): void {
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
    }

    endActiveEngagements(objectId: string): void {
        if (!this.activeEngagements[objectId]) return;
        for (let i = 0; i < this.activeEngagements[objectId].length; i++) {
            if (this.activeEngagements[objectId][i].isActive) {
                this.activeEngagements[objectId][i].isActive = false;
            }
        }
    }

    endEngagement(objectId: string, name: string, parentId: string): void {
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
                if (this.activeEngagements[objectId][i].isActive &&
                    this.activeEngagements[objectId][i].name === name &&
                    this.activeEngagements[objectId][i].id === parentId) {
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
}

export default DynamicObject;