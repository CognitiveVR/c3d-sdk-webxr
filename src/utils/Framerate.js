import { isBrowser } from "./environment";

class FPSTracker {
  constructor() {
    this.animationFrameId = null;
    this.lastTime = 0;
    this.frameCount = 0;
    this.elapsedTime = 0;
    this.samplePeriod = 1000; // 1 second
    this._loop = this._loop.bind(this);
  }

  /**
   * _loop runs on every animation frame, calculates the delta time since the last frame and reports the FPS
   * once the sample period has been reached.
   * @param {number} currentTime - Timestamp provided by requestAnimationFrame.
   * @param {function(number): void} callback - The function to call with the FPS value.
   */
  _loop(currentTime, callback) { 
    if (this.lastTime > 0) {
      const deltaTime = currentTime - this.lastTime;
      this.elapsedTime += deltaTime;
      this.frameCount++;

      if (this.elapsedTime >= this.samplePeriod) {  // Check if the sample period (1 sec) has been reached
        const averageFps = (this.frameCount / this.elapsedTime) * 1000; // Calculate the average FPS over the sample period
        callback(averageFps);

        // Reset for the next sample period
        this.frameCount = 0;
        this.elapsedTime = 0;
      }
    }

    this.lastTime = currentTime;
    this.animationFrameId = requestAnimationFrame((time) => this._loop(time, callback));
  }

  /**
   * Starts the FPS tracking.
   * @param {function(number): void} callback - The function to call with the FPS value (RecordSensor).
   */
  start(callback) {
    if (!isBrowser || this.animationFrameId) {
      return;
    }
    
    this.lastTime = 0;
    this.frameCount = 0;
    this.elapsedTime = 0;
    
    this.animationFrameId = requestAnimationFrame((time) => this._loop(time, callback));
  }

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}

export default FPSTracker;
