// All web-based engines rely on requestAnimateFrame
// requestAnimateFrame tries to synchronize the framerate to the monitors ~ 60fps 

import { isBrowser } from "./environment";

class FPSTracker {
  constructor() {
    this.frames = 0; // simple counter, +1 whenever browser draws a new frame 
    this.intervalId = null; // associated id with the 1 second timer 
    this.animationFrameId = null; // associated id with each frame 
    this._loop = this._loop.bind(this); 
  }
  _loop() {
    this.frames++;
    this.animationFrameId = requestAnimationFrame(this._loop);
  }
  start(callback) {
    if(!isBrowser || this.intervalId){ // requestAnimationFrame only available on browsers 
      return
    }
    this.frames = 0;
    this._loop();

    this.intervalId = setInterval(() => {
      callback(this.frames); // Report the number of frames rendered in the last second.
      this.frames = 0; // Reset the counter for the next second.
    }, 1000);     // 1 second interval to report 
  }
  stop() {
    if (!isBrowser) {
      return;
    }
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}

export default FPSTracker;
