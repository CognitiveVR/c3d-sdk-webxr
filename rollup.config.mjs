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
};
const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...builtinModules
];

export default [
  // ESM build
  {
    input,
    output: {
      dir: 'lib/esm',
      format: 'esm',
      sourcemap: true,
      entryFileNames: '[name].js'
    },
    plugins: [...commonPlugins]
  },

  // CommonJS build
  {
    input,
    output: {
      dir: 'lib/cjs',
      format: 'cjs',
      sourcemap: true,
      exports: 'auto',
      entryFileNames: '[name].js'
    },
    plugins: [...commonPlugins]
  },

  // UMD build (main SDK only)
  {
    input: 'src/index.js',
    output: {
      name: 'cognitive3d',
      file: 'lib/index.umd.js',
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
  }
];