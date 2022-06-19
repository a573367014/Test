const { join } = require('path');
const pkg = require('../../package.json');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

process.env.__VERSION__ = pkg.version;

const plugins = [new VueLoaderPlugin()];
if(process.env.ANALYSE_BUNDLE) {
    plugins.push(new BundleAnalyzerPlugin());
}

module.exports = {
    devtool: 'source-map',
    entry: {
        'demo': join(__dirname, './index.js')
    },
    output: {
        path: join(__dirname, 'dist'),
        publicPath: '/test/e2e-entry/dist/',
        filename: 'demo.js'
    },
    resolve: {
        extensions: ['.js', '.vue'],
        alias: {
            vue: 'vue/dist/vue.js',
            'vue-poster-editor': join(__dirname, '../../src/index.js')
        }
    },
    module: {
        rules: [
            { test: /\.json$/, loader: 'json-loader' },
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
                                require('postcss-inline-svg')({ removeFill: false }),
                                require('postcss-cssnext')(),
                            ]
                        }
                    },
                    { loader: 'less-loader' }
                ]
            },
            {
                test: /\.css$/,
                use: [{ loader: 'vue-style-loader' }, { loader: 'css-loader' }]
            },
            {
                loader: 'url-loader',
                test: /\.(png|jpg|gif|svg)$/,
                query: { limit: 4 * 1024, name: '[name].[ext]?[hash:6]' }
            },
            {
                test: /\.js$/,
                include: /src|vue-color|@gaoding\/beam-plugins|@gaoding\/beam|@gaoding\/illusion-sdk|hotkeys|editor-framework|editor-utils|editor-common|editor-elements|mobile-poster-editor/,
                use: {
                    loader: 'babel-loader'
                }
            },
            { test: /\.html$/, loader: 'html-loader' },
            {
                test: /\.wasm$/,
                type: 'javascript/auto'
            }
        ]
    },
    plugins
};
