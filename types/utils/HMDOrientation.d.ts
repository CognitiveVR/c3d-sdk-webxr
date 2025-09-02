export default HMDOrientationTracker;
declare class HMDOrientationTracker {
    intervalId: NodeJS.Timeout | null;
    xrSession: any;
    referenceSpace: any;
    callback: any;
    start(xrSession: any, referenceSpace: any, callback: any): void;
    stop(): void;
    processPose(pose: any): void;
}
