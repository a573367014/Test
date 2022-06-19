const path = require('path');
// const { resolve } = require('path');

function addStyleResource(rule) {
    rule.use('style-resource')
        .loader('style-resources-loader')
        .options({
            patterns: [
                path.resolve(
                    __dirname,
                    '../../../../node_modules/@gaoding/gd-antd/lib/style/themes/index.less',
                ),
            ],
        });
}

const config = {
    css: {
        loaderOptions: {
            less: {
                javascriptEnabled: true,
            },
        },
    },
    chainWebpack(webpackConfig) {
        const types = ['vue-modules', 'vue', 'normal-modules', 'normal'];
        types.forEach((type) => addStyleResource(webpackConfig.module.rule('less').oneOf(type)));
    },
};

if (process.env.project) {
    Object.assign(config, require(path.resolve('./demo/build.js')));
}
module.exports = config;
