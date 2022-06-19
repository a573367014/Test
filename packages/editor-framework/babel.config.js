module.exports = {
    comments: false,
    presets: [
        [
            '@babel/preset-env',
            {
                targets: {
                    browsers: ['last 2 versions'],
                },
                loose: false,
                modules: false,
            },
        ],
    ],
    plugins: [
        'lodash',
        'transform-inline-environment-variables',
        '@babel/plugin-transform-runtime',
        '@babel/plugin-proposal-class-properties',
        [
            'module-resolver',
            {
                alias: {
                    '@gaoding/editor-utils/lib': '@gaoding/editor-utils/lib',
                    '@gaoding/editor-utils': '@gaoding/editor-utils/lib',
                },
            },
        ],
    ],
    env: {
        lib: {
            plugins: [
                ['transform-require-ignore', { extensions: ['.less'] }],
                'transform-inline-environment-variables',
                'transform-remove-console',
                '@babel/plugin-proposal-class-properties',
            ],
        },
    },
};
