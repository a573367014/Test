module.exports = {
    comments: false,
    presets: [
        ['@babel/preset-env', {
            targets: {
                browsers: ['last 2 versions']
            },
            loose: false,
            modules: false,
        }],
        '@vue/babel-preset-jsx',
    ],
    plugins: [
        'lodash',
        'transform-inline-environment-variables',
        // ['@babel/plugin-proposal-decorators', { legacy: true }],
        '@babel/plugin-proposal-function-sent',
        '@babel/plugin-proposal-throw-expressions',
        // '@babel/plugin-proposal-class-properties',
    ],
    env: {
        // development: {
        //     plugins: ['add-module-exports']
        // },
        modules: {
            plugins: [['transform-remove-console', { exclude: ['error', 'warn'] }]],
        },
        test: {
            plugins: ['istanbul'],
        },
    },
};
