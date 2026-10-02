/**
 * @jest-environment jsdom
 *
 * Automatic send timer: every batch otherwise flushes only by volume, so a timer drives
 * sendData() every automaticSendInterval seconds while a session is active.
 */
const scene = { sceneName: 'BasicScene', sceneId: '93f486e4-0e22-4650-946a-e64ce527f915', versionNumber: '1' };

async function startSession(config = {}) {
    let C3D;
    jest.isolateModules(() => {
        C3D = require('../src/index').default;
    });
    const c3d = new C3D({ config: { APIKey: 'test-key', networkHost: 'data.c3ddev.com', allSceneData: [scene], ...config } });
    c3d.setScene(scene.sceneName);
    c3d.network.networkCall = jest.fn().mockResolvedValue(200);
    c3d.deviceIdPromise = null;
    await c3d.startSession(null);
    jest.spyOn(c3d, 'sendData').mockResolvedValue(200);
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
