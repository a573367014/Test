const {
    createDefaultCompiler,
    assemble,
} = require('@vue/component-compiler');

exports.createDefaultCompiler = createDefaultCompiler;

const postcss = require('postcss');
const inlinesvg = require('postcss-inline-svg');
const postcssUrl = require('postcss-url');

exports.compilerSFC = function compilerSFC(compiler, code, path) {
    return compiler.compileToDescriptor(path, code);
};

exports.assembleSFC = function assembleSFC(compiler, file, result, { normalizer, styleInjectorSSR } = {}) {
    const config = { styleInjectorSSR };
    if(normalizer) config.normalizer = `~${normalizer}`;
    const js = assemble(compiler, file, result, config).code;

    return js;
};

const processor = postcss();

processor.use(inlinesvg())
    .use(postcssUrl([{
        url: 'inline'
    }]));

exports.compileCss = async function compileCss(css, from) {
    return processor.process(css, {
        from,
    });
};
