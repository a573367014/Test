var plugins = ['lodash'];
module.exports = {
  presets: ['@babel/preset-typescript', ['@babel/preset-env', {
    targets: {
      browsers: ['last 2 versions']
    },
    modules: false,
    loose: true
  }]],
  plugins: [].concat(plugins, ['@babel/plugin-transform-runtime', 'transform-inline-environment-variables', // https://blog.csdn.net/youlinhuanyan/article/details/107867162
  ['@babel/proposal-decorators', {
    legacy: true
  }], ['@babel/plugin-proposal-class-properties', {
    loose: true
  }], '@babel/plugin-proposal-optional-chaining', ['module-resolver', {
    alias: {
      '@gaoding/editor-utils/lib': '@gaoding/editor-utils/lib',
      '@gaoding/editor-utils': '@gaoding/editor-utils/lib',
      '@gaoding/editor-framework/src': '@gaoding/editor-framework/lib'
    }
  }]])
};