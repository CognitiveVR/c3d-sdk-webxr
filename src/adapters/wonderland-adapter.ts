// @ts-ignore
import { vec3, mat4, mat3 } from 'gl-matrix';
// @ts-ignore
import { MeshAttribute, MeshComponent } from '@wonderlandengine/api';
import C3D from '../index';

const COMPONENT_TYPE = { UNSIGNED_SHORT: 5123, UNSIGNED_INT: 5125, FLOAT: 5126 };
const TARGET = { ARRAY_BUFFER: 34962, ELEMENT_ARRAY_BUFFER: 34963 };
const SDK_VERSION = "2.4.2";

class C3DWonderlandAdapter {
    private c3d: C3D;
    private WL: any;
    private exportDirHandle: any = null;

    constructor(c3dInstance: C3D, wonderlandEngineInstance: any) {
        if (!c3dInstance) throw new Error("A C3D instance must be provided.");
        if (!wonderlandEngineInstance) throw new Error("The Wonderland Engine instance (WL) must be provided.");
        this.c3d = c3dInstance;
        this.WL = wonderlandEngineInstance;
        this.c3d.setDeviceProperty('AppEngine', 'Wonderland Engine');
        const version = this.WL.runtimeVersion; 
        this.c3d.setDeviceProperty('AppEngineVersion', `${version.major}.${version.minor}.${version.patch}`);
    }

    // FIX: Use ArrayLike<number> to support both gl-matrix types (Float32Array/IndexedCollection) and number[]
    private fromVector3(vec: ArrayLike<number>): number[] { return [vec[0], vec[1], vec[2]]; }
    private fromQuaternion(quat: ArrayLike<number>): number[] { return [quat[0], quat[1], quat[2], quat[3]]; }

    public recordGazeFromCamera(): void {
        const cameraObject = this.WL.scene.activeViews[0]?.object;
        if (!cameraObject) return;
        
        const position = cameraObject.getTranslationWorld([]);
        const rotation = cameraObject.getRotationWorld([]);
        
        const forwardVector = [0, 0, -1]; 
        const gaze = vec3.create(); 
        // @ts-ignore: gl-matrix types can be strict about number[] vs ReadonlyVec3
        vec3.transformQuat(gaze, forwardVector, rotation);
        
        this.c3d.gaze.recordGaze(this.fromVector3(position), this.fromQuaternion(rotation), this.fromVector3(gaze));
    }

    private _captureScreenshot(): Promise<Blob | null> {
        return new Promise((resolve) => {
            const callback = () => {
                try {
                    this.WL.scene.onPostRender.remove(callback);

                    const canvas = this.WL.canvas;
                    if (!canvas) {
                        console.warn("Cognitive3D: Canvas not found, cannot take screenshot.");
                        resolve(null);
                        return;
                    }

                    canvas.toBlob((blob: Blob | null) => {
                        resolve(blob);
                    }, 'image/png');

                } catch (e) {
                    console.error("Cognitive3D: Screenshot failed", e);
                    resolve(null);
                }
            };

            this.WL.scene.onPostRender.add(callback);
        });
    }

    async _ensureExportDir(): Promise<any> {
        if (this.exportDirHandle) return this.exportDirHandle;
        // @ts-ignore
        if (!window.showDirectoryPicker) return null;
        try {
            // @ts-ignore
            const root = await window.showDirectoryPicker();
            const sceneDir = await root.getDirectoryHandle("scene", { create: true });
            // @ts-ignore
            await sceneDir.requestPermission?.({ mode: "readwrite" }); 
            this.exportDirHandle = sceneDir;
            return sceneDir;
        } catch (err) {
            return null;
        }
    }

    async _writeFile(dirHandle: any, filename: string, content: Blob | ArrayBuffer): Promise<void> {
        if (!content) return;
        const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
        const writable = await fileHandle.createWritable();
        const blob = content instanceof ArrayBuffer ? new Blob([content]) : content;
        await writable.write(blob);
        await writable.close();
    }

    _downloadBlob(blob: Blob, filename: string): void {
        if (!blob) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
    }

    async _performExport(rootObject: any, sceneName: string, scale: number, filterDynamic: boolean): Promise<void> {
        console.log("Cognitive3D: Generating geometry...");
        const binFilename = "scene.bin";
        const {json, binaryBuffer} = this._createGltfData(rootObject, scale, binFilename, filterDynamic);

        if (!json || binaryBuffer.byteLength === 0) {
            console.error("Export failed: No geometry found. Check if MeshComponents are detected.");
            return;
        }

        const gltfBlob = new Blob([JSON.stringify(json, null, 2)], { type: "model/gltf+json" });
        const binBlob = new Blob([binaryBuffer], { type: "application/octet-stream" });
        const settings = { scale: scale, sceneName: sceneName, sdkVersion: SDK_VERSION };
        const settingsBlob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });

        console.log("Cognitive3D: Capturing screenshot...");
        const screenshotBlob = await this._captureScreenshot();

        const dir = await this._ensureExportDir();
        if (dir) {
            await this._writeFile(dir, "scene.bin", binBlob);
            await this._writeFile(dir, "scene.gltf", gltfBlob);
            await this._writeFile(dir, "settings.json", settingsBlob);
            if (screenshotBlob) {
                await this._writeFile(dir, "screenshot.png", screenshotBlob);
            }
            console.log(`Exported static scene files (including screenshot) to '${dir.name}'.`);
        } else {
            console.warn("File System Access API unavailable; downloading files individually.");
            this._downloadBlob(gltfBlob, "scene.gltf");
            this._downloadBlob(binBlob, "scene.bin");
            this._downloadBlob(settingsBlob, "settings.json");
            if (screenshotBlob) this._downloadBlob(screenshotBlob, "screenshot.png");
        }
    }

    _createGltfData(wleObject: any, scale: number, binFilename: string, filterDynamic: boolean): { json: any, binaryBuffer: ArrayBuffer } {
        const meshData: any = { positions: [], normals: [], uvs: [], indices: [], hasNormals: false, hasUvs: false };
        const minBounds = [Infinity, Infinity, Infinity];
        const maxBounds = [-Infinity, -Infinity, -Infinity];

        const FLIP_MATRIX = mat4.fromScaling(mat4.create(), [-1, 1, -1]); 
        const scaleMatrix = mat4.fromScaling(mat4.create(), [scale, scale, scale]);
        const rootMatrix = mat4.multiply(mat4.create(), FLIP_MATRIX, scaleMatrix);

        this._collectAndTransformMeshData(wleObject, rootMatrix, meshData, 0, minBounds, maxBounds, filterDynamic);

        if (meshData.positions.length === 0) return {json: null, binaryBuffer: new ArrayBuffer(0)};

        const posBuffer = new Float32Array(meshData.positions);
        const normBuffer = meshData.hasNormals ? new Float32Array(meshData.normals) : null;
        const uvBuffer = meshData.hasUvs ? new Float32Array(meshData.uvs) : null;
        const use32BitIndices = posBuffer.length / 3 > 65535;
        const indicesBuffer = use32BitIndices ? new Uint32Array(meshData.indices) : new Uint16Array(meshData.indices);

        let byteOffset = 0;
        const totalByteLength = posBuffer.byteLength + (normBuffer?.byteLength ?? 0) + (uvBuffer?.byteLength ?? 0) + indicesBuffer.byteLength;
        const binaryBuffer = new ArrayBuffer(totalByteLength);
        const binaryView = new Uint8Array(binaryBuffer);

        binaryView.set(new Uint8Array(posBuffer.buffer), byteOffset);
        byteOffset += posBuffer.byteLength;
        if (normBuffer) { binaryView.set(new Uint8Array(normBuffer.buffer), byteOffset); byteOffset += normBuffer.byteLength; }
        if (uvBuffer) { binaryView.set(new Uint8Array(uvBuffer.buffer), byteOffset); byteOffset += uvBuffer.byteLength; }
        binaryView.set(new Uint8Array(indicesBuffer.buffer), byteOffset);

        const json: any = {
            asset: {version: "2.0", generator: "Cognitive3D WLE Adapter"},
            scene: 0, scenes: [{nodes: [0]}], nodes: [{mesh: 0, name: "MergedExport"}],
            meshes: [{primitives: [{attributes: {POSITION: 0}, indices: 0}]}],
            accessors: [], bufferViews: [], buffers: [{uri: binFilename, byteLength: binaryBuffer.byteLength}]
        };

        const bufferViews = [];
        const accessors = [];
        byteOffset = 0;

        // BUFFER VIEW: POSITIONS
        bufferViews.push({buffer: 0, byteOffset: byteOffset, byteLength: posBuffer.byteLength, target: TARGET.ARRAY_BUFFER});
        accessors.push({bufferView: 0, byteOffset: 0, componentType: COMPONENT_TYPE.FLOAT, count: posBuffer.length / 3, type: "VEC3", min: minBounds, max: maxBounds});
        byteOffset += posBuffer.byteLength;
        let attrIdx = 1;

        // BUFFER VIEW: NORMALS
        if (normBuffer) {
            bufferViews.push({buffer: 0, byteOffset: byteOffset, byteLength: normBuffer.byteLength, target: TARGET.ARRAY_BUFFER});
            accessors.push({bufferView: bufferViews.length - 1, byteOffset: 0, componentType: COMPONENT_TYPE.FLOAT, count: normBuffer.length / 3, type: "VEC3"});
            json.meshes[0].primitives[0].attributes["NORMAL"] = attrIdx++;
            byteOffset += normBuffer.byteLength;
        }

        // BUFFER VIEW: UVS
        if (uvBuffer) {
            bufferViews.push({buffer: 0, byteOffset: byteOffset, byteLength: uvBuffer.byteLength, target: TARGET.ARRAY_BUFFER});
            accessors.push({bufferView: bufferViews.length - 1, byteOffset: 0, componentType: COMPONENT_TYPE.FLOAT, count: uvBuffer.length / 2, type: "VEC2"});
            json.meshes[0].primitives[0].attributes["TEXCOORD_0"] = attrIdx++;
            byteOffset += uvBuffer.byteLength;
        }

        // BUFFER VIEW: INDICES
        bufferViews.push({buffer: 0, byteOffset: byteOffset, byteLength: indicesBuffer.byteLength, target: TARGET.ELEMENT_ARRAY_BUFFER});
        accessors.push({bufferView: bufferViews.length - 1, byteOffset: 0, componentType: use32BitIndices ? COMPONENT_TYPE.UNSIGNED_INT : COMPONENT_TYPE.UNSIGNED_SHORT, count: indicesBuffer.length, type: "SCALAR"});
        json.meshes[0].primitives[0].indices = accessors.length - 1;

        json.accessors = accessors;
        json.bufferViews = bufferViews;
        return {json, binaryBuffer};
    }

    _collectAndTransformMeshData(wleObject: any, parentMatrix: any, data: any, indexOffset: number, min: number[], max: number[], filterDynamic: boolean): number {
        if (typeof wleObject.getComponent !== 'function') {
            const children = wleObject.children || [];
            for (let i = 0; i < children.length; i++) {
                indexOffset = this._collectAndTransformMeshData(children[i], parentMatrix, data, indexOffset, min, max, filterDynamic);
            }
            return indexOffset;
        }

        const c3dIdComponent = wleObject.getComponent("c3d-analytics-component");
        if (filterDynamic && c3dIdComponent?.c3dId) {
            return indexOffset;
        }

        const localMatrix = mat4.fromRotationTranslationScale(
            mat4.create(),
            wleObject.getRotationLocal([]),
            wleObject.getPositionLocal([]),
            wleObject.getScalingLocal([])
        );
        const worldMatrix = mat4.multiply(mat4.create(), parentMatrix, localMatrix);

        // FIX: Handle nullable result from mat4.invert (line 236 error)
        const inverseWorld = mat4.invert(mat4.create(), worldMatrix);
        let normalMatrix3;
        
        if (inverseWorld) {
             const normalMatrix4 = mat4.transpose(mat4.create(), inverseWorld);
             normalMatrix3 = mat3.fromMat4(mat3.create(), normalMatrix4);
        } else {
             // Fallback if matrix is not invertible (e.g. scale 0)
             normalMatrix3 = mat3.create(); 
        }

        let meshComponents = wleObject.getComponents(MeshComponent);
        if (!meshComponents || meshComponents.length === 0) {
            meshComponents = wleObject.getComponents('mesh');
        }

        for (const mc of meshComponents) {
            const mesh = mc.mesh;
            if (!mesh || !mesh.indexData) continue;

            const positions = mesh.attribute(MeshAttribute.Position);
            const normals = mesh.attribute(MeshAttribute.Normal);
            const uvs = mesh.attribute(MeshAttribute.TextureCoordinate);

            if (normals) data.hasNormals = true;
            if (uvs) data.hasUvs = true;

            const tempV3 = vec3.create();
            for (let i = 0; i < mesh.vertexCount; ++i) {
                positions.get(i, tempV3);
                vec3.transformMat4(tempV3, tempV3, worldMatrix);
                data.positions.push(tempV3[0], tempV3[1], tempV3[2]);

                min[0] = Math.min(min[0], tempV3[0]); max[0] = Math.max(max[0], tempV3[0]);
                min[1] = Math.min(min[1], tempV3[1]); max[1] = Math.max(max[1], tempV3[1]);
                min[2] = Math.min(min[2], tempV3[2]); max[2] = Math.max(max[2], tempV3[2]);

                if (normals) {
                    normals.get(i, tempV3);
                    vec3.transformMat3(tempV3, tempV3, normalMatrix3);
                    vec3.normalize(tempV3, tempV3);
                    data.normals.push(tempV3[0], tempV3[1], tempV3[2]);
                }
                if (uvs) {
                    const tempV2 = [0, 0];
                    uvs.get(i, tempV2);
                    data.uvs.push(tempV2[0], tempV2[1]);
                }
            }
            for (let i = 0; i < mesh.indexData.length; ++i) {
                data.indices.push(mesh.indexData[i] + indexOffset);
            }
            indexOffset += mesh.vertexCount;
        }

        const children = wleObject.children || [];
        for (let i = 0; i < children.length; i++) {
            indexOffset = this._collectAndTransformMeshData(children[i], worldMatrix, data, indexOffset, min, max, filterDynamic);
        }
        return indexOffset;
    }

    public async exportScene(sceneName: string, scale: number = 1.0, rootObjectOrName: any = null): Promise<void> {
        let rootObject = this.WL.scene;

        if (rootObjectOrName) {
            if (typeof rootObjectOrName === 'string') {
                const found = this.WL.scene.findByName(rootObjectOrName); 
                if (found.length > 0) {
                   rootObject = found[0] || found;
                   console.log(`Cognitive3D: Found export root by name: "${rootObjectOrName}"`);
                } else {
                   console.warn(`Cognitive3D: Object "${rootObjectOrName}" not found. Exporting full scene.`);
                   rootObject = this.WL.scene.children[0]?.parent || this.WL.scene;
                }
            } else if (typeof rootObjectOrName === 'object') {
                rootObject = rootObjectOrName;
                console.log(`Cognitive3D: Using custom export root object: "${rootObject.name}"`);
            }
        } else {
             rootObject = this.WL.scene.children[0]?.parent || this.WL.scene;
        }

        console.log(`Cognitive3D: Starting export on root: "${rootObject.name || 'Scene'}"`);
        await this._performExport(rootObject, sceneName, scale, true); 
    }
}
export default C3DWonderlandAdapter;