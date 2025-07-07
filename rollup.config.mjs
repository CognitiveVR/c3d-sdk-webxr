import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import replace from '@rollup/plugin-replace';
import { builtinModules } from 'module';
import fs from 'fs';
import path from 'path';

const pkg = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf-8'));

const input = 'src/index.js';

// Include all Node built-ins as external to avoid bundling them
const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...builtinModules
];

// Shared plugins
const plugins = [
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
          node: '14',
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

export default [
  // ESM build (for modern bundlers like webpack, rollup, etc.)
  {
    input,
    output: {
      file: pkg.module,
      format: 'esm',
      sourcemap: true
    },
    external,
    plugins
  },

  // CommonJS build (for Node.js)
  {
    input,
    output: {
      file: pkg.main,
      format: 'cjs',
      sourcemap: true,
      exports: 'auto'
    },
    external,
    plugins
  },

  // UMD build (for browsers)
  {
    input,
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
      ...plugins,
      terser()
    ]
  }
];