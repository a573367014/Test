const presets = ['@babel/env'];
const plugins = [
    '@babel/plugin-proposal-export-default-from',
    '@babel/plugin-proposal-object-rest-spread',
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-transform-runtime',
];

module.exports = {
    presets,
    plugins,
};
