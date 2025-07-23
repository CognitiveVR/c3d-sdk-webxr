import { isBrowser } from './environment';

// Tracks controller connection status and height relative to the HMD.

class ControllerTracker {
    constructor(c3dInstance) {
        this.c3d = c3dInstance;
        this.intervalId = null;
        this.xrSession = null;
        this.lastTrackedFrame = new Map();

        // Cooldown state
        this.inLeftCooldown = false;
        this.inRightCooldown = false;
        this.leftControllerLostTracking = false;
        this.rightControllerLostTracking = false;

        this.LEFT_TRACKING_COOLDOWN_SECONDS = 5;
        this.RIGHT_TRACKING_COOLDOWN_SECONDS = 5;
    }

    start(xrSession) {
        if (!isBrowser || this.intervalId) {
            return;
        }
        this.xrSession = xrSession;

        // Listen for when input sources are connected or disconnected
        this.xrSession.addEventListener('inputsourceschange', this.onInputSourcesChange.bind(this));

        // Start a loop to check controller height and tracking status
        this.intervalId = setInterval(() => {
            if (this.xrSession) {
                this.xrSession.requestAnimationFrame((time, frame) => {
                    this.updateControllerTracking(frame);
                });
            }
        }, 1000); // Run once per second
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        if (this.xrSession) {
            this.xrSession.removeEventListener('inputsourceschange', this.onInputSourcesChange.bind(this));
        }
    }

    onInputSourcesChange(event) {
        // Handle newly connected controllers
        event.added.forEach(source => {
            if (source.handedness === 'left' && this.leftControllerLostTracking) {
                this.c3d.customEvent.send('c3d.Left Controller regained tracking', [0, 0, 0]);
                this.leftControllerLostTracking = false;
            }
            if (source.handedness === 'right' && this.rightControllerLostTracking) {
                this.c3d.customEvent.send('c3d.Right Controller regained tracking', [0, 0, 0]);
                this.rightControllerLostTracking = false;
            }
        });

        // Handle disconnected controllers
        event.removed.forEach(source => {
            if (source.handedness === 'left' && !this.inLeftCooldown) {
                this.c3d.customEvent.send('c3d.Left Controller Lost tracking', [0, 0, 0]);
                this.inLeftCooldown = true;
                this.leftControllerLostTracking = true;
                setTimeout(() => { this.inLeftCooldown = false; }, this.LEFT_TRACKING_COOLDOWN_SECONDS * 1000);
            }
            if (source.handedness === 'right' && !this.inRightCooldown) {
                this.c3d.customEvent.send('c3d.Right Controller Lost tracking', [0, 0, 0]);
                this.inRightCooldown = true;
                this.rightControllerLostTracking = true;
                setTimeout(() => { this.inRightCooldown = false; }, this.RIGHT_TRACKING_COOLDOWN_SECONDS * 1000);
            }
        });
    }

    updateControllerTracking(frame) {
        const referenceSpace = this.c3d.xrSessionManager ? this.c3d.xrSessionManager.referenceSpace : null;
        if (!referenceSpace) return;

        const viewerPose = frame.getViewerPose(referenceSpace);
        if (!viewerPose) return;

        for (const source of this.xrSession.inputSources) {
            if (!source.gripSpace) continue;

            const controllerPose = frame.getPose(source.gripSpace, referenceSpace);
            if (controllerPose) {
                const hmdPosition = viewerPose.transform.position;
                const controllerPosition = controllerPose.transform.position;

                // Calculate vertical distance from HMD to controller
                const heightFromHMD = controllerPosition.y - hmdPosition.y;

                if (source.handedness === 'left') {
                    this.c3d.sensor.recordSensor('c3d.controller.left.height.fromHMD', heightFromHMD);
                } else if (source.handedness === 'right') {
                    this.c3d.sensor.recordSensor('c3d.controller.right.height.fromHMD', heightFromHMD);
                }
            }
        }
    }
}

export default ControllerTracker;