import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
    esbuild: {
        target: 'chrome52',
    },

    build: {
        minify: true,
        sourcemap: true,
        rollupOptions: {
            context: 'this',
        },
        lib: {
            entry: 'src/index.ts',
            name: 'gaoding',
            formats: ['es', 'umd'],
        },
    }
});
