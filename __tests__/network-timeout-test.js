/**
 * @jest-environment jsdom
 */
const scene = { sceneName: 'BasicScene', sceneId: '93f486e4-0e22-4650-946a-e64ce527f915', versionNumber: '1' };

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
    let fetchMock;
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
    fetchMock = jest.fn((url, options) => new Promise((resolve, reject) => {
        options.signal.addEventListener('abort', () => {
            const err = new Error('The operation was aborted');
            err.name = 'AbortError';
            reject(err);
        });
    }));
    core.config.networkHost = 'data.c3ddev.com';
    core.config.APIKey = 'test-key';
    core.sceneData = scene;
    const network = new Network(core);

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
        fetchMock = jest.fn().mockResolvedValue({ status: 200 });
        core.config.networkHost = 'data.c3ddev.com';
        core.config.APIKey = 'test-key';
        core.sceneData = scene;
        network = new Network(core);
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
