# CLAUDE.md

Guidance for Claude Code when working in this repository. For install / end-user usage, see [README.md](README.md). For product docs, see [docs.cognitive3d.com/webxr](http://docs.cognitive3d.com/webxr/get-started/).

## Project overview

`@cognitive3d/analytics` — a WebXR analytics SDK for VR/AR/MR applications. The core is engine-agnostic; thin adapters integrate with Three.js, Babylon.js, PlayCanvas, and Wonderland Engine. The SDK records session data (gaze, dynamic objects, custom events, sensors, controller input, HMD orientation, exit polls) and batches it to the Cognitive3D backend.

## Repository layout

- [src/](src/) — TypeScript source. Engine-agnostic core.
- [src/adapters/](src/adapters/) — one file per engine (`threejs-adapter.ts`, `babylon-adapter.ts`, `playcanvas-adapter.ts`, `wonderland-adapter.ts`). Classes follow the `C3DXxxAdapter` naming pattern.
- [src/bundles/](src/bundles/) — entry points for the pre-built UMD bundles (one per engine).
- [src/utils/](src/utils/) — WebXR session management, HMD orientation, controller tracker, controller input tracker, boundary, framerate, profiler, environment detection.
- [__tests__/](__tests__/) — Jest tests, `*-test.js` suffix (JS, not TS).
- [lib/](lib/), [types/](types/) — **generated** by `npm run build`. Do not edit or commit hand-modifications here.
- [settings.js](settings.js) — test-only config. Reads `C3D_APPLICATION_KEY` from the environment.
- [rollup.config.mjs](rollup.config.mjs) — build config for all output formats.
- [jest.config.js](jest.config.js) — loads `dotenv/config` so tests pick up `.env`.

## Build and test commands

From [package.json](package.json):

- `npm run build` — full build: `build:js` (rollup) + `build:types` (`tsc -p tsconfig.dts.json`).
- `npm run build:js` — rollup only. Emits ESM into `lib/esm/`, CJS into `lib/cjs/`, UMD into `lib/`.
- `npm run dev` — rollup in watch mode.
- `npm test` — Jest. Requires `.env` with `C3D_APPLICATION_KEY` (loaded via `dotenv/config`).
- `npm run test:browser` / `npm run test:node` — split configs for environment-specific tests.

Note: `prepare` runs `build`, so `npm install` triggers a full build automatically.

Node 20+ is required (both locally and in CI).

## Output formats and exports

Each entry ships in three formats:
- **ESM** — `lib/esm/*.esm.js`
- **CJS** — `lib/cjs/*.cjs.js`
- **UMD** — `lib/c3d.umd.js` (core only) plus per-engine bundles at `lib/c3d-bundle-{threejs,babylon,playcanvas,wonderland}.umd.js`

Rollup inputs are defined in [rollup.config.mjs](rollup.config.mjs) (`input` map for ESM/CJS/adapters; `unifiedBundles` array for UMD bundles). The `exports` and `typesVersions` blocks in [package.json](package.json) must stay in sync with rollup inputs — when adding or renaming an adapter, update **both**.

## Core architectural patterns

**Singleton core.** `coreInstance` from [src/core.ts](src/core.ts) holds global analytics state. The `C3D` class in [src/index.ts](src/index.ts) composes feature modules around it and exposes `c3d.core`.

**Adapter pattern.** Engine-specific code lives *only* in [src/adapters/](src/adapters/) and [src/bundles/](src/bundles/). [src/index.ts](src/index.ts) and [src/core.ts](src/core.ts) must stay engine-agnostic — do not import `three`, `babylonjs`, `playcanvas`, or `@wonderlandengine/api` from them. Engine SDKs are declared as optional peer deps in [package.json](package.json) and marked `external` in rollup.

**Feature modules.** Gaze, custom events, dynamic objects, sensors, exit poll, FPS, HMD orientation, profiler, controller tracker, controller input, boundary — each is its own class, instantiated by the `C3D` constructor. To add a new feature: add the class under [src/](src/), instantiate it in the `C3D` constructor in [src/index.ts](src/index.ts), and add a test under [__tests__/](__tests__/).

**Batch/flush semantics.** Gaze samples, dynamic-object snapshots, custom events, and sensor readings are batched and auto-flushed. Defaults in [settings.js](settings.js): `gazeBatchSize: 256`, `dynamicDataLimit: 512`, `customEventBatchSize: 256`, `sensorDataLimit: 512`. Do not bypass the batch queues to send data directly — it breaks payload shape and flush lifecycle.

**Session lifecycle.** `setScene(sceneName)` → `startSession()` → tracking → `endSession()`. `isSessionActive` gates recording. A fresh session ID and timestamp are generated per session.

**WebXR reference-space fallback.** [src/utils/webxr.ts](src/utils/webxr.ts) requests `local-floor` and falls back to `local` if unavailable. Intentional — preserve this chain if touching XR init.

**Deterministic dynamic-object IDs.** Dynamic objects use UUIDv5 with a fixed namespace so IDs are stable across sessions (commit `89ff9f1`). Do not change the namespace — it would invalidate historical data in the Cognitive3D dashboard.

**Coordinate system for controllers.** Controller transforms are converted to LHS (commit `40b91e9`). Keep this conversion when modifying controller or hand tracking code.

## Conventions

- TypeScript strict mode ([tsconfig.json](tsconfig.json): `target: es6`, `module: esnext`).
- Classes: PascalCase. Methods and properties: camelCase. Adapters: `C3DXxxAdapter`.
- One main class per file; interfaces co-located with the class that uses them.
- 2-space indentation. Semicolons required.
- Tests live in [__tests__/](__tests__/) with a `*-test.js` suffix (JS, transpiled via babel-jest — not `.ts`).
- Do not edit [lib/](lib/) or [types/](types/) — both are regenerated by `npm run build`.
- Avoid adding `// @ts-ignore` unless working around a known circular-type edge case (there are a few already in [src/index.ts](src/index.ts)).

## External dependencies

Runtime dependencies (kept small; see [package.json](package.json)):
- `@fingerprintjs/fingerprintjs` — device ID, browser-only
- `cross-fetch` — unified fetch for Node and browser
- `jszip` — scene export
- `uuid`, `tslib`

Engine SDKs (`three`, `babylonjs`, `playcanvas`, `@wonderlandengine/api`, `gl-matrix`) are **optional peer deps**. Never move them into `dependencies`.

Backend API host is configured in [settings.js](settings.js): `data.cognitive3d.com` (prod) or `data.c3ddev.com` (dev).

## CI and publishing

- [.github/workflows/npm-publish.yml](.github/workflows/npm-publish.yml) runs on pushes to `main` and `development`.
- `main` → public NPM release at the current `version` in [package.json](package.json).
- `development` → `dev` tag with a commit-SHA suffix (e.g., `2.7.0-dev.a1b2c3d`).
- NPM auth via OIDC. Tests must pass and require `C3D_APPLICATION_KEY` as a repo secret.

## Common pitfalls

Do not:
- Import engine SDKs (`three`, `babylonjs`, `playcanvas`, `@wonderlandengine/api`) from [src/index.ts](src/index.ts) or [src/core.ts](src/core.ts). They belong only in adapters and bundles.
- Edit [lib/](lib/) or [types/](types/) by hand — both are generated.
- Add a new entry point without updating both [rollup.config.mjs](rollup.config.mjs) and the `exports` + `typesVersions` blocks in [package.json](package.json).
- Change the UUIDv5 namespace used for dynamic objects — it would invalidate historical data.
- Bypass the batch queues to send gaze / event / sensor / dynamic data directly.
- Move engine SDKs from `peerDependencies` into `dependencies`.

Do:
- Run `npm run build` before publishing (the `prepare` script handles this on install automatically).
- Place new tests under [__tests__/](__tests__/) with a `-test.js` suffix, and make sure `.env` contains `C3D_APPLICATION_KEY`.
- When adding an adapter: create the file in [src/adapters/](src/adapters/), create the matching bundle entry in [src/bundles/](src/bundles/), update [rollup.config.mjs](rollup.config.mjs) (`input` + `unifiedBundles`), and update [package.json](package.json) (`exports` + `typesVersions`).
