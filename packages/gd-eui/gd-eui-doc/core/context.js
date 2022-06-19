const fs = require('fs');
const path = require('path');
const traverse = require('@babel/traverse').default;
const { ParserImportContext } = require('./parser-import');
const { ParserDefineComponentContext } = require('./parser-define-component');
const { ParserProgramContext } = require('./parser-program');
const { ParserExportContext } = require('./parser-export');
const { ParserTemplateContext } = require('./parser-template');
const { spliceVue } = require('../utils/splice-vue');
const { parse } = require('../utils/parser-js-ast');
// const { exportJson } = require('../test/utils');

class Context {
    /**
     * 模版
     * @type {{start: number, end: number, content: string} || null} template
     */
    template = null;
    /**
     * file
     */
    inputFile = null;
    /**
     * js/ts
     * @type {{start: number, end: number, content: string, lang: string}}  script
     */
    script = null;
    /**
     * 同babel/parser plugin
     * @type {import('@babel/parser').ParserOptions}
     */
    plugins = {};
    /**
     * js ast
     * @type {import("@babel/types").File}
     */
    ast = null;
    /**
     * 文件所在目录
     */
    fileDir = '';
    /**
     * node、path context for import
     * @type {ParserImportContext[]}
     */
    parserImportContextList = null;
    /**
     * node、path context for export
     * @type {ParserExportContext[]}
     */
    parserExportContextList = null;
    /**
     * node、path context for component by vue3
     * @type {ParserDefineComponentContext}
     */
    parserComponentContext = null;
    /**
     * node、path context for program file
     * @type {ParserProgramContext}
     */
    parserProgramContext = null;

    /**
     * @type {ParserTemplateContext}
     */
    parserTemplateContext = null;

    importMap = new Map();

    /**
     * 初始化加载
     * @param {string} inputFile
     * @param {import('@babel/parser').ParserOptions} plugins
     */
    load(inputFile, plugins = {}) {
        if (!fs.existsSync(inputFile)) {
            throw new Error("input isn't file");
        }
        this.inputFile = inputFile;
        const fileDir = path.dirname(inputFile);
        const buffer = fs.readFileSync(inputFile);
        const fileContent = String(buffer);
        // file is vue
        if (inputFile.lastIndexOf('.vue') !== -1) {
            const spliceData = spliceVue(fileContent);
            this.script = spliceData.script;
            this.template = spliceData.template;
        } else {
            // file is ts/js
            this.script = {
                start: 0,
                end: fileContent.length,
                content: fileContent,
            };
            this.template = null;
        }
        this.plugins = plugins;
        this.fileDir = fileDir;
    }

    /**
     * 解析
     */
    parse() {
        if (!this.script) {
            return;
        }
        const ast = parse(this.script.content, this.plugins);
        if (this.template) {
            this.parserTemplateContext = new ParserTemplateContext(this.template.content);
        }
        this.ast = ast;
        this.traverseAll();
        return ast;
    }

    /**
     * 遍历所有
     */
    traverseAll() {
        const self = this;
        const importContextList = [];
        const exportContextList = [];
        const programContext = new ParserProgramContext(this.ast);
        let componentParser = null;
        programContext.parser(self.script.content);
        if (this.importMap.has(this.inputFile)) {
            return;
        } else {
            this.importMap.set(this.inputFile, {
                context: this,
                isRoot: true,
            });
        }
        traverse(this.ast, {
            /**
             * import
             */
            ImportDeclaration(childPath) {
                const importContext = new ParserImportContext(
                    childPath,
                    self.inputFile,
                    self.importMap,
                );
                importContext.parser(self.script.content);
                importContextList.push(importContext);
            },
            /**
             * defineComponent for vue3
             */
            CallExpression(childPath) {
                if (
                    childPath.node.callee.name === 'defineComponent' &&
                    childPath.scope.getBindingIdentifier('defineComponent')
                ) {
                    componentParser = new ParserDefineComponentContext(childPath);
                    componentParser.parser(self.script.content);
                }
            },

            /**
             * export type
             */
            ExportNamedDeclaration(childPath) {
                const exportContext = new ParserExportContext(childPath);
                exportContext.parser(self.script.content);
                exportContextList.push(exportContext);
            },
        });
        this.parserImportContextList = importContextList;
        this.parserComponentContext = componentParser;
        this.parserProgramContext = programContext;
        this.parserExportContextList = exportContextList;
    }
}

module.exports = {
    Context,
};
