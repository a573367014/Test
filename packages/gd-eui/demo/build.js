const path = require('path');

module.exports = {
    pages: {
        index: {
            entry: path.resolve(__dirname, './main.js'),
            template: path.resolve(__dirname, './index.html'),
        },
    },
    css: {
        loaderOptions: {
            less: {
                javascriptEnabled: true,
            },
        },
    },
    devServer: {
        port: 8086,
    },

    configureWebpack: {
        module: {
            rules: [{ test: /\.html$/, loader: 'html-loader' }],
        },
    },

    runtimeCompiler: true,
};
