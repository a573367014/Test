import path from 'path';
import pkg from '@gaoding/editor-framework/package.json';
import { createVuePlugin } from 'vite-plugin-vue2';
import { createFilter, dataToEsm } from '@rollup/pluginutils';

function createStaticHTMLPlugin() {
    const filter = createFilter(['**/*.html']);
    return {
        name: 'vite-plugin-static-html',
        transform(source, id) {
            if (!filter(id)) return;
            return dataToEsm(source);
        },
    };
}

export default {
    resolve: {
        alias: {
            vue: path.resolve(__dirname, 'node_modules/vue/dist/vue.esm.browser.js'),
        },
    },
    define: {
        'process.env.__VERSION__': JSON.stringify(pkg.version),
        'process.env.__DEV__': JSON.stringify(true),
    },
    plugins: [
        createVuePlugin(),
        createStaticHTMLPlugin(),
    ],
    cacheDir: './.vite',
    css: {
        postcss: {
            plugins: [
                // background: url(svg-load(xxx))
                require('postcss-inline-svg')({ removeFill: false }),
            ],
        },
    },
};
