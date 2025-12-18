import { isBrowser } from './environment';

interface Quaternion {
    x: number;
    y: number;
    z: number;
    w: number;
}

interface Euler {
    x: number;
    y: number;
    z: number;
}

// Interface for the callback data
export interface OrientationData {
    pitch: number;
    yaw: number;
}

type OrientationCallback = (data: OrientationData) => void;

/**
 * Convert a WebXR quaternion to Euler angles (YXZ order).
 * @param q The quaternion.
 * @returns Euler angles in radians.
 */
function quaternionToEulerYXZ(q: Quaternion): Euler {
    const { x, y, z, w } = q;
    const euler = { x: 0, y: 0, z: 0 };

    const sinX = 2 * (w * x - y * z);     // sin(pitch)

    // Handle gimbal lock 
    if (Math.abs(sinX) >= 1) {
        euler.x = Math.sign(sinX) * Math.PI / 2;
    } else {
        euler.x = Math.asin(sinX);
    }

    // yaw
    const sinY_cosX = 2 * (w * y + z * x);
    const cosY_cosX = 1 - 2 * (x * x + y * y);
    euler.y = Math.atan2(sinY_cosX, cosY_cosX);

    // roll
    const sinZ_cosX = 2 * (w * z + x * y);
    const cosZ_cosX = 1 - 2 * (z * z + x * x);
    euler.z = Math.atan2(sinZ_cosX, cosZ_cosX);

    return euler;
}

/**
 * Converts radians to degrees.
 * @param radians The angle in radians.
 * @returns The angle in degrees.
 */
function radToDeg(radians: number): number {
    return radians * (180 / Math.PI);
}

// Tracks the HMD's pitch and yaw at a 1 sec interval.
class HMDOrientationTracker {
    private intervalId: ReturnType<typeof setInterval> | null;
    private xrSession: XRSession | null;
    private referenceSpace: XRReferenceSpace | null;
    private callback: OrientationCallback | null;

    constructor() {
        this.intervalId = null;
        this.xrSession = null;
        this.referenceSpace = null;
        this.callback = null;
    }

    start(xrSession: XRSession, referenceSpace: XRReferenceSpace, callback: OrientationCallback): void {
        if (!isBrowser || this.intervalId) {
            return;
        }

        this.xrSession = xrSession;
        this.referenceSpace = referenceSpace;
        this.callback = callback;

        this.intervalId = setInterval(() => {
            if (this.xrSession) {
                this.xrSession.requestAnimationFrame((time, frame) => {
                    // Safety check for referenceSpace in TS
                    if (this.referenceSpace) {
                        const viewerPose = frame.getViewerPose(this.referenceSpace);
                        if (viewerPose) {
                            this.processPose(viewerPose);
                        }
                    }
                });
            }
        }, 1000);
    }

    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    processPose(pose: XRViewerPose): void {
        const { orientation } = pose.transform;

        const euler = quaternionToEulerYXZ(orientation);

        // Pitch calc
        let pitch = radToDeg(euler.x);
        if (pitch > 180) pitch -= 360;
        pitch *= -1; // Invert to match Unity convention

        // Yaw calc 
        let yaw = radToDeg(euler.y);
        if (yaw > 180) yaw -= 360;

        if (this.callback) {
            this.callback({ pitch, yaw });
        }
    }
}

export default HMDOrientationTracker;