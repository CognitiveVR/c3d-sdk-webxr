import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';
import { builtinModules } from 'module';
import fs from 'fs';
import path from 'path';

const pkg = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf-8'));

const commonPlugins = [
  typescript({
    noForceEmit: true,  
    tsconfig: './tsconfig.json'
  }),
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
      }],
      '@babel/preset-typescript',
    ],
    exclude: 'node_modules/**',
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  }),
  resolve({
    browser: true,
    preferBuiltins: true,
    extensions: ['.mjs', '.js', '.json', '.node', '.ts'] 
  }),
  commonjs()
];

const input = {
  'index': 'src/index.ts',
  'adapters/threejs-adapter': 'src/adapters/threejs-adapter.ts',      
  'adapters/babylon-adapter': 'src/adapters/babylon-adapter.ts',      
  'adapters/playcanvas-adapter': 'src/adapters/playcanvas-adapter.ts',
  'adapters/wonderland-adapter': 'src/adapters/wonderland-adapter.ts',
};

const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...builtinModules,
  'playcanvas', 
  /^three(\/.*)?$/,
  'babylonjs',
  'babylonjs-serializers',
  '@wonderlandengine/api',
  'gl-matrix'
];

// Define the unified bundles to generate
const unifiedBundles = [
  {
    engine: 'threejs',
    input: 'src/bundles/threejs.ts',
    external: [/^three/],
    // Handle Three.js wildcard imports for globals
    globals: (id) => {
      if (/^three/.test(id)) return 'THREE';
      if (id === 'uuid') return 'uuid';
      if (id === 'cross-fetch') return 'fetch';
      return id;
    }
  },
  {
    engine: 'babylon',
    input: 'src/bundles/babylon.ts',
    external: ['babylonjs', 'babylonjs-serializers'],
    globals: { 'babylonjs': 'BABYLON', 'babylonjs-serializers': 'BABYLON', 'uuid': 'uuid', 'cross-fetch': 'fetch' }
  },
  {
    engine: 'playcanvas',
    input: 'src/bundles/playcanvas.ts',
    external: ['playcanvas'],
    globals: { 'playcanvas': 'pc', 'uuid': 'uuid', 'cross-fetch': 'fetch' }
  },
  {
    engine: 'wonderland',
    input: 'src/bundles/wonderland.ts',
    external: ['@wonderlandengine/api', 'gl-matrix'],
    globals: { '@wonderlandengine/api': 'WL', 'gl-matrix': 'glMatrix', 'uuid': 'uuid', 'cross-fetch': 'fetch' }
  }
].map(bundle => ({
  input: bundle.input,
  output: {
    name: 'C3D',
    file: `lib/c3d-bundle-${bundle.engine}.umd.js`,
    format: 'umd',
    sourcemap: true,
    globals: bundle.globals
  },
  external: bundle.external,
  plugins: [
    ...commonPlugins,
    terser()
  ]
}));

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

  // UMD build for Main SDK (Kept for Core-only users)
  {
    input: 'src/index.ts',
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

  // Inject the newly generated Unified UMD bundles
  ...unifiedBundles
];