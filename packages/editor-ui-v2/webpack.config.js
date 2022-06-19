const VueLoaderPlugin = require('vue-loader/lib/plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const { resolve } = require('path');

const plugins = [new VueLoaderPlugin()];
if (process.env.ANALYSE_BUNDLE) {
    plugins.push(new BundleAnalyzerPlugin());
}

module.exports = {
    devtool: process.env.NODE_ENV !== 'production' ? 'cheap-module-eval-source-map' : false,
    entry: {
        'editor-ui': './src/index',
        eui: './src/eui',
    },
    resolve: {
        extensions: ['.js', '.ts', '.vue'],
        alias: {
            '@': resolve(__dirname, './'),
        },
    },
    module: {
        rules: [
            {
                test: /\.(js|vue)$/,
                loader: 'eslint-loader',
                enforce: 'pre',
                include: [resolve('./src')],
                options: {
                    fix: true,
                },
            },
            { test: /\.vue$/, loader: 'vue-loader' },
            {
                test: /\.less$/,
                use: [
                    { loader: 'vue-style-loader' },
                    { loader: 'style-loader' },
                    { loader: 'css-loader' },
                    {
                        loader: 'postcss-loader',
                        options: {
                            plugins: () => [
                                require('postcss-inline-svg')({
                                    removeFill: false,
                                    encode: function (code) {
                                        return encodeURIComponent(code);
                                    },
                                }),
                                require('postcss-cssnext')(),
                            ],
                        },
                    },
                    { loader: 'less-loader' },
                    {
                        loader: 'sass-resources-loader',
                        options: {
                            resources: resolve(__dirname, './src/styles/variables.less'),
                        },
                    },
                ],
            },
            {
                test: /\.css$/,
                use: [{ loader: 'vue-style-loader' }, { loader: 'css-loader' }],
            },
            {
                loader: 'url-loader',
                test: /\.(png|jpg|gif|svg)$/,
                query: { limit: 4 * 1024, name: '[name].[ext]?[hash:6]' },
            },
            {
                test: /\.(js|ts)$/,
                include:
                    /src|vue-color|@gaoding\/beam-plugins|@gaoding\/beam|@gaoding\/illusion-sdk|hotkeys|editor-framework|editor-utils|editor-common|editor-elements|mobile-poster-editor/,
                use: {
                    loader: 'babel-loader',
                },
            },
            {
                test: /\.worker\.js$/,
                use: {
                    loader: 'worker-loader',
                    options: {
                        inline: 'fallback',
                    },
                },
            },
            {
                test: /\.wasm$/,
                type: 'javascript/auto',
            },
        ],
    },
    plugins,
};
