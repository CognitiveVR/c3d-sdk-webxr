/**
 * @jest-environment jsdom
 */
const scene = { sceneName: 'BasicScene', sceneId: '93f486e4-0e22-4650-946a-e64ce527f915', versionNumber: '1' };

function createNetwork(fetchMock) {
    let Network;
    let core;
    jest.isolateModules(() => {
        jest.doMock('../src/utils/environment', () => ({
            ...jest.requireActual('../src/utils/environment'),
            fetch: (...args) => fetchMock(...args)
        }));
        Network = require('../src/network').default;
        core = require('../src/core').default;
    });
    core.config.networkHost = 'data.c3ddev.com';
    core.config.APIKey = 'test-key';
    core.sceneData = scene;
    return new Network(core);
}

beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
});

test('h1b: networkCall rejects after NETWORK_TIMEOUT_MS when fetch never settles', async () => {
    const network = createNetwork(jest.fn((url, options) => new Promise((resolve, reject) => {
        options.signal.addEventListener('abort', () => {
            const err = new Error('The operation was aborted');
            err.name = 'AbortError';
            reject(err);
        });
    })));

    let outcome = 'pending';
    network.networkCall('events', {}).then(() => { outcome = 'resolved'; }, (err) => { outcome = err; });

    await jest.advanceTimersByTimeAsync(29999);
    expect(outcome).toBe('pending');
    await jest.advanceTimersByTimeAsync(1);
    expect(outcome).toBeInstanceOf(Error);
    expect(outcome.message).toMatch(/timed out after 30000 ms/);
});

describe('m1: runtime without AbortController', () => {
    const originalAbortController = global.AbortController;
    let fetchMock;
    let network;

    beforeEach(() => {
        delete global.AbortController;
        fetchMock = jest.fn().mockResolvedValue({ status: 200 });
        network = createNetwork(fetchMock);
    });

    afterEach(() => {
        global.AbortController = originalAbortController;
    });

    test('networkCall sends without a signal and resolves', async () => {
        await expect(network.networkCall('events', {})).resolves.toBe(200);
        expect(fetchMock.mock.calls[0][1].signal).toBeUndefined();
    });

    test('the offline branch still resolves with its message', async () => {
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(network, 'isOnline').mockReturnValue(false);
        await expect(network.networkCall('events', {})).resolves.toMatch(/check internet connection/);
        expect(fetchMock).not.toHaveBeenCalled();
    });
});

describe('keepalive', () => {
    const keepaliveFlags = (fetchMock) => fetchMock.mock.calls.map(([, options]) => options.keepalive);

    test('settled requests release their keepalive budget', async () => {
        const fetchMock = jest.fn().mockResolvedValue({ status: 200 });
        const network = createNetwork(fetchMock);
        await network.networkCall('events', {});
        await network.networkCall('events', {});
        expect(keepaliveFlags(fetchMock)).toEqual([true, true]);
    });

    test('a request past the in-flight keepalive budget is sent without keepalive', async () => {
        const pending = [];
        const fetchMock = jest.fn(() => new Promise((resolve) => pending.push(resolve)));
        const network = createNetwork(fetchMock);
        const content = { data: 'x'.repeat(40_000) };
        const sends = [network.networkCall('events', content), network.networkCall('events', content)];
        pending.forEach((resolve) => resolve({ status: 200 }));
        await Promise.all(sends);
        network.networkCall('events', content);
        expect(keepaliveFlags(fetchMock)).toEqual([true, undefined, true]);
    });
});
