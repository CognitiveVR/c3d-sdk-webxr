import { isBrowser } from './environment';

// Periodically records performance metrics like draw calls and memory usage.
class Profiler {
    constructor(c3dInstance) {
        this.c3d = c3dInstance;
        this.intervalId = null;
        this.renderer = null;
    }

    start(renderer) {
        if (!isBrowser || this.intervalId) {
            return;
        }

        this.renderer = renderer;

        this.intervalId = setInterval(() => {
            this.recordMetrics();
        }, 1000);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
    // Record draw calls
    _recordDrawCalls() {
        // Use optional chaining (?.) to safely access nested properties
        if (this.renderer?.info?.render) {
            this.renderer.info.reset();
            const drawCalls = this.renderer.info.render.calls;
            this.c3d.sensor.recordSensor('c3d.profiler.drawCallsCount', drawCalls);
        }
    }

    // Record memory usage
    async _recordMemory() {
        try {
            if (performance.measureUserAgentSpecificMemory) {
                const memorySample = await performance.measureUserAgentSpecificMemory();
                const memoryInMB = memorySample.bytes / (1024 * 1024);
                this.c3d.sensor.recordSensor('c3d.profiler.systemMemoryInMB', memoryInMB);
            } else if (performance.memory) {
                const memoryInMB = performance.memory.usedJSHeapSize / (1024 * 1024);
                this.c3d.sensor.recordSensor('c3d.profiler.systemMemoryInMB', memoryInMB);
            }
        } catch (error) {
            // Fallback for when measureUserAgentSpecificMemory fails
            if (performance.memory) {
                const memoryInMB = performance.memory.usedJSHeapSize / (1024 * 1024);
                this.c3d.sensor.recordSensor('c3d.profiler.systemMemoryInMB', memoryInMB);
            }
            console.warn("Could not measure memory: ", error);
        }
    }

    // Record main thread time
    _recordMainThreadTime() {
        if (this.c3d.fpsTracker?.lastDeltaTime) {
            this.c3d.sensor.recordSensor('c3d.profiler.mainThreadTimeInMs', this.c3d.fpsTracker.lastDeltaTime);
        }
    }

    recordMetrics() {
        this._recordDrawCalls();
        this._recordMemory();
        this._recordMainThreadTime();
    }
}

export default Profiler;