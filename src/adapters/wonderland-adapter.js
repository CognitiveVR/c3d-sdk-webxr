import { vec3, quat, mat4, mat3 } from 'gl-matrix'; 
import { MeshAttribute, MeshComponent, Object as WLEObject } from '@wonderlandengine/api'; 
// NOTE: WLE does not export MeshAttribute, MeshComponent, or Object by default in the SDK. 
// Ensure your environment (e.g., your build process) can resolve these, 
// or manually define the constants if direct import fails.

// GLTF constants needed for the export format
const COMPONENT_TYPE = {
	UNSIGNED_SHORT: 5123,
	UNSIGNED_INT: 5125,
	FLOAT: 5126,
};
const TARGET = {
	ARRAY_BUFFER: 34962,
	ELEMENT_ARRAY_BUFFER: 34963,
};

const SDK_VERSION = "2.4.0";

class C3DWonderlandAdapter {
    
    // File system access handle for writing files to a directory
    exportDirHandle = null;
  constructor(c3dInstance, wonderlandEngineInstance) {
    if (!c3dInstance) {
      throw new Error("A C3D instance must be provided to the Wonderland Engine adapter.");
    }
    if (!wonderlandEngineInstance) {
      throw new Error("The Wonderland Engine instance (WL) must be provided.");
    }
    this.c3d = c3dInstance;
    this.WL = wonderlandEngineInstance;

    // Set engine properties for the session data
    this.c3d.setDeviceProperty('AppEngine', 'Wonderland Engine');

    const version = this.WL.runtimeVersion; 
    const versionString = `${version.major}.${version.minor}.${version.patch}`;
    this.c3d.setDeviceProperty('AppEngineVersion', versionString);
  }

  // --- Utility Functions (Coordinate Conversion) ---

  /**
   * Converts a gl-matrix vec3 to a simple array.
   */
  fromVector3(vec) {
    return [vec[0], vec[1], vec[2]];
  }

  /**
   * Converts a gl-matrix quat to a simple array.
   */
  fromQuaternion(quat) {
    return [quat[0], quat[1], quat[2], quat[3]];
  }
  recordGazeFromCamera() {
    const cameraObject = this.WL.scene.activeViews[0]?.object;
    if (!cameraObject) {
        console.warn("Cognitive3D: Could not find an active camera in the Wonderland scene.");
        return;
    }

    const position = cameraObject.getTranslationWorld([]);
    const rotation = cameraObject.getRotationWorld([]);

    const forwardVector = [0, 0, -1]; 
    const gaze = vec3.create(); 
    vec3.transformQuat(gaze, forwardVector, rotation);

    this.c3d.gaze.recordGaze(
        this.fromVector3(position),
        this.fromQuaternion(rotation),
        this.fromVector3(gaze)
    );
  }
  
  // File System Utilities 
  
  /**
   * Prompts the user to select a root directory and ensures the 'scene' subdirectory exists.
   */
  async _ensureExportDir() {
      if (this.exportDirHandle) return this.exportDirHandle;
      if (!window.showDirectoryPicker) return null;
      try {
          const root = await window.showDirectoryPicker();
          const sceneDir = await root.getDirectoryHandle("scene", { create: true });
          // Optional: request permission to avoid permission issues, not strictly required
          const perm = await sceneDir.requestPermission?.({ mode: "readwrite" }); 
          if (perm && perm !== "granted") console.warn("Write permission denied, but attempting save.");
          this.exportDirHandle = sceneDir;
          return sceneDir;
      } catch (err) {
          if (err.name !== 'AbortError') console.error("Error getting directory handle:", err);
          return null;
      }
  }

  /**
   * Writes a Blob or Buffer to a file in the given directory handle.
   */
  async _writeFile(dirHandle, filename, content) {
      const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      
      // Convert ArrayBuffer to Blob if necessary
      const blob = content instanceof ArrayBuffer ? new Blob([content]) : content;

      await writable.write(blob);
      await writable.close();
  }

  /**
   * Downloads a Blob as a fallback (not used in primary path).
   */
  _downloadBlob(blob, filename) {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
          URL.revokeObjectURL(a.href);
          a.remove();
      }, 800);
  }

  // GLTF EXPORT CORE LOGIC

    /**
     * Recursive function to collect and transform mesh data.
     * @param rootObject The WLE object containing the objects to export.
     * @param sceneName The name for the settings.json file.
     * @param scale The global scale to apply.
     * @param filterDynamic If true, objects with c3dId will be ignored.
     */
    async _performExport(rootObject, sceneName, scale, filterDynamic) {
        
        const binFilename = "scene.bin";
        
        // 1. Scene Traversal and Geometry Generation
        const {json, binaryBuffer} = this._createGltfData(rootObject, scale, binFilename, filterDynamic);

        if (!json || binaryBuffer.byteLength === 0) {
            console.error("Export failed: No geometry found or error generating data.");
            return;
        }

        // 2. Save Files
        const gltfBlob = new Blob([JSON.stringify(json, null, 2)], { type: "model/gltf+json" });
        const binBlob = new Blob([binaryBuffer], { type: "application/octet-stream" });
        const settings = {
            scale: scale,
            sceneName: sceneName,
            sdkVersion: SDK_VERSION
        };
        const settingsBlob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });

        const dir = await this._ensureExportDir();
        if (dir) {
            await this._writeFile(dir, "scene.bin", binBlob);
            await this._writeFile(dir, "scene.gltf", gltfBlob);
            await this._writeFile(dir, "settings.json", settingsBlob);
            
            // Screenshot placeholder
            console.warn("Screenshot generation (screenshot.png) is omitted due to Wonderland Engine's rendering complexity. Please provide this file manually for upload.");
            console.log(`Exported static scene files to the '${dir.name}' directory.`);
        } else {
            console.warn("File System Access API not available or permission denied; falling back to multiple downloads. Please create a 'scene' folder manually and move the files there.");
            this._downloadBlob(gltfBlob, "scene.gltf");
            this._downloadBlob(binBlob, "scene.bin");
            this._downloadBlob(settingsBlob, "settings.json");
        }
    }

    /**
     * Core logic to collect geometry and generate GLTF JSON/BIN structure.
     */
	_createGltfData(wleObject, scale, binFilename, filterDynamic) {
		const meshData = {
			positions: [],
			normals: [],
			uvs: [],
			indices: [],
			hasNormals: false,
			hasUvs: false,
		};
		const minBounds = [Infinity, Infinity, Infinity];
		const maxBounds = [-Infinity, -Infinity, -Infinity];

        // Coordinate System Flip: Apply X and Z flip to convert WLE Right-Handed to Left-Handed
        const FLIP_MATRIX = mat4.fromScaling(mat4.create(), [-1, 1, -1]); 
        
        // Combine flip with user-defined scale
        const scaleMatrix = mat4.fromScaling(mat4.create(), [scale, scale, scale]);
		const rootMatrix = mat4.multiply(mat4.create(), FLIP_MATRIX, scaleMatrix);

		this._collectAndTransformMeshData(
			wleObject,
			rootMatrix,
			meshData,
			0,
			minBounds,
			maxBounds,
            filterDynamic,
		);

		if (meshData.positions.length === 0)
			return {json: null, binaryBuffer: new ArrayBuffer(0)};

		const posBuffer = new Float32Array(meshData.positions);
		const normBuffer = meshData.hasNormals ? new Float32Array(meshData.normals) : null;
		const uvBuffer = meshData.hasUvs ? new Float32Array(meshData.uvs) : null;
		const use32BitIndices = posBuffer.length / 3 > 65535;
		const indicesBuffer = use32BitIndices
			? new Uint32Array(meshData.indices)
			: new Uint16Array(meshData.indices);

		let byteOffset = 0;
		const totalByteLength =
			posBuffer.byteLength +
			(normBuffer?.byteLength ?? 0) +
			(uvBuffer?.byteLength ?? 0) +
			indicesBuffer.byteLength;
		const binaryBuffer = new ArrayBuffer(totalByteLength);
		const binaryView = new Uint8Array(binaryBuffer);

		// Write data to the binary buffer
		binaryView.set(new Uint8Array(posBuffer.buffer), byteOffset);
		byteOffset += posBuffer.byteLength;
		if (normBuffer) {
			binaryView.set(new Uint8Array(normBuffer.buffer), byteOffset);
			byteOffset += normBuffer.byteLength;
		}
		if (uvBuffer) {
			binaryView.set(new Uint8Array(uvBuffer.buffer), byteOffset);
			byteOffset += uvBuffer.byteLength;
		}
		binaryView.set(new Uint8Array(indicesBuffer.buffer), byteOffset);

		const json = this._createGltfJsonTemplate();
		const accessors = [];
		const bufferViews = [];
		byteOffset = 0;

		// 1. Positions BufferView and Accessor
		bufferViews.push({
			buffer: 0, byteOffset: byteOffset, byteLength: posBuffer.byteLength, target: TARGET.ARRAY_BUFFER,
		});
		accessors.push({
			bufferView: 0, byteOffset: 0, componentType: COMPONENT_TYPE.FLOAT, count: posBuffer.length / 3, type: "VEC3", min: minBounds, max: maxBounds,
		});
		byteOffset += posBuffer.byteLength;

		let attributeIndex = 0;
		const attributes = {POSITION: attributeIndex++};

		// 2. Normals BufferView and Accessor
		if (normBuffer) {
			bufferViews.push({
				buffer: 0, byteOffset: byteOffset, byteLength: normBuffer.byteLength, target: TARGET.ARRAY_BUFFER,
			});
			accessors.push({
				bufferView: bufferViews.length - 1, byteOffset: 0, componentType: COMPONENT_TYPE.FLOAT, count: normBuffer.length / 3, type: "VEC3",
			});
			attributes["NORMAL"] = attributeIndex++;
			byteOffset += normBuffer.byteLength;
		}
        
		// 3. UVs BufferView and Accessor
		if (uvBuffer) {
			bufferViews.push({
				buffer: 0, byteOffset: byteOffset, byteLength: uvBuffer.byteLength, target: TARGET.ARRAY_BUFFER,
			});
			accessors.push({
				bufferView: bufferViews.length - 1, byteOffset: 0, componentType: COMPONENT_TYPE.FLOAT, count: uvBuffer.length / 2, type: "VEC2",
			});
			attributes["TEXCOORD_0"] = attributeIndex++;
			byteOffset += uvBuffer.byteLength;
		}
        
		// 4. Indices BufferView and Accessor
		bufferViews.push({
			buffer: 0, byteOffset: byteOffset, byteLength: indicesBuffer.byteLength, target: TARGET.ELEMENT_ARRAY_BUFFER,
		});
		accessors.push({
			bufferView: bufferViews.length - 1, byteOffset: 0,
			componentType: use32BitIndices ? COMPONENT_TYPE.UNSIGNED_INT : COMPONENT_TYPE.UNSIGNED_SHORT,
			count: indicesBuffer.length, type: "SCALAR",
		});

		json.accessors = accessors;
		json.bufferViews = bufferViews;
		
        // CRUCIAL: Set buffers to reference the external .bin file
        json.buffers = [{
            uri: binFilename, 
            byteLength: binaryBuffer.byteLength
        }];
        
		json.meshes = [
			{
				primitives: [
					{attributes: attributes, indices: accessors.length - 1},
				],
			},
		];
		json.nodes = [{mesh: 0, name: "MergedExport"}];
		json.scenes[0].nodes.push(0);

		return {json, binaryBuffer};
	}

    /**
     * Recursive collection and transformation of mesh data.
     */
	_collectAndTransformMeshData(
		wleObject,
		parentMatrix,
		data,
		indexOffset,
		min,
		max,
        filterDynamic,
	) {
        // Skip objects tagged as dynamic (userData is WLE Component property)
        const c3dIdComponent = wleObject.getComponent("c3d-analytics-component"); // Assuming this component marks dynamic objects
        if (filterDynamic && c3dIdComponent?.c3dId) {
            return indexOffset;
        }
        
        // This is a simplified way to get local transform, relying on gl-matrix directly
        // and assuming WLEObject methods are available.
		const localMatrix = mat4.fromRotationTranslationScale(
			mat4.create(),
			wleObject.getRotationLocal([]), // Assuming we can pass empty array for temp storage
			wleObject.getPositionLocal([]),
			wleObject.getScalingLocal([]),
		);
        
		const worldMatrix = mat4.multiply(
			mat4.create(),
			parentMatrix,
			localMatrix,
		);

		// Inverse-transpose matrix for correct normal transformation
		const normalMatrix4 = mat4.transpose(
			mat4.create(),
			mat4.invert(mat4.create(), worldMatrix),
		);
		const normalMatrix3 = mat3.fromMat4(mat3.create(), normalMatrix4);

		const meshComponents = wleObject.getComponents(MeshComponent); // Assuming MeshComponent is accessible
		for (const mc of meshComponents) {
			const mesh = mc.mesh;
			if (!mesh || !mesh.indexData) continue;
            
            // Assuming MeshAttribute and Mesh is accessible
			const positions = mesh.attribute(MeshAttribute.Position); 
			const normals = mesh.attribute(MeshAttribute.Normal);
			const uvs = mesh.attribute(MeshAttribute.TextureCoordinate);

			if (normals) data.hasNormals = true;
			if (uvs) data.hasUvs = true;

			const tempV3 = vec3.create();
			for (let i = 0; i < mesh.vertexCount; ++i) {
				// Positions
				positions.get(i, tempV3);
				vec3.transformMat4(tempV3, tempV3, worldMatrix);
				data.positions.push(tempV3[0], tempV3[1], tempV3[2]);
				// Update bounds (min/max)
				min[0] = Math.min(min[0], tempV3[0]); max[0] = Math.max(max[0], tempV3[0]);
				min[1] = Math.min(min[1], tempV3[1]); max[1] = Math.max(max[1], tempV3[1]);
				min[2] = Math.min(min[2], tempV3[2]); max[2] = Math.max(max[2], tempV3[2]);

				// Normals
				if (normals) {
					normals.get(i, tempV3);
					vec3.transformMat3(tempV3, tempV3, normalMatrix3);
					vec3.normalize(tempV3, tempV3);
					data.normals.push(tempV3[0], tempV3[1], tempV3[2]);
				}
				// UVs
				if (uvs) {
					const tempV2 = [0, 0];
					uvs.get(i, tempV2);
					data.uvs.push(tempV2[0], tempV2[1]);
				}
			}
            
            // Indices
			for (let i = 0; i < mesh.indexData.length; ++i) {
				data.indices.push(mesh.indexData[i] + indexOffset);
			}
			indexOffset += mesh.vertexCount;
		}

		for (const child of wleObject.children) {
			indexOffset = this._collectAndTransformMeshData(
				child,
				worldMatrix,
				data,
				indexOffset,
				min,
				max,
                filterDynamic,
			);
		}
		return indexOffset;
	}

    /**
     * Generates a basic GLTF JSON template.
     */
	_createGltfJsonTemplate = () => ({
		asset: {version: "2.0", generator: "Cognitive3D WLE Adapter"},
		scene: 0,
		scenes: [{nodes: []}],
		nodes: [],
		meshes: [],
		accessors: [],
		bufferViews: [],
		buffers: [],
	});

  // Public Export Methods

  /**
   * Exports the entire static scene geometry to GLTF, BIN, and settings.json.
   * Dynamic objects (those with c3dId) are automatically excluded.
   * @param {string} sceneName - The name of the scene.
   * @param {number} [scale=1.0] - Optional global scale factor.
   */
  async exportScene(sceneName, scale = 1.0) {
    console.log(`Cognitive3D: Exporting static scene geometry for "${sceneName}"...`);
    
    // The WL.scene.children is the highest level of objects
    const rootObject = this.WL.scene.children[0]?.parent || this.WL.scene; 
    
    // Start export from the root of the scene, filter dynamic objects
    await this._performExport(rootObject, sceneName, scale, true); 
  }

  /**
   * Exports a specific Wonderland Engine object and its children.
   * @param {WLEObject} objectToExport - The object to export.
   * @param {string} objectName - The name of the object to use for filenames.
   * @param {number} [scale=1.0] - Optional global scale factor.
   */
  async exportObject(objectToExport, objectName, scale = 1.0) {
    console.log(`Cognitive3D: Exporting specific object geometry for "${objectName}"...`);
    
    // Start export from the specified object, do NOT filter dynamic objects
    await this._performExport(objectToExport, objectName, scale, false);
  }
}

export default C3DWonderlandAdapter;