import { isBrowser } from './environment';

// Interface for the Main C3D instance dependencies used here
interface C3DInstance {
    customEvent: {
        send: (_name: string, position: number[], properties?: any) => void;
    };
    sensor: {
        recordSensor: (_name: string, value: any) => void;
    };
    xrSessionManager: any;
}

// Tracks controller connection status and height relative to the HMD.
class ControllerTracker {
    private c3d: C3DInstance;
    private intervalId: ReturnType<typeof setInterval> | null;
    private xrSession: XRSession | null;

    // Cooldown state
    private inLeftCooldown: boolean;
    private inRightCooldown: boolean;
    private leftControllerLostTracking: boolean;
    private rightControllerLostTracking: boolean;

    private readonly LEFT_TRACKING_COOLDOWN_SECONDS: number;
    private readonly RIGHT_TRACKING_COOLDOWN_SECONDS: number;

    constructor(c3dInstance: C3DInstance) {
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

    start(xrSession: XRSession): void {
        if (!isBrowser || this.intervalId) {
            return;
        }
        this.xrSession = xrSession;
        // @ts-ignore: EventListener types for WebXR can vary by environment setup
        this.xrSession.addEventListener('inputsourceschange', this._onInputSourcesChange.bind(this));

        this.intervalId = setInterval(() => {
            if (this.xrSession) {
                this.xrSession.requestAnimationFrame((time: number, frame: XRFrame) => {
                    this._updateControllerTracking(frame);
                });
            }
        }, 1000);
    }

    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        if (this.xrSession) {
            // @ts-ignore
            this.xrSession.removeEventListener('inputsourceschange', this._onInputSourcesChange.bind(this));
        }
    }

    private _onInputSourcesChange(event: any): void {
        const xrEvent = event as XRInputSourcesChangeEvent;
        xrEvent.added.forEach((source: XRInputSource) => this._handleControllerRegained(source));
        xrEvent.removed.forEach((source: XRInputSource) => this._handleControllerLost(source));
    }

    private _handleControllerRegained(source: XRInputSource): void {
        if (source.handedness === 'left' && this.leftControllerLostTracking) {
            this.c3d.customEvent.send('c3d.Left Controller regained tracking', [0, 0, 0]);
            this.leftControllerLostTracking = false;
        }
        if (source.handedness === 'right' && this.rightControllerLostTracking) {
            this.c3d.customEvent.send('c3d.Right Controller regained tracking', [0, 0, 0]);
            this.rightControllerLostTracking = false;
        }
    }

    private _handleControllerLost(source: XRInputSource): void {
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

    private _processControllerSource(source: XRInputSource, frame: XRFrame, referenceSpace: XRReferenceSpace, viewerPose: XRViewerPose): void {
        if (!source.gripSpace) return;

        const controllerPose = frame.getPose(source.gripSpace, referenceSpace);
        if (!controllerPose) return;

        const hmdPosition = viewerPose.transform.position;
        const controllerPosition = controllerPose.transform.position;
        const heightFromHMD = controllerPosition.y - hmdPosition.y;

        const sensorName = `c3d.controller.${source.handedness}.height.fromHMD`;
        this.c3d.sensor.recordSensor(sensorName, heightFromHMD);
    }

    private _updateControllerTracking(frame: XRFrame): void {
        const referenceSpace = this.c3d.xrSessionManager?.referenceSpace;
        if (!referenceSpace) return;

        const viewerPose = frame.getViewerPose(referenceSpace);
        if (!viewerPose) return;

        this.xrSession?.inputSources.forEach((source: XRInputSource) => {
            this._processControllerSource(source, frame, referenceSpace, viewerPose);
        });
    }
}

export default ControllerTracker;