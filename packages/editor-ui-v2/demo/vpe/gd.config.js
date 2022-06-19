const path = require('path');
const pkg = require('@gaoding/editor-framework/package.json');

process.env.__DEV__ = 'true';
process.env.__VERSION__ = pkg.version;

module.exports = {
    pages: {
        index: {
            entry: path.resolve(__dirname, 'index.js'),
            template: path.resolve(__dirname, 'index.html'),
        },
    },

    plugins: ['built-in:vue', 'built-in:ts'],

    css: {
        cssPreprocessor: 'less',
        loaderOptions: {
            postcss: {
                postcssOptions: {
                    plugins: [
                        require('postcss-inline-svg')({
                            removeFill: false,
                            encode: function (code) {
                                return encodeURIComponent(code);
                            },
                        }),
                        // require('postcss-cssnext')(),
                    ],
                },
            },
        },
    },

    loaderOptions: {
        babel: {
            jsx: true,
        },
    },

    chainWebpack(config) {
        config.module
            .rule('js')
            .exclude.add(/node_modules/)
            .add(/@gaoding\/editor-framework/)
            .end();

        config.resolve.alias
            .set('@', path.resolve(__dirname, '../../'))
            .set('vue', 'vue/dist/vue.js');

        // html-loader
        config.module
            .rule('html')
            .test(/\.html$/)
            .use('html-loader')
            .loader('html-loader');

        // img rule -> url-loader
        config.module
            .rule('img')
            .use('url-loader')
            .tap((options) => {
                return {
                    ...options,
                    limit: 4 * 1024,
                    // fix for conflict img filename
                    name: 'img/[name]_[hash:8].[ext]',
                };
            });

        // worker-loader
        config.module
            .rule('worker')
            .test(/\.worker\.js$/)
            .type('javascript/auto')
            .use('worker-loader')
            .loader('worker-loader')
            .tap(() => {
                return {
                    inline: 'fallback',
                };
            });

        // style-resources-loader
        ['normal', 'normal-modules'].forEach((type) => {
            config.module
                .rule('less')
                .oneOf(type)
                .use('style-resources-loader')
                .loader('style-resources-loader')
                .options({
                    patterns: [path.resolve(__dirname, '../../src/styles/variables.less')],
                });
        });
    },

    devServer: {
        host: '0.0.0.0',
        contentBase: path.resolve(__dirname),
    },
};
