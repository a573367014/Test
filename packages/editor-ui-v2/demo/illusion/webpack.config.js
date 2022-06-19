// Mock version for vue-poster-editor
const pkg = require('../../vue-poster-editor/package.json');
const { resolve } = require('path');
const config = require('../webpack.config');

process.env.__VERSION__ = pkg.version;
process.env.__DEV__ = 'true';

config.entry = {
    'demo': './demo-illusion/index'
};
delete config.output;
delete config.externals;
config.module.rules[0].include = [resolve('../src')];
config.module.rules.push({ test: /\.html$/, loader: 'html-loader' });
config.resolve.alias = {
    vue: 'vue/dist/vue.js'
};

module.exports = config;
