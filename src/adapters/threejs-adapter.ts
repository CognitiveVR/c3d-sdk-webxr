import * as THREE from 'three';
import { GLTFExporter, GLTFExporterOptions } from 'three/examples/jsm/exporters/GLTFExporter.js';
// @ts-ignore
import JSZip from 'jszip';
import C3D from '../index';

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

class C3DThreeAdapter {
    private c3d: C3D;
    private _fpsState: FPSState = {
        frameCount: 0,
        timeAccumulator: 0,
        lastTime: performance.now(),
        frameTimes: []
    };
    private exportDirHandle: any = null;

    constructor(c3dInstance: C3D) {
        if (!c3dInstance) {
            throw new Error("A C3D instance must be provided to the Three.js adapter.");
        }
        this.c3d = c3dInstance;
        // _fpsState is already initialized above

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
        const position = this.fromVector3(camera.position);
        const rotation = this.fromQuaternion(camera.quaternion);
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(camera.quaternion);
        const gaze = this.fromVector3(forward);

        this.c3d.gaze.recordGaze(position, rotation, gaze);
    }

    public startTracking(
        renderer: THREE.WebGLRenderer, 
        camera: THREE.Camera, 
        interactableGroup: THREE.Group | null = null, 
        userRenderFn: ((timestamp: number, frame: XRFrame) => void) | null = null
    ): void {
        if (!renderer || !camera) {
            console.error("Cognitive3D: renderer and camera must be provided to startTracking.");
            return;
        }

        // 1. Stop default tracker
        if (this.c3d.fpsTracker) {
            this.c3d.fpsTracker.stop();
            console.log("Cognitive3D: Stopped default FPS tracker in favor of XR-synced tracking.");
        }

        // 2. Setup Dynamic Objects & Gaze
        if (interactableGroup) {
            this._setupGazeRaycasting(camera, interactableGroup);
            console.log('Cognitive3D: Gaze raycasting enabled.');

            interactableGroup.children.forEach(child => {
                if (child.userData.isDynamic && child.userData.c3dId) {
                    const options: DynamicObjectOptions = {
                        positionThreshold: child.userData.positionThreshold,
                        rotationThreshold: child.userData.rotationThreshold,
                        scaleThreshold: child.userData.scaleThreshold
                    };
                    this.trackDynamicObject(child, child.userData.c3dId, options);
                    console.log(`Cognitive3D: Automatically started tracking dynamic object: ${child.name}`);
                }
            });
        }

        // 3. Initialize FPS State (Reset)
        this._initFPSState();

        // 4. Hook into the Render Loop
        const renderLoop = (timestamp: number, frame: any) => {
            // Update FPS logic
            this._updateFPS();

            // Run user's original render function
            if (userRenderFn) {
                userRenderFn(timestamp, frame);
            }

            this.updateTrackedObjectTransforms();
        };

        renderer.setAnimationLoop(renderLoop);
        console.log('Cognitive3D: Hooked into the render loop for analytics.');
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

        // Ignore massive jumps (session paused/resumed)
        if (delta > 1.0) delta = 0;

        this._fpsState.lastTime = now;
        this._fpsState.timeAccumulator += delta;
        this._fpsState.frameCount++;
        this._fpsState.frameTimes.push(delta);

        // Report every 1 second
        if (this._fpsState.timeAccumulator >= 1.0) {
            this._sendFPSData();

            // Reset counters for next interval
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

    private _setupGazeRaycasting(camera: THREE.Camera, interactableGroup: THREE.Group): void {
        const raycaster = new THREE.Raycaster();
        raycaster.far = 1000;
        this.c3d.gazeRaycaster = () => {
            // FIX: Use new THREE.Vector2(0, 0) instead of plain object
            raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
            const intersects = raycaster.intersectObjects(interactableGroup.children, true);

            if (intersects.length > 0) {
                const intersection = intersects[0];
                const intersectedObject = intersection.object;
                let targetObject: THREE.Object3D | null = intersectedObject;
                let isDynamic = false;

                while (targetObject) {
                    if (targetObject.userData.c3dId) {
                        isDynamic = true;
                        break;
                    }
                    if (!targetObject.parent || targetObject.parent === interactableGroup) {
                        break;
                    }
                    targetObject = targetObject.parent;
                }

                if (isDynamic && targetObject) {
                    const worldPoint = intersection.point.clone();
                    targetObject.worldToLocal(worldPoint);
                    worldPoint.x *= 1;
                    worldPoint.z *= -1;

                    return {
                        objectId: targetObject.userData.c3dId,
                        point: [worldPoint.x, worldPoint.y, worldPoint.z]
                    };
                } else {
                    const worldPoint = intersection.point;
                    return {
                        objectId: null,
                        point: [worldPoint.x, worldPoint.y, worldPoint.z]
                    };
                }
            }
            return null;
        };
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

            const worldPosition = new THREE.Vector3();
            const worldQuaternion = new THREE.Quaternion();
            const worldScale = new THREE.Vector3();

            threeObject.matrixWorld.decompose(worldPosition, worldQuaternion, worldScale);

            const positionChanged = worldPosition.distanceTo(threeLastPos) > (positionThreshold || 0.01);
            const rotationChanged = worldQuaternion.angleTo(threeLastRot) * (180 / Math.PI) > (rotationThreshold || 1);
            const scaleChanged = worldScale.distanceTo(threeLastScale) > (scaleThreshold || 0.01);

            if (positionChanged || rotationChanged || scaleChanged) {
                const correctedPosition = worldPosition.clone();
                correctedPosition.z *= -1;

                const correctedQuaternion = worldQuaternion.clone();
                correctedQuaternion.z *= -1;
                correctedQuaternion.w *= -1;

                dynamicObjectManager.addSnapshot(id, correctedPosition.toArray(), correctedQuaternion.toArray(), worldScale.toArray());

                threeLastPos.copy(worldPosition);
                threeLastRot.copy(worldQuaternion);
                threeLastScale.copy(worldScale);
            }
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
            if (obj.userData && obj.userData.c3dId) {
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
            async (gltf: any) => {
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
                    gltf.buffers[0].uri = "scene.bin";
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
        const originalScene = renderer.xr.isPresenting ? (renderer.xr as any).getScene?.() : camera.parent;
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
        const exportRoot = new THREE.Group();
        exportRoot.add(objectToExport.clone());

        exporter.parse(
            exportRoot,
            async (gltf: any) => {
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
                    gltf.buffers[0].uri = `${objectName}.bin`;
                }

                const gltfBlob = new Blob([JSON.stringify(gltf, null, 2)], { type: "model/gltf+json" });

                if (dir) {
                    if (binBlob) await this._writeFile(dir, `${objectName}.bin`, binBlob);
                    await this._writeFile(dir, `${objectName}.gltf`, gltfBlob);
                    await this._writeFile(dir, `${objectName}.png`, screenshotBlob);
                    console.log(`Exported object files for '${objectName}' to the 'scene' directory.`);
                } else {
                    console.warn("File System Access API not available; falling back to zip download.");
                    const zip = new JSZip();
                    if (binBlob) zip.file(`${objectName}.bin`, binBlob);
                    zip.file(`${objectName}.gltf`, gltfBlob);
                    zip.file(`${objectName}.png`, screenshotBlob);
                    const zipBlob = await zip.generateAsync({ type: "blob" });
                    this._downloadBlob(zipBlob, `${objectName}-export.zip`);
                }
            },
            (err) => {
                console.error(`GLTF export for ${objectName} failed:`, err);
            },
            { binary: false } as GLTFExporterOptions
        );
    }
}

export default C3DThreeAdapter;