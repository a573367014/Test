import vue from '@vitejs/plugin-vue'
// import createStyleImport from 'vite-plugin-style-import'
import shadowDomCssPlugin from 'vite-plugin-shadow-dom-css'
import path from 'path'
import { defineConfig } from 'vite'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'

export default defineConfig({
  worker: {
    format: 'es',
  },
  plugins: [
    vue(),
    // createStyleImport({
    //   libs: [
    //     {
    //       libraryName: '@gaoding/gd-antd',
    //       esModule: true,
    //       resolveStyle: (name) => {
    //         return `@gaoding/gd-antd/es/${name}/style/index`
    //       },
    //     },
    //   ],
    // }),
    shadowDomCssPlugin({
      include: [/\.(css|less|sass|scss|styl|stylus|pcss|postcss)($|\?)/],
    }),
    cssInjectedByJsPlugin(),
  ],
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
        modifyVars: {
          hack: `true; @import "@/styles/index.less";`,
        },
      },
    },
  },
  resolve: {
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
    alias: [
      {
        find: /^~@/,
        replacement: path.resolve(__dirname, 'src'),
      },
      {
        find: '@',
        replacement: path.resolve(__dirname, 'src'),
      },
    ],
  },
  build: {
    rollupOptions: {
      external: ['vue'],
      output: {
        manualChunks: undefined,
      },
    },
    lib: {
      entry: 'src/index.js',
      formats: ['es'],
      fileName: 'index',
    },
  },
  server: {
    proxy: {
      '/api/dm/mock': {
        target: 'https://yapi.gaoding.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/dm/, ''),
      },
      '/api/cms': {
        changeOrigin: true,
        headers: {
          Connection: 'keep-alive',
        },
        target: 'https://api-cms.gaoding.com',
        rewrite: (path) => path.replace(/^\/api\/cms/, '/api'),
        secure: false,
      },
      '/api': {
        changeOrigin: true,
        headers: {
          Connection: 'keep-alive',
        },
        target: 'http://my-dev.gaoding.com',
        secure: false,
      },
      '/apollo': {
        changeOrigin: true,
        headers: {
          Connection: 'keep-alive',
        },
        target: 'http://my-dev.gaoding.com',
        secure: false,
      },
      '/login': {
        changeOrigin: true,
        headers: {
          Connection: 'keep-alive',
        },
        target: 'http://my-dev.gaoding.com',
        secure: false,
      },
      '/front': {
        changeOrigin: true,
        headers: {
          Connection: 'keep-alive',
        },
        target: 'http://api-filems-dev.gaoding.com',
        secure: false,
      },
      '/odyssey': {
        changeOrigin: true,
        headers: {
          Connection: 'keep-alive',
        },
        target: 'https://my-fat.gaoding.com',
        secure: false,
      },
    },
  },
})
