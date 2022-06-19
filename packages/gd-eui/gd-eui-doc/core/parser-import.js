const { ParserBaseContext } = require('./parser-base');
const { parse } = require('../utils/parser-js-ast');
const traverse = require('@babel/traverse').default;
const path = require('path');
const fs = require('fs');

class ParserImportContext extends ParserBaseContext {
    /**
     * import 的标识
     * @type {string[]}
     */
    importSpecifiers = [];
    /**
     * 来源
     */
    source = '';
    /**
     * 绝对路径
     */
    sourcePath = null;
    /**
     * 所在目录
     */
    sourceDir = null;
    /**
     * 引用者
     */
    importer = null;
    /**
     * 引用者目录
     */
    importerDir = null;
    /**
     * 是否是来源于三方库
     */
    isThird = false;

    /**
     * node、path context for import
     * @type {ParserImportContext[]}
     */
    parserImportContextList = [];

    /**
     * @type {Map}
     */
    importMap = null;

    /**
     * 初始化
     * @param {import('@babel/traverse').NodePath} nodePath
     * @param {string} importer
     * @param {Map} importMap
     */
    constructor(nodePath, importer, importMap) {
        super();
        this.path = nodePath;
        this.node = nodePath?.node;
        this.importer = importer;
        const fileDir = path.dirname(importer);
        this.importerDir = fileDir;
        this.importMap = importMap;
    }

    /**
     * @param {string} script
     */
    parser(script) {
        const self = this;
        const content = script.substring(this.node.start, this.node.end);
        this.content = content;
        this.source = this.node.source.value;
        this.node.specifiers &&
            this.node.specifiers.forEach((element) => {
                this.importSpecifiers.push(element?.imported?.name || element.local.name);
            });
        this.isThird = !this.source.match(/^(\/|\.|\/\.\.)/);
        if (this.isThird) {
            return;
        }
        // 目录
        if (fs.existsSync(path.join(this.importerDir, this.source))) {
            this.sourcePath = path.join(this.importerDir, this.source, '/index.ts');
        } else if (this.source.endsWith('.ts')) {
            this.sourcePath = path.join(this.importerDir, this.source);
        } else {
            this.sourcePath = path.join(this.importerDir, this.source + '.ts');
        }
        if (!fs.existsSync(this.sourcePath)) {
            return;
        }
        this.sourceDir = path.dirname(this.sourcePath);

        if (this.importMap.has(this.sourcePath)) {
            return;
        } else {
            this.importMap.set(this.sourcePath, {
                context: this,
                isRoot: false,
            });
        }

        const buffer = fs.readFileSync(this.sourcePath);
        const fileContent = String(buffer);
        const ast = parse(fileContent);
        const importContextList = [];
        traverse(ast, {
            /**
             * import
             */
            ImportDeclaration(childPath) {
                const importContext = new ParserImportContext(
                    childPath,
                    self.sourcePath,
                    self.importMap,
                );
                importContext.parser(fileContent);
                importContextList.push(importContext);
            },
        });
        this.parserImportContextList = importContextList;
    }
}

module.exports = {
    ParserImportContext,
};
