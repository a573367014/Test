import pkg from '../package.json';
import { createVuePlugin } from 'vite-plugin-vue2';
import { createFilter, dataToEsm  } from '@rollup/pluginutils';

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
            vue: 'vue/dist/vue',
        },
    },
    define: {
        'process.env.__VERSION__': JSON.stringify(pkg.version),
        'process.env.__DEV__': JSON.stringify(true),
    },
    ssr: {
        external: ['webpack/lib/web/FetchCompileWasmPlugin'],
    },
    plugins: [createVuePlugin(), createStaticHTMLPlugin()],
    cacheDir: './.vite',
};
