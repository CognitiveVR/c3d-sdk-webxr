export default Profiler;
declare class Profiler {
    constructor(c3dInstance: any);
    c3d: any;
    intervalId: NodeJS.Timeout | null;
    renderer: any;
    start(renderer: any): void;
    stop(): void;
    _recordDrawCalls(): void;
    _recordMemory(): Promise<void>;
    _recordMainThreadTime(): void;
    recordMetrics(): void;
}
