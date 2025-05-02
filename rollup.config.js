import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import pkg from './package.json';

const input = 'src/index.js';
const external = Object.keys(pkg.dependencies || {});

// Shared plugins
const plugins = [
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