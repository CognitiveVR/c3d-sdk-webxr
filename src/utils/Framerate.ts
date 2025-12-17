/**
 * FPSTracker.js
 * 
 * Purpose:
 * - Provides a generic browser FPS tracker for non-XR applications.
 * - Uses window.requestAnimationFrame to measure the framerate delivered by the browser's main rendering loop.
 * - Should be used as the fallback when no engine-specific or XR render loop integration is possible.
 * Note:
 * - The adapters for engines handle switching between this generic tracker and their engine-synced loop 
 *   automatically based on the application's state (immersive XR or not).
 */

import { isBrowser } from "./environment";

// Interface for the metrics object passed to the callback
export interface FPSMetrics {
    avg: number;
    '1pl': number;
}

// Type definition for the callback function
type FPSCallback = (metrics: FPSMetrics) => void;

class FPSTracker {
  private animationFrameId: number | null;
  private lastTime: number;
  private frameCount: number;
  private elapsedTime: number;
  private samplePeriod: number;
  private deltaTimes: number[];
  public lastDeltaTime: number; // Public to potentially allow reading the very last delta externally if needed

  constructor() {
    this.animationFrameId = null;
    this.lastTime = 0;
    this.frameCount = 0;
    this.elapsedTime = 0;
    this.samplePeriod = 1000; // 1 second
    this.deltaTimes = []; // delta take for each frame in a sample period 
    this.lastDeltaTime = 0;

    this._loop = this._loop.bind(this);
  }

  /**
   * _loop runs on every animation frame, calculates the delta time since the last frame and reports the FPS
   * once the sample period has been reached.
   * @param currentTime - Timestamp provided by requestAnimationFrame.
   * @param callback - The function to call with the FPS value.
   */
  private _loop(currentTime: number, callback: FPSCallback): void { 
    if (this.lastTime > 0) {
      const deltaTime = currentTime - this.lastTime;
      this.lastDeltaTime = deltaTime;
      this.elapsedTime += deltaTime;
      this.frameCount++;
      this.deltaTimes.push(deltaTime); // Record the time for this frame

      if (this.elapsedTime >= this.samplePeriod) {
        // Average FPS 
        const averageFps = (this.frameCount / this.elapsedTime) * 1000;

        // 1%L FPS
        let onePercentLowFps = averageFps; 
        if (this.deltaTimes.length > 0) {
            this.deltaTimes.sort((a, b) => b - a);
            const onePercentCount = Math.ceil(this.deltaTimes.length * 0.01);
            const slowestFrames = this.deltaTimes.slice(0, onePercentCount);
            const averageSlowestTime = slowestFrames.reduce((a, b) => a + b, 0) / slowestFrames.length;
            onePercentLowFps = 1000 / averageSlowestTime;
        }

        // Call the callback with a metrics object
        callback({
            avg: averageFps,
            '1pl': onePercentLowFps
        });

        // Reset for the next sample period
        this.frameCount = 0;
        this.elapsedTime = 0;
        this.deltaTimes = [];
      }
    }

    this.lastTime = currentTime;
    this.animationFrameId = requestAnimationFrame((time) => this._loop(time, callback));
  }

  /**
   * Starts the FPS tracking.
   * @param callback - The function to call with the FPS value (RecordSensor).
   */
  public start(callback: FPSCallback): void {
    if (!isBrowser || this.animationFrameId) {
      return;
    }
    
    this.lastTime = 0;
    this.frameCount = 0;
    this.elapsedTime = 0;
    this.deltaTimes = [];
    
    this.animationFrameId = requestAnimationFrame((time) => this._loop(time, callback));
  }

  public stop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}

export default FPSTracker;