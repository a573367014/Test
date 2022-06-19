const path = require('path');
const Promise = require('bluebird');
const { exec } = require('./utils');

const fsp = require('fs-extra');
const { props } = require('bluebird');

const dirs = [
    path.resolve(__dirname, '../../editor-elements'),
    path.resolve(__dirname, '../src/static'),
    path.resolve(__dirname, '../src/containers'),
    // path.resolve(__dirname, '../../editor-elements/effect-text'),
    // path.resolve(__dirname, '../src/static/transform'),
];

forDirs();

function file2Vue(htmlFile, jsFile) {
    const template = fsp.readFileSync(htmlFile, {
        encoding: 'utf-8',
    });

    if (!template) return;
    let js = fsp.readFileSync(jsFile, {
        encoding: 'utf-8',
    });

    js = replaceProps(js);
    js = replaceTemplate(js);
    js = replaceVueInherit(js);

    const vueFile = jsFile.replace('.js', '.vue');
    fsp.ensureFileSync(vueFile);
    fsp.writeFileSync(
        vueFile,
        `<template>
            ${template}
        </template>
        <script>
            ${js}
        </script>`,
        {
            encoding: 'utf-8',
        },
    );
    fsp.removeSync(jsFile);
    fsp.removeSync(htmlFile);
}

function replaceProps(js) {
    const propsMap = {
        editor: `{
            type: Object,
            required: true
        }`,
        options: `{
            type: Object,
            required: true
        }`,
        global: `{
            type: Object,
            required: true
        }`,
        layouts: `{
            type: Array,
            default: () => []
        }`,
        currentLayout: `{
            type: Object,
            default: null
        }`,
        layout: `{
            type: Object,
            default: null
        }`,
        model: `{
            type: Object,
            default: null
        }`,
        currentSubElement: `{
            type: Object,
            default: null
        }`,
        currentElement: `{
            type: Object,
            default: null
        }`,
        maskInfoElement: `{
            type: Object,
            default: null,
        }`,
        parentModel: `{
            type: Object,
            default: null,
        }`,
        subModel: `{
            type: Object,
            default: null,
        }`,
        element: `{
            type: Object,
            default: null
        }`,
        selected: `{
            type: Boolean,
            default: false
        }`,
        globalLayout: `{
            type: Object,
            default: null
        }`,
        mode: `{
            type: String,
            required: true
        }`,
        layerList: `{
            type: Array,
            default: () => []
        }`,
        $events: `{
            type: Object,
            required: true
        }`,
        elements: `{
            type: Array,
            default: () => []
        }`,
    };

    js = js.replace(/props:\s*(\[[^\]]+\])/, (a, b) => {
        // eslint-disable-next-line
        eval('var props =' + b);

        let newprops = '';
        let error;
        if (!Array.isArray(props)) return props;
        props.some((key) => {
            if (!propsMap[key]) {
                console.error(key);
                error = true;
                return true;
            }

            newprops += `${key}: ${propsMap[key]},`;
            return false;
        });
        if (error) return a;
        return `props: {
            ${newprops}
        }`;
    });

    return js;
}

function replaceTemplate(js) {
    js = js.replace(/import.+\.html'/, '');
    js = js.replace(`template,`, '');
    js = js.replace(/ template:.+/, '');
    return js;
}

function replaceVueInherit(js) {
    [
        'EditorElement',
        'BaseElement',
        'EditorElementGroup',
        'TextBase',
        'ImageBaseElement',
        'BaseElement.createStaticBaseElement\\(\\)',
    ].forEach((_var) => {
        const inheritMatch = new RegExp(
            `export default inherit\\(${_var},\\s*{([^~]*)(}\\);(\\n|\\r|\\s*))$`,
        );

        if (!inheritMatch.test(js)) {
            return js;
        }

        const mixinMatch = /mixins:\s*(.+),/;
        let mixinsStr = '';

        _var = _var.replace(/\\(\(|\))/g, '$1');
        if (mixinMatch.test(js)) {
            js = js.replace(mixinMatch, `mixins: [].concat(${_var}, $1),`);
        } else {
            mixinsStr = `mixins: [].concat(${_var}),`;
        }

        js = js.replace(
            inheritMatch,
            `export default {
                ${mixinsStr}
                $1
            };
            `,
        );
        return js;
    });

    if (!js.includes('inherit(')) {
        js = js.replace(/import inherit from '.*\/vue-inherit'/, '');
    }

    return js;
}

function findFile(files, htmlfile) {
    const presetList = {
        'editor-element-collage.html': 'collage-element.js',
        'element-cell.html': 'cell-element.js',
    };

    const _diranme = path.dirname(htmlfile);
    const basename = path.basename(htmlfile);
    const presetPath = presetList[basename] && path.join(_diranme, presetList[basename]);
    if (presetPath) return presetPath;

    const filepathIndex = htmlfile.lastIndexOf('/');
    const filepath = htmlfile.slice(0, filepathIndex);
    const jsfile = htmlfile.split('.')[0] + '.js';

    if (filepathIndex < 0) throw new Error('findFile: filepath error');
    return files.find((n) => n === jsfile) || filepath + '/index.js';
}

function forDirs(_dirs) {
    _dirs = _dirs || dirs;
    _dirs.forEach((dir) => {
        let files = fsp.readdirSync(dir) || [];
        files = files.map((file) => path.join(dir, file));

        files.forEach((filename) => {
            if (filename.endsWith('.html')) {
                file2Vue(filename, findFile(files, filename));
                return;
            }

            let stat;
            try {
                stat = fsp.statSync(filename);
            } catch (e) {}

            if (stat && stat.isDirectory()) {
                forDirs([filename]);
            } else if ({ 'text-base.js': true }[path.basename(filename)]) {
                let js = fsp.readFileSync(filename, {
                    encoding: 'utf-8',
                });

                js = replaceProps(js);
                js = replaceTemplate(js);

                fsp.writeFileSync(filename, js);
            }
        });
    });
}

dirs.reduce((p, v) => {
    const cmd = `eslint --fix --ext .vue,.js ${v}`;
    console.log(cmd);
    return p.then(() => exec(cmd));
}, Promise.resolve());
