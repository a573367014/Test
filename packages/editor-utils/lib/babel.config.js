"use strict";

module.exports = {
  comments: false,
  presets: ['@babel/preset-typescript', ['@babel/preset-env', {
    targets: {
      node: '10'
    },
    modules: 'cjs'
  }]],
  plugins: ['lodash', 'transform-inline-environment-variables', '@babel/plugin-proposal-class-properties', '@babel/plugin-transform-runtime']
};