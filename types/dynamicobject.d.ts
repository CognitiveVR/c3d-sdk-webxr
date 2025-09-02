export default DynamicObject;
declare class DynamicObject {
    constructor(core: any, customEvent: any);
    core: any;
    network: Network;
    customEvent: any;
    generatedIdOffset: number;
    jsonPart: number;
    objectIds: any[];
    snapshots: any[];
    fullManifest: any[];
    manifestEntries: any[];
    activeEngagements: {};
    allEngagements: {};
    engagementCounts: {};
    registerObjectCustomId(name: any, meshname: any, customid: any, position: any, rotation: any, fileType: any): void;
    registerObject(name: any, meshname: any, position: any, rotation: any, fileType: any): any;
    addSnapshot(objectId: any, position: any, rotation: any, properties: any): void;
    removeInActiveEngagementsOfAnObject(objectId: any): void;
    sendData(): Promise<any>;
    dynamicObjectSnapshot(position: any, rotation: any, objectId: any, properties: any): {
        position: any;
        rotation: any;
        time: any;
        id: any;
        properties: any;
    };
    dynamicObjectEngagementEvent(id: any, engagementName: any, engagementNumber: any): {
        isActive: boolean;
        startTime: any;
        name: any;
        id: any;
        engagementNumber: any;
    };
    dynamicObjectId(id: any, meshname: any): {
        id: any;
        used: boolean;
        meshname: any;
    };
    dynamicObjectManifestEntry(id: any, name: any, mesh: any, fileType: any): {
        id: any;
        name: any;
        mesh: any;
        fileType: any;
    };
    endSession(): void;
    engagementCount: {} | undefined;
    refreshObjectManifest(): void;
    removeObject(objectid: any, position: any, rotation: any): void;
    beginEngagement(objectId: any, name: any, parentId?: null): void;
    endActiveEngagements(objectId: any): void;
    endEngagement(objectId: any, name: any, parentId: any): void;
}
import Network from './network';
