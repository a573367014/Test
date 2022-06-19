import proxy from 'koa-proxies'

const localEnv = {
  ENV_NAME: 'dev',
  API_TARGET: 'http://my-dev.gaoding.com',
}
const proxyApis = {
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
    target: localEnv.API_TARGET,
    secure: false,
  },
  '/apollo': {
    changeOrigin: true,
    headers: {
      Connection: 'keep-alive',
    },
    target: localEnv.API_TARGET,
    secure: false,
  },
  '/login': {
    changeOrigin: true,
    headers: {
      Connection: 'keep-alive',
    },
    target: localEnv.API_TARGET,
    secure: false,
  },
  '/front': {
    changeOrigin: true,
    headers: {
      Connection: 'keep-alive',
    },
    logLevel: 'debug',
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
}

export default {
  port: 9999,
  middleware: [
    ...Object.keys(proxyApis).map((key) => proxy(key, proxyApis[key])),
  ],
}
