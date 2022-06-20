import path from 'path';
import { defineConfig } from 'vite';
import { createVuePlugin } from 'vite-plugin-vue2';
import babel from '@rollup/plugin-babel';

// @ts-ignore
import pkg from './package.json';

// https://vitejs.dev/config/
export default defineConfig({
    esbuild: {
        target: 'chrome52',
    },

    build: {
        minify: true,
        sourcemap: false,
        lib: {
            entry: 'src/index.js',
            name: 'gaoding',
            formats: ['es', 'cjs'],
        },
        rollupOptions: {
            // make sure to externalize deps that shouldn't be bundled
            // into your library
            external: [].concat(Object.keys(pkg.dependencies || []).map(item => {
                return new RegExp('^' + item + '/?')
            })),
        },
    },

    plugins: [createVuePlugin(), babel({
        extensions: ['.vue', '.js', '.ts'],
        plugins: [
            ["@babel/plugin-proposal-decorators", { "legacy": true }],
            ["@babel/plugin-proposal-class-properties", { "loose": true }]
        ]
    })],
});
