/**
 * @jest-environment jsdom
 *
 * Controller snapshot rate gate: at most one pose snapshot per 100 ms per controller, written
 * only when the pose moved past the position/rotation thresholds, with button changes bypassing
 * the gate.
 */
import ControllerInputTracker from '../src/utils/ControllerInputTracker';

const FRAME_MS = 16.7;

function createRig() {
    const time = { now: 0 };
    const pose = { position: { x: 0, y: 0, z: 0 }, orientation: { x: 0, y: 0, z: 0, w: 1 } };
    const trigger = { value: 0, pressed: false };
    const snapshotTimes = [];

    const c3d = {
        customEvent: { send: jest.fn() },
        dynamicObject: {
            registerControllerObject: jest.fn(() => 'c3d_controller_left'),
            addInputSnapshot: jest.fn(() => snapshotTimes.push(time.now)),
            objectIds: [],
        },
        xrSessionManager: { referenceSpace: {} },
        lastInputType: 'none',
    };

    const source = {
        handedness: 'left',
        targetRayMode: 'tracked-pointer',
        gripSpace: {},
        profiles: ['meta-quest-touch-plus'],
        gamepad: {
            mapping: 'xr-standard',
            buttons: [trigger, { value: 0, pressed: false }, { value: 0, pressed: false }, { value: 0, pressed: false }],
            axes: [0, 0, 0, 0],
        },
    };

    let callback = null;
    const session = {
        inputSources: [source],
        requestAnimationFrame: jest.fn(cb => { callback = cb; return 1; }),
        cancelAnimationFrame: jest.fn(),
    };
    const frame = { getPose: jest.fn(() => ({ transform: pose })) };

    const tracker = new ControllerInputTracker(c3d);

    const rig = {
        c3d, pose, trigger, snapshotTimes, tracker, session,
        start: () => tracker.start(session),
        frames(count) {
            for (let i = 0; i < count; i++) {
                time.now += FRAME_MS;
                callback(time.now, frame);
            }
        },
        // Runs still frames past registration and the initial button-state snapshot, then clears the mocks.
        settle(count = 10) {
            rig.frames(count);
            c3d.dynamicObject.addInputSnapshot.mockClear();
            c3d.dynamicObject.registerControllerObject.mockClear();
            snapshotTimes.length = 0;
        },
        rotateX(degrees) {
            const half = (degrees * Math.PI) / 360;
            pose.orientation = { x: Math.sin(half), y: 0, z: 0, w: Math.cos(half) };
        },
        snapshots: () => c3d.dynamicObject.addInputSnapshot.mock.calls,
    };
    return rig;
}

test('a still controller registers once and writes no pose snapshots', () => {
    const rig = createRig();
    rig.start();
    rig.frames(120);
    expect(rig.c3d.dynamicObject.registerControllerObject).toHaveBeenCalledTimes(1);
    const poseOnly = rig.snapshots().filter(call => call[3] === undefined);
    expect(poseOnly).toHaveLength(0);
});

test('a single 0.02 m move is written once, at the next gate boundary', () => {
    const rig = createRig();
    rig.start();
    rig.settle(30);
    // Gate passes land on frames 6, 12, 18, ... so a move on frame 31 waits for frame 36.
    rig.frames(1);
    rig.pose.position.x = 0.02;
    rig.frames(1);
    rig.frames(30);
    expect(rig.snapshots()).toHaveLength(1);
    expect(rig.snapshots()[0][3]).toBeUndefined();
    expect(rig.snapshots()[0][1][0]).toBeCloseTo(0.02);
    expect(rig.snapshotTimes[0]).toBeGreaterThanOrEqual(FRAME_MS * 36);
});

test('continuous movement is capped at roughly 10 snapshots per second', () => {
    const rig = createRig();
    rig.start();
    rig.settle();
    const frameCount = Math.round(1000 / FRAME_MS);
    for (let i = 0; i < frameCount; i++) {
        rig.pose.position.x += 0.02;
        rig.frames(1);
    }
    const count = rig.snapshots().length;
    expect(count).toBeGreaterThanOrEqual(9);
    expect(count).toBeLessThanOrEqual(11);
});

test('rotation-only change above 0.1 degrees is written; below is not', () => {
    const above = createRig();
    above.start();
    above.settle();
    above.rotateX(0.5);
    above.frames(20);
    expect(above.snapshots()).toHaveLength(1);

    const below = createRig();
    below.start();
    below.settle();
    below.rotateX(0.05);
    below.frames(20);
    expect(below.snapshots()).toHaveLength(0);
});

test('sub-threshold drift accumulates against the last written pose', () => {
    const rig = createRig();
    rig.start();
    rig.settle();
    rig.pose.position.x = 0.006;
    rig.frames(10);
    expect(rig.snapshots()).toHaveLength(0);
    rig.pose.position.x = 0.012;
    rig.frames(10);
    expect(rig.snapshots()).toHaveLength(1);
});

test('a button change is written immediately with its buttons, bypassing the gate', () => {
    const rig = createRig();
    rig.start();
    rig.settle(13);
    // Frame 14 is 1 frame after the gate pass on frame 12; the interval has not elapsed.
    rig.trigger.value = 1;
    rig.trigger.pressed = true;
    rig.frames(1);
    expect(rig.snapshots()).toHaveLength(1);
    expect(rig.snapshots()[0][3]).toEqual({ trigger: { buttonPercent: 100 } });
});

test('stop() then start() behaves like a fresh session', () => {
    const rig = createRig();
    rig.start();
    rig.settle();
    rig.pose.position.x = 0.02;
    rig.frames(10);
    expect(rig.snapshots()).toHaveLength(1);

    rig.tracker.stop();
    rig.pose.position.x = 0;
    rig.c3d.dynamicObject.addInputSnapshot.mockClear();
    rig.start();
    rig.frames(1);
    expect(rig.c3d.dynamicObject.registerControllerObject).toHaveBeenCalledTimes(1);

    rig.frames(10);
    rig.c3d.dynamicObject.addInputSnapshot.mockClear();
    rig.frames(20);
    expect(rig.snapshots()).toHaveLength(0);

    rig.pose.position.x = 0.02;
    rig.frames(10);
    expect(rig.snapshots()).toHaveLength(1);
});
