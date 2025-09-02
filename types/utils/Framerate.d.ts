export default FPSTracker;
declare class FPSTracker {
    animationFrameId: number | null;
    lastTime: number;
    frameCount: number;
    elapsedTime: number;
    samplePeriod: number;
    deltaTimes: any[];
    lastDeltaTime: number;
    /**
     * _loop runs on every animation frame, calculates the delta time since the last frame and reports the FPS
     * once the sample period has been reached.
     * @param {number} currentTime - Timestamp provided by requestAnimationFrame.
     * @param {function(number): void} callback - The function to call with the FPS value.
     */
    _loop(currentTime: number, callback: (arg0: number) => void): void;
    /**
     * Starts the FPS tracking.
     * @param {function(number): void} callback - The function to call with the FPS value (RecordSensor).
     */
    start(callback: (arg0: number) => void): void;
    stop(): void;
}
