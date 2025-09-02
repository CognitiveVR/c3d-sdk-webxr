export default ControllerTracker;
declare class ControllerTracker {
    constructor(c3dInstance: any);
    c3d: any;
    intervalId: NodeJS.Timeout | null;
    xrSession: any;
    inLeftCooldown: boolean;
    inRightCooldown: boolean;
    leftControllerLostTracking: boolean;
    rightControllerLostTracking: boolean;
    LEFT_TRACKING_COOLDOWN_SECONDS: number;
    RIGHT_TRACKING_COOLDOWN_SECONDS: number;
    start(xrSession: any): void;
    stop(): void;
    _onInputSourcesChange(event: any): void;
    _handleControllerRegained(source: any): void;
    _handleControllerLost(source: any): void;
    _processControllerSource(source: any, frame: any, referenceSpace: any, viewerPose: any): void;
    _updateControllerTracking(frame: any): void;
}
