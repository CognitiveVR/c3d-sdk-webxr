/**
 * @jest-environment jsdom
 *
 * Automatic send timer: every batch otherwise flushes only by volume, so a timer drives
 * sendData() every automaticSendInterval seconds while a session is active.
 */
const scene = { sceneName: 'BasicScene', sceneId: '93f486e4-0e22-4650-946a-e64ce527f915', versionNumber: '1' };

function stubStreamNetworks(c3d, impl = jest.fn().mockResolvedValue(200)) {
    for (const stream of [c3d.customEvent, c3d.gaze, c3d.sensor, c3d.dynamicObject]) {
        stream.network.networkCall = impl;
    }
    return impl;
}

async function startSession(config = {}, { mockSend = true } = {}) {
    let C3D;
    jest.isolateModules(() => {
        C3D = require('../src/index').default;
    });
    const c3d = new C3D({ config: { APIKey: 'test-key', networkHost: 'data.c3ddev.com', allSceneData: [scene], ...config } });
    c3d.setScene(scene.sceneName);
    stubStreamNetworks(c3d);
    c3d.deviceIdPromise = null;
    await c3d.startSession(null);
    if (mockSend) { jest.spyOn(c3d, 'sendData').mockResolvedValue(200); }
    return c3d;
}

beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
});

test('default interval sends every 10 seconds', async () => {
    const c3d = await startSession();
    jest.advanceTimersByTime(9999);
    expect(c3d.sendData).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(c3d.sendData).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(20000);
    expect(c3d.sendData).toHaveBeenCalledTimes(3);
});

test('automaticSendInterval is in seconds', async () => {
    const c3d = await startSession({ automaticSendInterval: 2 });
    jest.advanceTimersByTime(1999);
    expect(c3d.sendData).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(c3d.sendData).toHaveBeenCalledTimes(1);
});

test.each([0, -5])('automaticSendInterval %p disables the timer', async (interval) => {
    const c3d = await startSession({ automaticSendInterval: interval });
    jest.advanceTimersByTime(60000);
    expect(c3d.sendData).not.toHaveBeenCalled();
});

test('skips a tick while the previous automatic send is in flight', async () => {
    const c3d = await startSession({ automaticSendInterval: 1 });
    let release;
    c3d.sendData.mockImplementation(() => new Promise((resolve) => { release = resolve; }));
    jest.advanceTimersByTime(2000);
    expect(c3d.sendData).toHaveBeenCalledTimes(1);
    release(200);
    await Promise.resolve();
    await Promise.resolve();
    jest.advanceTimersByTime(1000);
    expect(c3d.sendData).toHaveBeenCalledTimes(2);
});

test('endSession clears the timer', async () => {
    const c3d = await startSession({ automaticSendInterval: 1 });
    await c3d.endSession();
    expect(c3d.sendData).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(60000);
    expect(c3d.sendData).toHaveBeenCalledTimes(1);
});

test('a second startSession does not double the timer', async () => {
    const c3d = await startSession({ automaticSendInterval: 1 });
    c3d.core.setSessionStatus = false;
    await c3d.startSession(null);
    await jest.advanceTimersByTimeAsync(3000);
    expect(c3d.sendData).toHaveBeenCalledTimes(3);
});

test('a rejected automatic send neither throws nor stops later ticks', async () => {
    const c3d = await startSession({ automaticSendInterval: 1 });
    c3d.sendData.mockRejectedValue(new Error('offline'));
    expect(() => jest.advanceTimersByTime(1000)).not.toThrow();
    await Promise.resolve();
    await Promise.resolve();
    jest.advanceTimersByTime(1000);
    expect(c3d.sendData).toHaveBeenCalledTimes(2);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('automatic send'), expect.anything());
});

test('h1a: a stream network rejection settles the send and later ticks still send', async () => {
    const c3d = await startSession({ automaticSendInterval: 1 }, { mockSend: false });
    const networkCall = stubStreamNetworks(c3d);
    c3d.customEvent.send('evt', [0, 0, 0]);
    networkCall.mockClear();
    console.warn.mockClear();
    networkCall.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await jest.advanceTimersByTimeAsync(1000);
    expect(networkCall).toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledTimes(1);
    networkCall.mockClear();
    c3d.customEvent.send('evt2', [0, 0, 0]);
    await jest.advanceTimersByTimeAsync(1000);
    expect(networkCall).toHaveBeenCalledWith('events', expect.anything());
});

test.each([Infinity, NaN])('l3: automaticSendInterval %p disables the timer', async (interval) => {
    const c3d = await startSession({ automaticSendInterval: interval });
    jest.advanceTimersByTime(60000);
    expect(c3d.sendData).not.toHaveBeenCalled();
});

test('l4: a failed final send leaves the session active and the timer running', async () => {
    const c3d = await startSession({ automaticSendInterval: 1 }, { mockSend: false });
    const networkCall = stubStreamNetworks(c3d);
    networkCall.mockResolvedValueOnce(500);
    await expect(c3d.endSession()).rejects.toBeDefined();
    expect(c3d.core.isSessionActive).toBe(true);
    const sendData = jest.spyOn(c3d, 'sendData').mockResolvedValue(200);
    await jest.advanceTimersByTimeAsync(1000);
    expect(sendData).toHaveBeenCalledTimes(1);
});

test('l2: an idle session posts no empty events batch', async () => {
    const c3d = await startSession({ automaticSendInterval: 1 }, { mockSend: false });
    const networkCall = stubStreamNetworks(c3d);
    await jest.advanceTimersByTimeAsync(1000);
    networkCall.mockClear();
    await jest.advanceTimersByTimeAsync(30000);
    expect(networkCall.mock.calls.filter(([url]) => url === 'events')).toHaveLength(0);
});

test('l1: concurrent endSession calls where one rejects leave no timer running', async () => {
    const c3d = await startSession({ automaticSendInterval: 1 }, { mockSend: false });
    const networkCall = stubStreamNetworks(c3d);
    let status = 200;
    networkCall.mockImplementation(() => Promise.resolve(status));
    const first = c3d.endSession();
    status = 500;
    const second = c3d.endSession();
    const results = await Promise.allSettled([first, second]);
    expect(results.map((r) => r.status).sort()).toEqual(['fulfilled', 'rejected']);
    expect(c3d.core.isSessionActive).toBe(false);
    const sendData = jest.spyOn(c3d, 'sendData').mockResolvedValue(200);
    await jest.advanceTimersByTimeAsync(60000);
    expect(sendData).not.toHaveBeenCalled();
});

test('l2: a batch-size send with a rejecting network warns and leaves no unhandled rejection', async () => {
    const c3d = await startSession({ automaticSendInterval: 0, customEventBatchSize: 1 }, { mockSend: false });
    const networkCall = stubStreamNetworks(c3d);
    networkCall.mockRejectedValue(new Error('stalled'));
    const unhandled = jest.fn();
    process.on('unhandledRejection', unhandled);
    try {
        console.warn.mockClear();
        c3d.customEvent.send('evt', [0, 0, 0]);
        await jest.advanceTimersByTimeAsync(0);
        expect(networkCall).toHaveBeenCalledTimes(1);
        expect(console.warn).toHaveBeenCalledTimes(1);
        expect(console.warn).toHaveBeenCalledWith('CustomEvent.sendData failed', expect.any(Error));
        expect(unhandled).not.toHaveBeenCalled();
    } finally {
        process.off('unhandledRejection', unhandled);
    }
});
