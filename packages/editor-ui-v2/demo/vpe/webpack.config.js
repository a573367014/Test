// Mock version for vue-poster-editor
const { resolve } = require('path');
const config = require('../../webpack.config');

process.env.__DEV__ = 'true';

config.entry = {
    'demo': ['./demo/vpe/index']
};
config.output;
delete config.externals;
config.module.rules[0].include = [resolve('../../src')];
config.module.rules.push({ test: /\.html$/, loader: 'html-loader' });
config.resolve.alias = Object.assign(config.resolve.alias || {}, {
    vue: 'vue/dist/vue.js'
});

config.devServer = {
    contentBase: resolve('./demo/vpe/'),
    disableHostCheck: true,
    headers: {
        'Access-Control-Allow-Origin': '*',
    }
};

module.exports = config;
