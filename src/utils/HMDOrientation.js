import { isBrowser } from './environment';

/**
 * Convert a WebXR quaternion to Euler angles (YXZ order).
 * @param {{x: number, y: number, z: number, w: number}} q The quaternion.
 * @returns {{x: number, y: number, z: number}} Euler angles in radians.
 */
function quaternionToEulerYXZ(q) {
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
 * @param {number} radians The angle in radians.
 * @returns {number} The angle in degrees.
 */
function radToDeg(radians) {
    return radians * (180 / Math.PI);
}

// Tracks the HMD's pitch and yaw at a 1 sec interval.
class HMDOrientationTracker {
    constructor() {
        this.intervalId = null;
        this.xrSession = null;
        this.referenceSpace = null;
        this.callback = null;
    }

    start(xrSession, referenceSpace, callback) {
        if (!isBrowser || this.intervalId) {
            return;
        }

        this.xrSession = xrSession;
        this.referenceSpace = referenceSpace;
        this.callback = callback;

        this.intervalId = setInterval(() => {
            this.xrSession.requestAnimationFrame((time, frame) => {
                const viewerPose = frame.getViewerPose(this.referenceSpace);
                if (viewerPose) {
                    this.processPose(viewerPose);
                }
            });
        }, 1000);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    processPose(pose) {
        const { orientation } = pose.transform;

        const euler = quaternionToEulerYXZ(orientation);

        // Pitch calc
        let pitch = radToDeg(euler.x);
        if (pitch > 180) pitch -= 360;
        pitch *= -1; // Invert to match Unity convention

        // Yaw calc 
        let yaw = radToDeg(euler.y);
        if (yaw > 180) yaw -= 360;

        this.callback({ pitch, yaw });
    }
}

export default HMDOrientationTracker;
