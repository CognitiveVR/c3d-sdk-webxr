import { isBrowser } from './environment';

// Tracks controller connection status and height relative to the HMD.

class ControllerTracker {
    constructor(c3dInstance) {
        this.c3d = c3dInstance;
        this.intervalId = null;
        this.xrSession = null;

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
        this.xrSession.addEventListener('inputsourceschange', this._onInputSourcesChange.bind(this));

        this.intervalId = setInterval(() => {
            if (this.xrSession) {
                this.xrSession.requestAnimationFrame((time, frame) => {
                    this._updateControllerTracking(frame);
                });
            }
        }, 1000);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        if (this.xrSession) {
            this.xrSession.removeEventListener('inputsourceschange', this._onInputSourcesChange.bind(this));
        }
    }

    _onInputSourcesChange(event) {
        event.added.forEach(source => this._handleControllerRegained(source));
        event.removed.forEach(source => this._handleControllerLost(source));
    }

    _handleControllerRegained(source) {
        if (source.handedness === 'left' && this.leftControllerLostTracking) {
            this.c3d.customEvent.send('c3d.Left Controller regained tracking', [0, 0, 0]);
            this.leftControllerLostTracking = false;
        }
        if (source.handedness === 'right' && this.rightControllerLostTracking) {
            this.c3d.customEvent.send('c3d.Right Controller regained tracking', [0, 0, 0]);
            this.rightControllerLostTracking = false;
        }
    }

    _handleControllerLost(source) {
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
    }

    _processControllerSource(source, frame, referenceSpace, viewerPose) {
        if (!source.gripSpace) return;

        const controllerPose = frame.getPose(source.gripSpace, referenceSpace);
        if (!controllerPose) return;

        const hmdPosition = viewerPose.transform.position;
        const controllerPosition = controllerPose.transform.position;
        const heightFromHMD = controllerPosition.y - hmdPosition.y;

        const sensorName = `c3d.controller.${source.handedness}.height.fromHMD`;
        this.c3d.sensor.recordSensor(sensorName, heightFromHMD);
    }

    _updateControllerTracking(frame) {
        const referenceSpace = this.c3d.xrSessionManager?.referenceSpace;
        if (!referenceSpace) return;

        const viewerPose = frame.getViewerPose(referenceSpace);
        if (!viewerPose) return;

        this.xrSession.inputSources.forEach(source => {
            this._processControllerSource(source, frame, referenceSpace, viewerPose);
        });
    }
}

export default ControllerTracker;