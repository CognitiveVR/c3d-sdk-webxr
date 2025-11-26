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
        this.boundaryType = "Unknown";

        console.log("C3D-SDK: BoundaryTracker initialized."); // LOG
    }

    start(xrSession, referenceSpace) {
        console.log("C3D-SDK: BoundaryTracker.start() called.");
        if (!isBrowser || this.intervalId || !xrSession || !referenceSpace) {
            console.warn("C3D-SDK: BoundaryTracker.start() exiting early.");
            return;
        }

        this.xrSession = xrSession;
        this.referenceSpace = referenceSpace;

        if (referenceSpace.boundsGeometry && referenceSpace.boundsGeometry.length > 0) {
            this.boundaryType = "Room Scale";
            this.previousBoundaryPoints = referenceSpace.boundsGeometry.map(p => ({ x: p.x, z: p.z }));

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
        this.boundaryType = "Unknown";
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

        // Only do boundary change and user position exit detection if Room Scale
        if (this.boundaryType === "Room Scale" && this.referenceSpace.boundsGeometry && this.referenceSpace.boundsGeometry.length > 0) {
            const boundaryChanged = this._hasBoundaryChanged(this.referenceSpace.boundsGeometry);
            if (boundaryChanged) {
                this.previousBoundaryPoints = this.referenceSpace.boundsGeometry.map(p => ({ x: p.x, z: p.z }));
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
                const viewerPose = frame.getViewerPose(this.referenceSpace);
                if (viewerPose) {
                    const hmdPosition = viewerPose.transform.position;
                    const isInside = this._isPointInPolygon(hmdPosition, this.previousBoundaryPoints);

                    if (!isInside && !this.isHMDOutsideBoundary) {
                        console.log("C3D-SDK: BoundaryTracker: User exited boundary. Sending event."); // LOG
                        this.c3d.customEvent.send('c3d.user.exited.boundary', [0, 0, 0]);
                        this.isHMDOutsideBoundary = true;
                    } else if (isInside && this.isHMDOutsideBoundary) {
                        this.isHMDOutsideBoundary = false;
                        console.log("C3D-SDK: BoundaryTracker: User re-entered boundary.");
                    }
                }
            });
        } else {
            // Stationary: skip position boundary exit checks
            if (!isInitialCheck) {
                // Optionally log or handle stationary state without boundary exit tests
                // console.log("C3D-SDK: BoundaryTracker in Stationary mode, skipping exit boundary tests.");
            }
        }
    }

    forceBoundaryUpdate() {
        if (!this.referenceSpace) {
            console.warn("C3D-SDK: BoundaryTracker.forceBoundaryUpdate failed - no reference space."); // LOG
            return;
        }

        const boundaryPoints = this.previousBoundaryPoints;
        if (!boundaryPoints || boundaryPoints.length === 0) {
            console.log("C3D-SDK: BoundaryTracker.forceBoundaryUpdate - no boundary points found."); // LOG
            return; // No boundary to send
        }

        console.log("C3D-SDK: BoundaryTracker: Forcing boundary update for new scene."); // LOG
        const newRoomSize = this._getRoomSize(boundaryPoints);
        const newArea = newRoomSize.area;

        // Re-send the session properties and sensor data
        this.c3d.setSessionProperty("c3d.roomsizeMeters", newArea);
        this.c3d.setSessionProperty("c3d.roomsizeDescriptionMeters", `${newRoomSize.width.toFixed(2)} x ${newRoomSize.depth.toFixed(2)}`);
        this.c3d.sensor.recordSensor('RoomSize', newArea);

        this.previousRoomSize = newRoomSize;
    }

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