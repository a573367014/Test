const path = require('path');
const { version } = require('../package.json');
const { createVuePlugin } = require('vite-plugin-vue2');
const { createFilter, dataToEsm } = require('@rollup/pluginutils');

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

module.exports = {
    resolve: {
        alias: {
            vue: 'vue/dist/vue',
            '/pica$/': path.resolve(__dirname, '../third-party/pica'),
            '@gaoding/editor-utils/export/gif-apng.worker':
                '@gaoding/editor-utils/export/gif-apng.worker?worker',
            'vue-demi': 'vue-demi/lib/v2/index.mjs',
        },
    },
    define: {
        'process.env.__VERSION__': JSON.stringify(version),
        'process.env.__DEV__': JSON.stringify(true),
    },
    ssr: {
        external: ['webpack/lib/web/FetchCompileWasmPlugin'],
    },
    plugins: [createVuePlugin(), createStaticHTMLPlugin()],
    cacheDir: './.vite',
};
