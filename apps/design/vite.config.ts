import { defineConfig } from 'vite';
import { createVuePlugin } from 'vite-plugin-vue2';

// https://vitejs.dev/config/
export default defineConfig({
    esbuild: {
        target: 'chrome52',
    },

    plugins: [createVuePlugin()],
});
