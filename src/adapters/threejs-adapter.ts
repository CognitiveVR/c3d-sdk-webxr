import * as THREE from 'three';
import { GLTFExporter, GLTFExporterOptions } from 'three/examples/jsm/exporters/GLTFExporter.js';
// @ts-ignore
import JSZip from 'jszip';
import C3D from '../index';
import { GazeHitData } from '../utils/webxr'; 
import Config from '../config';

interface FPSState {
    frameCount: number;
    timeAccumulator: number;
    lastTime: number;
    frameTimes: number[];
}

interface DynamicObjectOptions {
    positionThreshold?: number;
    rotationThreshold?: number;
    scaleThreshold?: number;
}

// Helper interface for extended WebXRManager
interface ExtendedWebXRManager extends THREE.WebXRManager {
    getScene?: () => THREE.Scene;
}

class C3DThreeAdapter {
    private c3d: C3D;
    private _fpsState: FPSState = {
        frameCount: 0,
        timeAccumulator: 0,
        lastTime: performance.now(),
        frameTimes: []
    };
    // Used to avoid TS errors in environments without FileSystem API types
    private exportDirHandle: any = null; 
    private _interactableObjects: THREE.Object3D[] = [];  

    // Properties for engine-camera driven gaze tracking
    private _camera: THREE.Camera | null = null;
    private _lastGazeTime: number = 0;

    // Object Pooling for GC optimization
    private _tempVec = new THREE.Vector3();
    private _tempQuat = new THREE.Quaternion();
    private _tempScale = new THREE.Vector3();

    // Helper to log object hierarchy recursively for during object export debugging 
    private _logHierarchy(obj: THREE.Object3D, depth = 0): void {
        const indent = "  ".repeat(depth);
        const info = `Type: ${obj.type}, Name: "${obj.name}"`;
        console.log(`${indent}- ${info}`);
        if (obj.children) {
            obj.children.forEach(child => this._logHierarchy(child, depth + 1));
        }
    }

    constructor(c3dInstance: C3D) {
        if (!c3dInstance) {
            throw new Error("A C3D instance must be provided to the Three.js adapter.");
        }
        this.c3d = c3dInstance;

        this.c3d.setDeviceProperty('AppEngine', 'Three.js');
        this.c3d.setDeviceProperty('AppEngineVersion', THREE.REVISION);
    }

    private fromVector3(vec3: THREE.Vector3): number[] {
        return [vec3.x, vec3.y, vec3.z];
    }

    private fromQuaternion(quat: THREE.Quaternion): number[] {
        return [quat.x, quat.y, quat.z, quat.w];
    }

    public recordGazeFromCamera(camera: THREE.Camera): void {
        const worldPos = new THREE.Vector3();
        const worldQuat = new THREE.Quaternion();
        camera.getWorldPosition(worldPos);
        camera.getWorldQuaternion(worldQuat);

        // Apply C3D Coordinate Corrections
        const correctedPosition = [worldPos.x, worldPos.y, -worldPos.z];
        const correctedOrientation = [worldQuat.x, worldQuat.y, -worldQuat.z, -worldQuat.w];

        // Calculate gaze vector natively (assuming camera looks down -Z in local space)
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(worldQuat);
        // Gaze direction also needs the Z flipped
        const correctedGaze = [forward.x, forward.y, -forward.z];

        this.c3d.gaze.recordGaze(correctedPosition, correctedOrientation, correctedGaze);
    }
    //  Helper function for recursively finding dynamic interactable objects in a three.scene or three.group
    private _scanForInteractables(root: THREE.Object3D): void {
        root.traverse((child) => {
            
            if (child.userData && child.userData.c3dId) {
                this._interactableObjects.push(child);
                
                if (child.userData.isDynamic) {
                     const options: DynamicObjectOptions = {
                        positionThreshold: child.userData.positionThreshold,
                        rotationThreshold: child.userData.rotationThreshold,
                        scaleThreshold: child.userData.scaleThreshold
                    };
                    this.trackDynamicObject(child, child.userData.c3dId, options);
                    console.log(`Cognitive3D: Automatically started tracking dynamic object: ${child.name}`);
                }
            }
        });
    }

    /**
     * Initializes the tracking systems (Gaze, Dynamic Objects, FPS).
     * You MUST call c3dAdapter.update() in your own render loop.
     */
    public startTracking(
        renderer: THREE.WebGLRenderer, 
        camera: THREE.Camera, 
        // Accept a Scene, a specific Group, or a manual list of objects
        trackableTarget: THREE.Object3D | THREE.Object3D[] | null = null
    ): void {
        if (!renderer || !camera) {
            console.error("Cognitive3D: renderer and camera must be provided to startTracking.");
            return;
        }

        if (this.c3d.fpsTracker) {
            this.c3d.fpsTracker.stop();
            console.log("Cognitive3D: Stopped default FPS tracker in favor of XR-synced tracking.");
        }

        this._camera = camera; 

        // Setup Dynamic Objects & Gaze, Clear previous list
        this._interactableObjects = [];

        if (trackableTarget) {
            if (Array.isArray(trackableTarget)) {
                // User manually provided a list of objects
                this._interactableObjects = trackableTarget;
            } else {
                // User provided the Scene or a Group -> Scan it
                this._scanForInteractables(trackableTarget);
            }

            console.log(`Cognitive3D: Tracking ${this._interactableObjects.length} objects.`);
            
            this._setupGazeRaycasting(camera);
            console.log('Cognitive3D: Gaze raycasting enabled.');
        }

        this._initFPSState();

        console.log('Cognitive3D: Adapter initialized. Please ensure you call c3dAdapter.update() within your render loop.');
    }

    /**
     * MUST be called once per frame in your developer render loop.
     * * @param timestamp - The high-precision timestamp passed by requestAnimationFrame or the WebXR loop.
     * CURRENTLY UNUSED: Internal timing uses performance.now(). 
     * FUTURE: Will be used for precise frame-to-frame delta calculations synced to the display refresh rate.
     * * @param frame - The XRFrame object provided by the WebXR session.
     * CURRENTLY UNUSED: Adapter relies on Three.js wrappers for pose data.
     * FUTURE: Required for accessing raw WebXR features like AR Hit Testing, Anchors, and Light Estimation.
     */
    public update(timestamp?: number, frame?: XRFrame): void { // TODO - use these parameters for more precise timing and WebXR features
        this._updateFPS();
        this.updateTrackedObjectTransforms();

        // Check if we need to poll gaze from the engine
        if (Config.gazeTrackingSource === 'engine') {
            this._recordEngineGaze();
        }
    }

    private _initFPSState(): void {
        this._fpsState = {
            frameCount: 0,
            timeAccumulator: 0,
            lastTime: performance.now(),
            frameTimes: []
        };
    }

    private _updateFPS(): void {
        const now = performance.now();
        let delta = (now - this._fpsState.lastTime) / 1000; // delta in seconds

        if (delta > 1.0) delta = 0;

        this._fpsState.lastTime = now;
        this._fpsState.timeAccumulator += delta;
        this._fpsState.frameCount++;
        this._fpsState.frameTimes.push(delta);

        if (this._fpsState.timeAccumulator >= 1.0) {
            this._sendFPSData();

            this._fpsState.frameCount = 0;
            this._fpsState.timeAccumulator = 0;
            this._fpsState.frameTimes = [];
        }
    }

    private _sendFPSData(): void {
        const { frameCount, timeAccumulator, frameTimes } = this._fpsState;

        // A. Average FPS
        const avgFps = frameCount / timeAccumulator;
        this.c3d.sensor.recordSensor('c3d.fps.avg', avgFps);

        // B. 1% Low FPS
        frameTimes.sort((a, b) => b - a);

        const onePercentCount = Math.ceil(frameTimes.length * 0.01);
        const slowestFrames = frameTimes.slice(0, onePercentCount);

        if (slowestFrames.length > 0) {
            const totalSlowestTime = slowestFrames.reduce((sum, t) => sum + t, 0);
            const avgSlowestTime = totalSlowestTime / slowestFrames.length;

            const fps1pl = avgSlowestTime > 0 ? (1 / avgSlowestTime) : avgFps;

            this.c3d.sensor.recordSensor('c3d.fps.1pl', fps1pl);
        }
    }

    private _setupGazeRaycasting(camera: THREE.Camera): void {
        const raycaster = new THREE.Raycaster();
        raycaster.far = 1000;
        
        const gazeOriginNDC = new THREE.Vector2(0, 0);

        this.c3d.gazeRaycaster = (): GazeHitData | null => {
            raycaster.setFromCamera(gazeOriginNDC, camera);
            
            // Intersect against the cached array, NOT a specific group
            const intersects = raycaster.intersectObjects(this._interactableObjects, true);

            if (intersects.length > 0) {
                const intersection = intersects[0];
                let targetObject: THREE.Object3D | null = intersection.object;

                // Traverse up from the hit mesh to find the actual 'tracked' parent (if applicable)
                // This handles cases where we track a "Car" (Group) but hit the "Tire" (Mesh)
                while (targetObject) {
                    if (targetObject.userData && targetObject.userData.c3dId) {
                        break;
                    }
                    // Stop if we hit the scene root or run out of parents
                    if (!targetObject.parent) {
                        targetObject = null;
                        break;
                    }
                    targetObject = targetObject.parent;
                }

                if (targetObject && targetObject.userData.c3dId) {
                    const worldPoint = intersection.point.clone();
                    targetObject.worldToLocal(worldPoint);
                    // Standardize coordinate system if necessary (often needed for analytics backends)
                    worldPoint.x *= 1;
                    worldPoint.z *= -1;

                    return {
                        objectId: targetObject.userData.c3dId,
                        point: [worldPoint.x, worldPoint.y, worldPoint.z]
                    };
                }
            }
            return null;
        };
    }

    // Handle Gaze tracking natively through Three.js camera
    private _recordEngineGaze(): void {
    if (!this._camera) return;

    const now = performance.now();
    const intervalMs = Config.GazeInterval ? Config.GazeInterval * 1000 : 100;

    if (now - this._lastGazeTime >= intervalMs) {
        this._lastGazeTime = now;

        const worldPos = new THREE.Vector3();
        const worldQuat = new THREE.Quaternion();
        this._camera.getWorldPosition(worldPos);
        this._camera.getWorldQuaternion(worldQuat);

        // PERFECTLY MATCHES webxr.ts
        const correctedPosition = [worldPos.x, worldPos.y, -worldPos.z];
        const correctedOrientation = [worldQuat.x, worldQuat.y, -worldQuat.z, -worldQuat.w];

        let gazeHitData: GazeHitData | null = null;
        if (this.c3d.gazeRaycaster) {
            gazeHitData = this.c3d.gazeRaycaster();
        }

        this.c3d.gaze.recordGaze(correctedPosition, correctedOrientation, gazeHitData);
    }
}

    public trackDynamicObject(object: THREE.Object3D, id: string, options: DynamicObjectOptions): void {
        this.c3d.dynamicObject.trackObject(id, object, options);

        const tracked = this.c3d.dynamicObject.trackedObjects.get(id);
        if (tracked) {
            tracked.lastPosition = new THREE.Vector3(Infinity, Infinity, Infinity);
            tracked.lastRotation = new THREE.Quaternion(Infinity, Infinity, Infinity, Infinity);
            tracked.lastScale = new THREE.Vector3(Infinity, Infinity, Infinity);
        }
    }

    public updateTrackedObjectTransforms(): void {
        const dynamicObjectManager = this.c3d.dynamicObject;

        dynamicObjectManager.trackedObjects.forEach((tracked, id) => {
            if (!tracked.lastPosition) return;

            const { object, lastPosition, lastRotation, lastScale, positionThreshold, rotationThreshold, scaleThreshold } = tracked;
            const threeObject = object as THREE.Object3D;
            const threeLastPos = lastPosition as THREE.Vector3;
            const threeLastRot = lastRotation as THREE.Quaternion;
            const threeLastScale = lastScale as THREE.Vector3;

            threeObject.updateWorldMatrix(true, false);
            threeObject.matrixWorld.decompose(this._tempVec, this._tempQuat, this._tempScale);

            const positionChanged = this._tempVec.distanceTo(threeLastPos) > (positionThreshold || 0.01);
            const rotationChanged = this._tempQuat.angleTo(threeLastRot) * (180 / Math.PI) > (rotationThreshold || 1);
            const scaleChanged = this._tempScale.distanceTo(threeLastScale) > (scaleThreshold || 0.01);

            if (positionChanged || rotationChanged || scaleChanged) {
                // OPTIMIZATION: Manually construct arrays to avoid .clone() and .toArray() allocations
                const posArray = [this._tempVec.x, this._tempVec.y, this._tempVec.z * -1];
                const quatArray = [this._tempQuat.x, this._tempQuat.y, this._tempQuat.z * -1, this._tempQuat.w * -1];
                const scaleArray = [this._tempScale.x, this._tempScale.y, this._tempScale.z];

                dynamicObjectManager.addSnapshot(id, posArray, quatArray, scaleArray);

                threeLastPos.copy(this._tempVec);
                threeLastRot.copy(this._tempQuat);
                threeLastScale.copy(this._tempScale);
            }
        });
    }
    public addInteractable(object: THREE.Object3D): void {
        if (!this._interactableObjects.includes(object)) {
            this._interactableObjects.push(object);
        }
    }

    async _ensureExportDir(): Promise<any> {
        if (this.exportDirHandle) return this.exportDirHandle;
        // @ts-ignore
        if (!window.showDirectoryPicker) return null;
        try {
            // @ts-ignore
            const root = await window.showDirectoryPicker();
            const sceneDir = await root.getDirectoryHandle("scene", { create: true });
            const perm = await sceneDir.requestPermission?.({ mode: "readwrite" });
            if (perm && perm !== "granted") throw new Error("Write permission denied");
            this.exportDirHandle = sceneDir;
            return sceneDir;
        } catch (err) {
            console.error("Error getting directory handle:", err);
            return null;
        }
    }

    async _writeFile(dirHandle: any, filename: string, blob: Blob): Promise<void> {
        const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
    }

    _downloadBlob(blob: Blob, filename: string): void {
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

    public exportScene(scene: THREE.Scene, sceneName: string, renderer: THREE.WebGLRenderer, camera: THREE.Camera): void {
        const exporter = new GLTFExporter();
        const staticScene = scene.clone(true);

        staticScene.traverse((obj) => {
            if (obj.userData && (obj.userData.c3dId || obj.userData.isDynamic)) {
                if (obj.parent) {
                    obj.parent.remove(obj);
                }
            }
        });

        const exportRoot = new THREE.Group();
        exportRoot.name = "CoordinateSystemFix";
        exportRoot.add(staticScene);
        exportRoot.scale.z = -1;
        exportRoot.scale.x = -1;

        exporter.parse(
            exportRoot,
            async (gltfInput: any) => {
                const gltf = gltfInput;
                const dir = await this._ensureExportDir();

                const prefix = "data:application/octet-stream;base64,";
                const uri = gltf.buffers?.[0]?.uri || "";
                let binBlob: Blob | null = null;
                if (uri.startsWith(prefix)) {
                    const b64 = uri.slice(prefix.length);
                    const raw = atob(b64);
                    const bytes = new Uint8Array(raw.length);
                    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
                    binBlob = new Blob([bytes.buffer], { type: "application/octet-stream" });
                    if (gltf.buffers && gltf.buffers[0]) {
                        gltf.buffers[0].uri = "scene.bin";
                    }
                }

                const gltfBlob = new Blob([JSON.stringify(gltf, null, 2)], { type: "model/gltf+json" });
                const settings = {
                    scale: 1,
                    sceneName: sceneName,
                    sdkVersion: __SDK_VERSION__
                };
                const settingsBlob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
                const screenshotDataUrl = renderer.domElement.toDataURL('image/png');
                const screenshotBlob = await (await fetch(screenshotDataUrl)).blob();

                if (dir) {
                    if (binBlob) await this._writeFile(dir, "scene.bin", binBlob);
                    await this._writeFile(dir, "scene.gltf", gltfBlob);
                    await this._writeFile(dir, "settings.json", settingsBlob);
                    await this._writeFile(dir, "screenshot.png", screenshotBlob);
                    console.log("Exported static scene files to the 'scene' directory.");
                } else {
                    console.warn("File System Access API not available; falling back to zip download.");
                    const zip = new JSZip();
                    if (binBlob) zip.file("scene.bin", binBlob);
                    zip.file("scene.gltf", gltfBlob);
                    zip.file("settings.json", settingsBlob);
                    zip.file("screenshot.png", screenshotBlob);

                    const zipBlob = await zip.generateAsync({ type: "blob" });
                    this._downloadBlob(zipBlob, "scene-export.zip");
                }
            },
            (err) => {
                console.error("GLTF export failed:", err);
            },
            { binary: false, embedImages: true, onlyVisible: true, truncateDrawRange: true, maxTextureSize: 4096 } as GLTFExporterOptions
        );
    }

    public async exportObject(objectToExport: THREE.Object3D, objectName: string, renderer: THREE.WebGLRenderer, camera: THREE.Camera): Promise<void> {
        const xrManager = renderer.xr as ExtendedWebXRManager;
        const originalScene = xrManager.isPresenting ? xrManager.getScene?.() : camera.parent; 
        const tempScene = new THREE.Scene();
        tempScene.background = new THREE.Color(0xe0e0e0);
        const tempLight = new THREE.AmbientLight(0xffffff, 3.0);
        tempScene.add(tempLight);

        const objectClone = objectToExport.clone();
        const box = new THREE.Box3().setFromObject(objectClone);
        const center = box.getCenter(new THREE.Vector3());
        objectClone.position.sub(center); 
        tempScene.add(objectClone);

        renderer.render(tempScene, camera);
        const screenshotDataUrl = renderer.domElement.toDataURL('image/png');
        const screenshotBlob = await (await fetch(screenshotDataUrl)).blob();

        if (originalScene) {
            renderer.render(originalScene, camera);
        }

        const exporter = new GLTFExporter();
        
        const gltfClone = objectToExport.clone();

        console.log(`[Cognitive3D] Structure being exported for "${objectName}":`);
        this._logHierarchy(gltfClone);

        exporter.parse(
            gltfClone,
            async (gltfInput: any) => { 
                const gltf = gltfInput;
                const dir = await this._ensureExportDir();
                const prefix = "data:application/octet-stream;base64,";
                const uri = gltf.buffers?.[0]?.uri || "";
                let binBlob: Blob | null = null;

                if (uri.startsWith(prefix)) {
                    const b64 = uri.slice(prefix.length);
                    const raw = atob(b64);
                    const bytes = new Uint8Array(raw.length);
                    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
                    binBlob = new Blob([bytes.buffer], { type: "application/octet-stream" });
                    if (gltf.buffers && gltf.buffers[0]) {
                        gltf.buffers[0].uri = `${objectName}.bin`;
                    }
                }

                const gltfBlob = new Blob([JSON.stringify(gltf, null, 2)], { type: "model/gltf+json" });

                if (dir) {
                    if (binBlob) await this._writeFile(dir, `${objectName}.bin`, binBlob);
                    await this._writeFile(dir, `${objectName}.gltf`, gltfBlob);
                    await this._writeFile(dir, "cvr_object_thumbnail.png", screenshotBlob);
                    console.log(`Exported object files for '${objectName}' to the 'scene' directory.`);
                } else {
                    console.warn("File System Access API not available; falling back to zip download.");
                    const zip = new JSZip();
                    if (binBlob) zip.file(`${objectName}.bin`, binBlob);
                    zip.file(`${objectName}.gltf`, gltfBlob);
                    zip.file("cvr_object_thumbnail.png", screenshotBlob);
                    const zipBlob = await zip.generateAsync({ type: "blob" });
                    this._downloadBlob(zipBlob, `${objectName}-export.zip`);
                }
            },
            (err) => {
                console.error(`GLTF export for ${objectName} failed:`, err);
            },
            { binary: false, embedImages: true, onlyVisible: true, truncateDrawRange: true, maxTextureSize: 4096 } as GLTFExporterOptions
        );
    }
}

export default C3DThreeAdapter;