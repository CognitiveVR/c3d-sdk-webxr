import { isBrowser } from './environment';

// Extend Performance interface for non-standard/experimental memory APIs
interface PerformanceMemory {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
}

interface ExtendedPerformance extends Performance {
    memory?: PerformanceMemory;
    measureUserAgentSpecificMemory?: () => Promise<{ bytes: number }>;
}

// Interface for the C3D instance dependencies
interface C3DInstance {
    sensor: {
        recordSensor: (_name: string, value: any) => void;
    };
    fpsTracker?: {
        lastDeltaTime: number;
    };
}

// Interface for a generic Renderer (like THREE.WebGLRenderer)
interface Renderer {
    info?: {
        render?: {
            calls: number;
        };
        reset?: () => void;
    };
}

// Periodically records performance metrics like draw calls and memory usage.
class Profiler {
    private c3d: C3DInstance;
    private intervalId: ReturnType<typeof setInterval> | null;
    private renderer: Renderer | null;

    constructor(c3dInstance: C3DInstance) {
        this.c3d = c3dInstance;
        this.intervalId = null;
        this.renderer = null;
    }

    start(renderer: Renderer): void {
        if (!isBrowser || this.intervalId) {
            return;
        }

        this.renderer = renderer;

        this.intervalId = setInterval(() => {
            this.recordMetrics();
        }, 1000);
    }

    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
    
    // Record draw calls
    private _recordDrawCalls(): void {
        if (this.renderer?.info?.render) {
            const drawCalls = this.renderer.info.render.calls;
            this.c3d.sensor.recordSensor('c3d.profiler.drawCallsCount', drawCalls);
            if (this.renderer.info.reset) {
                this.renderer.info.reset();
            }
        }
    }

    // Record memory usage
    private async _recordMemory(): Promise<void> {
        const perf = performance as ExtendedPerformance;
        try {
            if (perf.measureUserAgentSpecificMemory) {
                const memorySample = await perf.measureUserAgentSpecificMemory();
                const memoryInMB = memorySample.bytes / (1024 * 1024);
                this.c3d.sensor.recordSensor('c3d.profiler.systemMemoryInMB', memoryInMB);
            } else if (perf.memory) {
                const memoryInMB = perf.memory.usedJSHeapSize / (1024 * 1024);
                this.c3d.sensor.recordSensor('c3d.profiler.systemMemoryInMB', memoryInMB);
            }
        } catch (error) {
            // Fallback for when measureUserAgentSpecificMemory fails
            if (perf.memory) {
                const memoryInMB = perf.memory.usedJSHeapSize / (1024 * 1024);
                this.c3d.sensor.recordSensor('c3d.profiler.systemMemoryInMB', memoryInMB);
            }
            console.warn("Could not measure memory: ", error);
        }
    }

    // Record main thread time
    private _recordMainThreadTime(): void {
        if (this.c3d.fpsTracker?.lastDeltaTime) {
            this.c3d.sensor.recordSensor('c3d.profiler.mainThreadTimeInMs', this.c3d.fpsTracker.lastDeltaTime);
        }
    }

    public recordMetrics(): void {
        this._recordDrawCalls();
        this._recordMemory();
        this._recordMainThreadTime();
    }
}

export default Profiler;