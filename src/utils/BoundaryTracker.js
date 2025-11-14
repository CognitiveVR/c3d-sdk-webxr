// src/utils/BoundaryTracker.js

import { isBrowser } from './environment';

class BoundaryTracker {
    constructor(c3dInstance) {
        this.c3d = c3dInstance;
        this.intervalId = null;
        this.xrSession = null;
        this.referenceSpace = null;
        this.updateInterval = 1000; // 1 second

        // State tracking
        this.previousBoundaryPoints = []; // Stores {x, z}
        this.previousRoomSize = { width: 0, depth: 0, area: 0 };
        this.isHMDOutsideBoundary = false;
        
        console.log("C3D-SDK: BoundaryTracker initialized."); // LOG
    }

    start(xrSession, referenceSpace) {
        console.log("C3D-SDK: BoundaryTracker.start() called."); // LOG
        if (!isBrowser || this.intervalId || !xrSession || !referenceSpace) {
            console.warn("C3D-SDK: BoundaryTracker.start() exiting early. Conditions not met:", // LOG
                { isBrowser, intervalId: this.intervalId, xrSession, referenceSpace });
            return;
        }

        this.xrSession = xrSession;
        this.referenceSpace = referenceSpace;
        
        console.log("C3D-SDK: BoundaryTracker starting in 1 second..."); // LOG
        // 1 sec delay 
        setTimeout(() => {
            console.log("C3D-SDK: BoundaryTracker running initial check..."); // LOG
            this._checkBoundary(true); // 'true' to indicate this is the initial check

            // Start periodic checking
            console.log("C3D-SDK: BoundaryTracker starting update interval."); // LOG
            this.intervalId = setInterval(
                () => this._checkBoundary(false), // 'false' for subsequent checks
                this.updateInterval
            );
        }, 1000);
    }

    stop() {
        console.log("C3D-SDK: BoundaryTracker.stop() called."); // LOG
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.xrSession = null;
        this.referenceSpace = null;
        this.previousBoundaryPoints = [];
        this.previousRoomSize = { width: 0, depth: 0, area: 0 };
        this.isHMDOutsideBoundary = false;
    }

    /**
     * Main update loop called by setInterval.
     * @param {boolean} isInitialCheck - Flag to set initial properties without firing events.
     */
    _checkBoundary(isInitialCheck = false) {
        if (!this.xrSession || !this.referenceSpace) {
            console.warn("C3D-SDK: BoundaryTracker._checkBoundary exiting - no session or reference space."); // LOG
            return;
        }

        const boundaryPoints = this.referenceSpace.boundsGeometry;

        if (!boundaryPoints || boundaryPoints.length === 0) {
            if (isInitialCheck) {
                console.warn("C3D-SDK: BoundaryTracker - No 'boundsGeometry' found on initial check. Is a Roomscale boundary active?");
            } else if (this.previousBoundaryPoints.length === 0) {
                // This will log once per second if no boundary is ever found
                console.log("C3D-SDK: BoundaryTracker - Still no 'boundsGeometry' found. Waiting for a boundary...");
            }

            if (this.previousBoundaryPoints.length > 0) {
                console.log("C3D-SDK: BoundaryTracker - Boundary points disappeared."); // LOG
                this.previousBoundaryPoints = [];
                this.previousRoomSize = { width: 0, depth: 0, area: 0 };
            }
            this.isHMDOutsideBoundary = false; // No boundary, so can't be outside it
            return;
        }

        const boundaryChanged = this._hasBoundaryChanged(boundaryPoints);
        // console.log(`C3D-SDK: Boundary changed? ${boundaryChanged}`); // noisy log

        if (isInitialCheck || boundaryChanged) {
            const newRoomSize = this._getRoomSize(boundaryPoints);
            const newArea = newRoomSize.area;
            const oldArea = this.previousRoomSize.area;

            console.log(`C3D-SDK: Setting session properties & sensor for RoomSize: ${newArea.toFixed(2)}m²`); // LOG

            // Set session properties
            this.c3d.setSessionProperty("c3d.roomsizeMeters", newArea);
            this.c3d.setSessionProperty("c3d.roomsizeDescriptionMeters", `${newRoomSize.width.toFixed(1)} x ${newRoomSize.depth.toFixed(1)}`);
            this.c3d.sensor.recordSensor('RoomSize', newArea);

            if (!isInitialCheck && boundaryChanged) {
                if (Math.abs(newArea - oldArea) < 0.01) {
                    console.log("C3D-SDK: BoundaryTracker: User recentered. Sending event."); // LOG
                    this.c3d.customEvent.send('c3d.User recentered', [0, 0, 0]);
                } else {
                    console.log("C3D-SDK: BoundaryTracker: User changed boundary. Sending event."); // LOG
                    this.c3d.customEvent.send('c3d.User changed boundary', [0, 0, 0], {
                        "Previous Room Size": oldArea,
                        "New Room Size": newArea
                    });
                }
            }

            // Update stored values
            this.previousBoundaryPoints = boundaryPoints.map(p => ({ x: p.x, z: p.z }));
            this.previousRoomSize = newRoomSize;
        }

        // Exit Detection
        this.xrSession.requestAnimationFrame((time, frame) => {
            const viewerPose = frame.getViewerPose(this.referenceSpace);
            if (viewerPose) {
                const hmdPosition = viewerPose.transform.position;
                
                const isInside = this._isPointInPolygon(hmdPosition, this.previousBoundaryPoints);

                if (!isInside && !this.isHMDOutsideBoundary) {
                    // User just stepped OUT
                    console.log("C3D-SDK: BoundaryTracker: User exited boundary. Sending event."); // LOG
                    this.c3d.customEvent.send('c3d.user.exited.boundary', [0, 0, 0]);
                }
                // Update state for next check
                this.isHMDOutsideBoundary = !isInside;
            }
        });
    }
    
    /**
     * Forces the tracker to re-send the current boundary and room size data.
     */
    forceBoundaryUpdate() {
        if (!this.referenceSpace) {
            console.warn("C3D-SDK: BoundaryTracker.forceBoundaryUpdate failed - no reference space."); // LOG
            return;
        }

        const boundaryPoints = this.referenceSpace.boundsGeometry;
        if (!boundaryPoints || boundaryPoints.length === 0) {
            console.log("C3D-SDK: BoundaryTracker.forceBoundaryUpdate - no boundary points found."); // LOG
            return; // No boundary to send
        }

        console.log("C3D-SDK: BoundaryTracker: Forcing boundary update for new scene."); // LOG
        const newRoomSize = this._getRoomSize(boundaryPoints);
        const newArea = newRoomSize.area;

        // Re-send the session properties and sensor data
        this.c3d.setSessionProperty("c3d.roomsizeMeters", newArea);
        this.c3d.setSessionProperty("c3d.roomsizeDescriptionMeters", `${newRoomSize.width.toFixed(1)} x ${newRoomSize.depth.toFixed(1)}`);
        this.c3d.sensor.recordSensor('RoomSize', newArea);

        // Update stored values
        this.previousBoundaryPoints = boundaryPoints.map(p => ({ x: p.x, z: p.z }));
        this.previousRoomSize = newRoomSize;
    }

    /**
     * Checks if the boundary has changed compared to the stored points.
     */
    _hasBoundaryChanged(newPoints) {
        if (this.previousBoundaryPoints.length === 0 && newPoints.length > 0) {
            return true;
        }
        if (this.previousBoundaryPoints.length !== newPoints.length) {
            return true;
        }
        
        if (this.previousBoundaryPoints.length > 0 && newPoints.length === 0) {
            return false;
        }

        for (let i = 0; i < newPoints.length; i++) {
            const prev = this.previousBoundaryPoints[i];
            const curr = newPoints[i];
            
            if (Math.abs(prev.x - curr.x) >= 0.1 || Math.abs(prev.z - curr.z) >= 0.1) {
                return true;
            }
        }
        return false;
    }

    /**
     * Calculates the room size (width and depth) from boundary points.
     */
    _getRoomSize(points) {
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

    /**
     * Checks if a point is inside a polygon using the ray-casting algorithm.
     */
    _isPointInPolygon(point, polygon) {
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