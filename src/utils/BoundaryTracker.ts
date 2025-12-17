/*
 * LIMITATIONS / TODO 
 * ----------------------------------------
 * 1. Missing 'reset' Event Handling:
 *    The code does not listen for `referenceSpace.addEventListener('reset',...)`. 
 *    If a user opens the OS menu and switches from Stationary to Room Scale during the session,
 *    the `referenceSpace` object may become invalid or jump origins. The tracker will fail 
 *    to detect this runtime switch without the event listener.
 *
 * 2. Missing Threshold Heuristic:
 *    To definitively identify the mode, you must implement a logic gate:
 *    IF (Area < 1.6m²) THEN "Stationary" ELSE "Room Scale". 
 *    Webxr API does not provide explicit Stationary vs Room Scale mode info only capabilities. 

 */

import { isBrowser } from './environment';

// Local interface to define the shape of the C3D instance this class interacts with
interface C3DInstance {
    customEvent: {
        send: (name: string, position: number[], properties?: any) => void;
    };
    sensor: {
        recordSensor: (name: string, value: any) => void;
    };
    setSessionProperty: (key: string, value: any) => void;
    // Relaxed to 'any' to accept the full XRSessionManager class or null
    xrSessionManager: any;
}

class BoundaryTracker {
    private c3d: C3DInstance;
    private intervalId: ReturnType<typeof setInterval> | null;
    private xrSession: XRSession | null;
    public referenceSpace: XRReferenceSpace | null; // Public so C3D can check it
    private updateInterval: number;
    private previousBoundaryPoints: { x: number; z: number }[];
    private previousRoomSize: { width: number; depth: number; area: number };
    private isHMDOutsideBoundary: boolean;
    private boundaryType: string;

    constructor(c3dInstance: C3DInstance) {
        this.c3d = c3dInstance;
        this.intervalId = null;
        this.xrSession = null;
        this.referenceSpace = null;
        this.updateInterval = 1000; // 1 second

        // State tracking
        this.previousBoundaryPoints = []; // Stores {x, z}
        this.previousRoomSize = { width: 0, depth: 0, area: 0 };
        this.isHMDOutsideBoundary = false;
        this.boundaryType = "Unknown";

        console.log("C3D-SDK: BoundaryTracker initialized."); 
    }

    start(xrSession: XRSession, referenceSpace: XRReferenceSpace): void {
        console.log("C3D-SDK: BoundaryTracker.start() called.");
        if (!isBrowser || this.intervalId || !xrSession || !referenceSpace) {
            console.warn("C3D-SDK: BoundaryTracker.start() exiting early.");
            return;
        }

        this.xrSession = xrSession;
        this.referenceSpace = referenceSpace;

        // Check if boundsGeometry exists (standard in Bounded Reference Spaces)
        const boundsGeometry = (referenceSpace as any).boundsGeometry as DOMPointReadOnly[];

        if (boundsGeometry && boundsGeometry.length > 0) {
            this.boundaryType = "Room Scale";
            this.previousBoundaryPoints = boundsGeometry.map(p => ({ x: p.x, z: p.z }));

            // Set room size session properties only for room scale
            const newRoomSize = this._getRoomSize(this.previousBoundaryPoints);
            const roomSizeString = `${newRoomSize.width.toFixed(2)} x ${newRoomSize.depth.toFixed(2)}`;
            this.c3d.setSessionProperty("c3d.roomsizeMeters", newRoomSize.area);
            this.c3d.setSessionProperty("c3d.roomsizeDescriptionMeters", roomSizeString);

            console.log(`C3D-SDK: BoundaryTracker boundary type '${this.boundaryType}', Room Size: ${roomSizeString} meters.`);
        } else {
            console.warn("C3D-SDK: BoundaryTracker - No boundsGeometry found. Reporting Stationary boundary type without room size.");
            this.boundaryType = "Stationary";
            this.previousBoundaryPoints = []; // No polygon for stationary
        }

        // Set boundaryType session property always
        this.c3d.setSessionProperty("c3d.boundaryType", this.boundaryType);

        setTimeout(() => {
            this._checkBoundary(true);
            this.intervalId = setInterval(() => this._checkBoundary(false), this.updateInterval);
        }, 1000);
    }

    stop(): void {
        console.log("C3D-SDK: BoundaryTracker.stop() called."); 
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.xrSession = null;
        this.referenceSpace = null;
        this.previousBoundaryPoints = [];
        this.previousRoomSize = { width: 0, depth: 0, area: 0 };
        this.isHMDOutsideBoundary = false;
        this.boundaryType = "Unknown";
    }
    
    private _checkBoundary(isInitialCheck: boolean = false): void {
        if (!this.xrSession || !this.referenceSpace) {
            console.warn("C3D-SDK: BoundaryTracker._checkBoundary exiting - no session or reference space."); 
            return;
        }

        const boundsGeometry = (this.referenceSpace as any).boundsGeometry as DOMPointReadOnly[];

        // Only do boundary change and user position exit detection if Room Scale
        if (this.boundaryType === "Room Scale" && boundsGeometry && boundsGeometry.length > 0) {
            const boundaryChanged = this._hasBoundaryChanged(boundsGeometry);
            if (boundaryChanged) {
                this.previousBoundaryPoints = boundsGeometry.map(p => ({ x: p.x, z: p.z }));
                const newRoomSize = this._getRoomSize(this.previousBoundaryPoints);
                this.previousRoomSize = newRoomSize;
                this.c3d.setSessionProperty("c3d.roomsizeMeters", newRoomSize.area);
                this.c3d.setSessionProperty("c3d.roomsizeDescriptionMeters", `${newRoomSize.width.toFixed(2)} x ${newRoomSize.depth.toFixed(2)}`);

                if (!isInitialCheck) {
                    this.c3d.customEvent.send('c3d.User changed boundary', [0, 0, 0], {
                        "Previous Room Size": this.previousRoomSize.area,
                        "New Room Size": newRoomSize.area
                    });
                }

                console.log(`C3D-SDK: BoundaryTracker: Boundary changed detected. New Area: ${newRoomSize.area.toFixed(2)}`);
            }

            // Exit Boundary Detection
            this.xrSession.requestAnimationFrame((time, frame) => {
                // Ensure referenceSpace is still valid
                if (!this.referenceSpace) return;
                
                const viewerPose = frame.getViewerPose(this.referenceSpace);
                if (viewerPose) {
                    const hmdPosition = viewerPose.transform.position;
                    const isInside = this._isPointInPolygon(hmdPosition, this.previousBoundaryPoints);

                    if (!isInside && !this.isHMDOutsideBoundary) {
                        console.log("C3D-SDK: BoundaryTracker: User exited boundary. Sending event."); 
                        this.c3d.customEvent.send('c3d.user.exited.boundary', [0, 0, 0]);
                        this.isHMDOutsideBoundary = true;
                    } else if (isInside && this.isHMDOutsideBoundary) {
                        this.isHMDOutsideBoundary = false;
                        console.log("C3D-SDK: BoundaryTracker: User re-entered boundary.");
                    }
                }
            });
        }
    }

    public forceBoundaryUpdate(): void {
        if (!this.referenceSpace) {
            console.warn("C3D-SDK: BoundaryTracker.forceBoundaryUpdate failed - no reference space."); 
            return;
        }

        const boundaryPoints = this.previousBoundaryPoints;
        if (!boundaryPoints || boundaryPoints.length === 0) {
            console.log("C3D-SDK: BoundaryTracker.forceBoundaryUpdate - no boundary points found."); 
            return; 
        }

        console.log("C3D-SDK: BoundaryTracker: Forcing boundary update for new scene."); 
        const newRoomSize = this._getRoomSize(boundaryPoints);
        const newArea = newRoomSize.area;

        // Re-send the session properties and sensor data
        this.c3d.setSessionProperty("c3d.roomsizeMeters", newArea);
        this.c3d.setSessionProperty("c3d.roomsizeDescriptionMeters", `${newRoomSize.width.toFixed(2)} x ${newRoomSize.depth.toFixed(2)}`);
        this.c3d.sensor.recordSensor('RoomSize', newArea);

        this.previousRoomSize = newRoomSize;
    }

    private _hasBoundaryChanged(newPoints: any): boolean {
        // Simple length check
        if (this.previousBoundaryPoints.length !== newPoints.length) return true;
        if (newPoints.length === 0) return false;

        // Point-by-point comparison (with small tolerance)
        for (let i = 0; i < newPoints.length; i++) {
            const prev = this.previousBoundaryPoints[i];
            const curr = newPoints[i];
            if (Math.abs(prev.x - curr.x) >= 0.1 || Math.abs(prev.z - curr.z) >= 0.1) {
                return true;
            }
        }
        return false;
    }

    private _getRoomSize(points: { x: number; z: number }[]): { width: number; depth: number; area: number } {
        if (!points || points.length === 0) {
            return { width: 0, depth: 0, area: 0 };
        }

        let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;

        for (const p of points) {
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.z < minZ) minZ = p.z;
            if (p.z > maxZ) maxZ = p.z;
        }

        const width = maxX - minX;
        const depth = maxZ - minZ;
        return {
            width: width,
            depth: depth,
            area: width * depth
        };
    }

    private _isPointInPolygon(point: { x: number; z: number }, polygon: { x: number; z: number }[]): boolean {
        if (!polygon || polygon.length < 3) {
            return false;
        }

        let isInside = false;
        let j = polygon.length - 1;
        for (let i = 0; i < polygon.length; i++) {
            const p_i = polygon[i];
            const p_j = polygon[j];

            const intersects = ((p_i.z > point.z) !== (p_j.z > point.z))
                && (point.x < (p_j.x - p_i.x) * (point.z - p_i.z) / (p_j.z - p_i.z) + p_i.x);

            if (intersects) {
                isInside = !isInside;
            }
            j = i;
        }
        return isInside;
    }
}

export default BoundaryTracker;