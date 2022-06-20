import webWorkerLoader from 'rollup-plugin-web-worker-loader';
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import json from 'rollup-plugin-json';
import replace from 'rollup-plugin-replace';
// import { terser } from 'rollup-plugin-terser';
import babel from 'rollup-plugin-babel';
import pkg from './package.json';
import obfuscatorPlugin from 'rollup-plugin-javascript-obfuscator';

export default {
    input: 'src/index.js',
    plugins: [
        json(),
        resolve(),
        webWorkerLoader(),
        commonjs({
            namedExports: {
                lru_map: ['LRUMap'],
            },
        }),
        replace({
            __PACKAGE_NAME__: pkg.name.split('/')[1],
            __VERSION__: pkg.version,
        }),
        // worker can't use modules in node_modules folder.
        babel({
            runtimeHelpers: true,
            exclude: [
                'node_modules/@babel/runtime/helpers/typeof.js',
                '../../node_modules/@babel/runtime/helpers/typeof.js',
            ],
        }),
        // terser(),
        obfuscatorPlugin({
            compact: true,
        }),
    ],
    external: ['bluebird', 'lru_map', 'lodash', 'opentype.js'],
    output: [
        {
            file: 'dist/three-font-parser.umd.js',
            format: 'umd',
            name: 'fontParser',
            sourceMap: true,
        },
        {
            file: 'dist/three-font-parser.esm.js',
            format: 'es',
            sourceMap: true,
        },
    ],
};
