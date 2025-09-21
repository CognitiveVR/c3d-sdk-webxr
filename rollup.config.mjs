import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import replace from '@rollup/plugin-replace';
import { builtinModules } from 'module';
import fs from 'fs';
import path from 'path';

const pkg = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf-8'));

const commonPlugins = [
  replace({
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    '__SDK_VERSION__': JSON.stringify(pkg.version),
    preventAssignment: true,
  }),
  babel({
    babelHelpers: 'bundled',
    presets: [
      ['@babel/preset-env', {
        targets: {
          node: '20', 
          browsers: pkg.browserslist,
        },
      }]
    ],
    exclude: 'node_modules/**'
  }),
  resolve({
    browser: true,
    preferBuiltins: true
  }),
  commonjs()
];

const input = {
  'index': 'src/index.js',
  'adapters/threejs-adapter': 'src/adapters/threejs-adapter.js',
  'adapters/babylon-adapter': 'src/adapters/babylon-adapter.js',
  'adapters/playcanvas-adapter': 'src/adapters/playcanvas-adapter.js',
  'adapters/wonderland-adapter': 'src/adapters/wonderland-adapter.js', 
};
const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...builtinModules,
  'playcanvas', 
  /^three(\/.*)?$/, // Match 'three' and all sub-paths
  'babylonjs'
];

export default [
  // ESM build
  {
    input,
    output: {
      dir: 'lib/esm',
      format: 'esm',
      sourcemap: true,
      entryFileNames: '[name].esm.js'
    },
    plugins: [...commonPlugins], 
    external
  },

  // CommonJS build
  {
    input,
    output: {
      dir: 'lib/cjs',
      format: 'cjs',
      sourcemap: true,
      exports: 'auto',
      entryFileNames: '[name].cjs.js'
    },
    plugins: [...commonPlugins],
    external
  },

  // UMD build for Main SDK
  {
    input: 'src/index.js',
    output: {
      name: 'C3D',
      file: 'lib/c3d.umd.js',
      format: 'umd',
      sourcemap: true,
      globals: {
        'uuid': 'uuid',
        'cross-fetch': 'fetch'
      }
    },
    plugins: [
      ...commonPlugins,
      terser()
    ]
  },
     // UMD build for PlayCanvas Adapter
  {
    input: 'src/adapters/playcanvas-adapter.js',
    output: {
      name: 'C3DPlayCanvasAdapter',
      file: 'lib/c3d-playcanvas-adapter.umd.js',
      format: 'umd',
      sourcemap: true,
      globals: {
        'playcanvas': 'pc'
      }
    },
    external: ['playcanvas'],
    plugins: [
      ...commonPlugins,
      terser()
    ]
  },
  // UMD build for Three.js Adapter
  {
    input: 'src/adapters/threejs-adapter.js',
    output: {
        name: 'C3DThreeAdapter',
        file: 'lib/c3d-threejs-adapter.umd.js',
        format: 'umd',
        sourcemap: true,
        // Make globals a function to handle sub-paths
        globals: (id) => {
          if (/^three/.test(id)) {
            return 'THREE';
          }
          return id;
        }
    },
    external: [/^three/], // Regex to externalize all 'three' imports
    plugins: [
        ...commonPlugins,
        terser()
    ]
  },
  // UMD build for Babylon.js Adapter
  {
      input: 'src/adapters/babylon-adapter.js',
      output: {
          name: 'C3DBabylonAdapter',
          file: 'lib/c3d-babylon-adapter.umd.js',
          format: 'umd',
          sourcemap: true,
          globals: {
              'babylonjs': 'BABYLON'
          }
      },
      external: ['babylonjs'],
      plugins: [
          ...commonPlugins,
          terser()
      ]
  },
  // UMD build for Wonderland Engine Adapter
  {
      input: 'src/adapters/wonderland-adapter.js',
      output: {
          name: 'C3DWonderlandAdapter',
          file: 'lib/c3d-wonderland-adapter.umd.js',
          format: 'umd',
          sourcemap: true,
          globals: {
              '@wonderlandengine/api': 'WL',
              'gl-matrix': 'glMatrix'
          }
      },
      external: ['@wonderlandengine/api', 'gl-matrix'],
      plugins: [
          ...commonPlugins,
          terser()
      ]
  }
];

