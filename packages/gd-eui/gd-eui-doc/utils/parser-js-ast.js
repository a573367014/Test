const jsParser = require('@babel/parser');

/**
 * 默认插件extra
 * @param {import('@babel/parser').ParserOptions} plugins 自定义插件
 * @returns {String[]} plugins
 */
function getBabelParserPlugins(plugins) {
    const defaultBabelParserPlugins = {
        objectRestSpread: true,
        dynamicImport: true,
        classProperties: true,
        exportNamespaceFrom: true,
        moduleStringNames: true,
        optionalChaining: true,
        typescript: true,
        jsx: true,
    };
    const finallyBabelParserPlugins = Object.assign(defaultBabelParserPlugins, plugins || {});
    return Object.keys(finallyBabelParserPlugins).filter((k) => finallyBabelParserPlugins[k]);
}

/**
 * parse js
 * @param {String} input js string
 * @param {import('@babel/parser').ParserOptions} plugins babel parser plugin
 * @returns jsAst
 */
const parse = (input, plugins = {}) => {
    const newPlugins = getBabelParserPlugins(plugins);
    const ast = jsParser.parse(input, {
        sourceType: 'module',
        plugins: newPlugins,
    });
    return ast;
};

module.exports = {
    parse,
};
