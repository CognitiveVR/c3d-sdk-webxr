import { isBrowser } from "./environment";

class FPSTracker {
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
   * @param {number} currentTime - Timestamp provided by requestAnimationFrame.
   * @param {function(number): void} callback - The function to call with the FPS value.
   */
  _loop(currentTime, callback) { 
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
   * @param {function(number): void} callback - The function to call with the FPS value (RecordSensor).
   */
  start(callback) {
    if (!isBrowser || this.animationFrameId) {
      return;
    }
    
    this.lastTime = 0;
    this.frameCount = 0;
    this.elapsedTime = 0;
    this.deltaTimes = [];
    
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
