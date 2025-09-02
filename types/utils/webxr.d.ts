/**
 * For data that can only be retrieved from an active webxr session,
 * such as gaze data, and vr device information
 */
export class XRSessionManager {
    constructor(gazeTracker: any, xrSession: any);
    gazeTracker: any;
    xrSession: any;
    referenceSpace: any;
    isTracking: boolean;
    animationFrameHandle: any;
    onXRFrame(timestamp: any, frame: any): void;
    start(): Promise<void>;
    stop(): void;
}
export function getHMDInfo(inputSources: any): any;
export function getEnabledFeatures(xrSession: any): {
    handTracking: any;
    eyeTracking: any;
};
