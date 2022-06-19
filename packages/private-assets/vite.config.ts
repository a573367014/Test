import { defineConfig } from 'vite';
import { createVuePlugin } from 'vite-plugin-vue2';

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
            entry: 'src/index.ts',
            name: 'gaoding',
            formats: ['es', 'umd'],
        },
        rollupOptions: {
            // make sure to externalize deps that shouldn't be bundled
            // into your library

            external: [].concat(Object.keys(pkg.dependencies), Object.keys(pkg.peerDependencies)),
        },
    },

    plugins: [createVuePlugin()],
});
