// from https://github.com/youzan/vant/blob/dev/build/build-components.js
const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');
const childProcess = require('child_process');
const less = require('less');
const { compilerSFC, assembleSFC, compileCss, createDefaultCompiler } = require('./compiler-sfc');

const esDir = path.resolve(__dirname, '../dist');

const imports = `@import url('${path.resolve(__dirname, '../src/styles/variables.less')}');`;
const compiler = createDefaultCompiler({
    style: {
        preprocessOptions: {
            less: {
                data: imports
            }
        }
    }
});

const babelConfig = {
    root: path.resolve(__dirname, '../'),
};
const vueNormalizeRelativePath = 'utils/vue-normalize-component.js';

let vueNormalizePath = path.resolve(__dirname, '../dist/', vueNormalizeRelativePath);

console.log('clean ...');
childProcess.execSync(`rm -rf ${esDir}`);

childProcess.execSync('cp -r src dist');

async function asyncForEach(array, callback) {
    for(let index = 0; index < array.length; index += 1) {
        await callback(array[index], index, array);
    }
}

function isDir(dir) {
    return fs.lstatSync(dir).isDirectory();
}


async function compile(dir) {
    const files = fs.readdirSync(dir);

    await asyncForEach(files, async(file) => {
        const absolutePath = path.resolve(dir, file);

        if(isDir(absolutePath)) {
            await compile(absolutePath);
        }
        else if(/\.less$/.test(file)) {
            const source = fs.readFileSync(absolutePath, 'utf-8');
            let { css } = await less.render(`${imports}\n${source}`, { filename: absolutePath });
            const outputcssPath = absolutePath.replace('.less', '.css');

            if(css) {
                css = await compileCss(css, absolutePath);
                fs.writeFileSync(outputcssPath, css);
                childProcess.execSync(`rm ${absolutePath}`);
            };
        }
        else if(/\.vue$/.test(file)) {
            const source = fs.readFileSync(absolutePath, 'utf-8');
            childProcess.execSync(`rm ${absolutePath}`);
            const outputVuePath = `${absolutePath}.js`;
            const outputJsPath = absolutePath.replace('.vue', '.js');
            const outputcssPath = absolutePath.replace('.vue', '.css');
            const output = fs.existsSync(outputJsPath) ? outputVuePath : outputJsPath;
            const result = compilerSFC(compiler, source, absolutePath);
            const css = result.styles.map(s => s.code).join('\n');
            // prevent inject style
            result.styles = [{
                // reserve scopeId
                scoped: true,
                errors: []
            }];

            const normalizer = path.relative(dir, vueNormalizePath).replace(/^([^.])/, './$1');
            let js = assembleSFC(compiler, file, result, { });
            js = babel
                .transform(js, babelConfig).code
                .replace(/\.less/, '.css');

            if(css) {
                const name = file.replace('.vue', '');
                const result = await compileCss(css, absolutePath);
                fs.writeFileSync(outputcssPath, result);
                js = `import './${name}.css';\n${js}`;
            }

            fs.writeFileSync(output, js);
        }
        else if(/\.js$/.test(file)) {
            const { code } = babel.transformFileSync(absolutePath, babelConfig);
            let js = code
                .replace(/\.less/g, '.css');
            fs.writeFileSync(absolutePath, js);
        }
    });
}

(async function() {
    // copy packages
    try {
        console.log('○ Build ES Module components ...');

        process.env.BABEL_ENV = 'modules';
        await compile(esDir);
    }
    catch(error) {
        console.log('打包失败');
        console.log(error);
        process.exit(1);
    }
}());
