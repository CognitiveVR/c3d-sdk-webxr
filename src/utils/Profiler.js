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

        // We need the renderer to access engine-specific stats like draw calls
        this.renderer = renderer;

        this.intervalId = setInterval(() => {
            this.recordMetrics();
        }, 1000); // Record once per second
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    async recordMetrics() {
        // Draw Calls
        if (this.renderer && this.renderer.info && this.renderer.info.render) {
            const drawCalls = this.renderer.info.render.calls;
            this.c3d.sensor.recordSensor('c3d.profiler.drawCallsCount', drawCalls);
        }
        // Memory usage (measuring the javascript heap, does not contain vram usage) 
        try {
            // Try the new, standardized API first.
            if (performance.measureUserAgentSpecificMemory) {
                const memorySample = await performance.measureUserAgentSpecificMemory();
                const memoryInMB = memorySample.bytes / (1024 * 1024);
                this.c3d.sensor.recordSensor('c3d.profiler.systemMemoryInMB', memoryInMB);
            } 
            // Fallback to the old, deprecated API if the new one isn't available.
            else if (performance.memory) {
                const memoryInMB = performance.memory.usedJSHeapSize / (1024 * 1024);
                this.c3d.sensor.recordSensor('c3d.profiler.systemMemoryInMB', memoryInMB);
            }
        } catch (error) {
            // The new API throws an error if the page is not cross-origin isolated.
            if (performance.memory) { // performance.memory is depreciated but should be available on chromium browsers 
                const memoryInMB = performance.memory.usedJSHeapSize / (1024 * 1024);
                this.c3d.sensor.recordSensor('c3d.profiler.systemMemoryInMB', memoryInMB);
            }
            console.warn("Could not measure memory: ", error);
        }

        // Main Thread Time, can be retrieved from FPSTracker's last calculated delta time.
        // It's the time in milliseconds between the last two frames.
        if (this.c3d.fpsTracker && this.c3d.fpsTracker.lastDeltaTime) {
            this.c3d.sensor.recordSensor('c3d.profiler.mainThreadTimeInMs', this.c3d.fpsTracker.lastDeltaTime);
        }
    }
}

export default Profiler;