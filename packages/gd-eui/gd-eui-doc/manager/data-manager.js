const path = require('path');
const { Context } = require('../core/context');
const { TypesContext } = require('../core/types-context');
const { getDefaultComment } = require('../utils/get-default-comment');
const { getParamsFirstValue } = require('../utils/get-params-first-value');

class DataManager {
    context = new Context();
    /**
     * @type {TypesContext}
     */
    typeContext = null;
    targetFilePath = '';
    tsconfigPath = '';
    /**
     * @type {import('../core/parser-import').ParserImportContext[]}
     */
    rootImportContextList = [];

    /**
     * 初始化
     * @param {string} targetFilePath vue文件
     * @param {string} tsconfigPath tsconfig文件
     * @param {function} shouldFilter 需要过滤的文件
     */
    load(targetFilePath, tsconfigPath, shouldFilter) {
        this.targetFilePath = targetFilePath;
        this.tsconfigPath = tsconfigPath;
        this.context.load(targetFilePath);
        this._parse();
        this._initTypeContextList(shouldFilter);
    }

    /**
     * 初始化type list
     */
    async _initTypeContextList(
        _shouldFilter = (_source) => {
            return false;
        },
    ) {
        this.typeContextList = [];
        const typeContext = new TypesContext();
        const paths = [];
        const rootImportContextList = [];
        this.context.importMap.forEach((v, k) => {
            if (v.isRoot) {
                return;
            }
            if (this.targetFilePath === v.context.importer) {
                rootImportContextList.push(v.context);
            }
            paths.push(k);
        });
        this.rootImportContextList = rootImportContextList;
        // console.log('rootImportContextList', rootImportContextList);
        // const virtualFilePath = path.join(
        //     this.context.fileDir,
        //     `./virtual-${path.basename(this.targetFilePath, ".vue")}.ts`
        // );
        // fs.writeFileSync(virtualFilePath, this.context.script.content);
        const virtualFilePath = [];
        if (this.targetFilePath.endsWith('.ts')) {
            virtualFilePath.push(this.targetFilePath);
        }
        typeContext.load([...paths, ...virtualFilePath], this.tsconfigPath);
        typeContext.parse();
        // fs.unlinkSync(virtualFilePath)
        this.typeContext = typeContext;
    }

    _parse() {
        this.context.parse();
    }

    /**
     * 获取对应context的类型对象
     * @param {string} type
     * @param {TypesContext} typeContext
     */
    getType(type, typeContext) {
        const typeObj = typeContext.getType(type);
        return typeObj;
    }

    /**
     * 获取所有import
     */
    getAllImportTypes() {
        const list = this.context.parserImportContextList;
        return list.map((item) => {
            const source = path.resolve(this.context.fileDir, item.source);
            return {
                importSpecifiers: item.importSpecifiers,
                source,
            };
        });
    }

    /**
     * 获取所有export
     */
    getAllExportTypes() {
        const list = this.context.parserExportContextList;
        const newList = [];
        list.forEach((item) => {
            newList.push({ ...item.exportName });
        });
        return newList;
    }

    /**
     * 获取相关类型
     * @param {{}[]} originList
     * @param {TypesContext}  typeContext
     * @returns {string[]}
     */
    _getFilterReferenceTypes(originList, typeContext) {
        /**
         * @type {string[]}
         */
        const list = [];
        const map = new Map();
        const add = (type) => {
            if (!map.has(type)) {
                list.push(type);
                map.set(type, type);
            }
        };
        originList.forEach((type) => {
            add(type);
            const ml = typeContext.getReferenceTypesByType(type);
            ml.forEach((type) => {
                add(type);
            });
        });
        return list;
    }

    /**
     * 获取所有类型的数据
     * @returns {import('../types').ITypeObj[]}
     */
    getDataForTypes() {
        /**
         * @type {Map<string, import('../types').ITypeObj>}
         */
        const map = new Map();
        /**
         * @type {import('../types').ITypeObj[]}
         */
        const list = [];
        // console.log('this.rootImportContextList', this.rootImportContextList);
        this.context.parserImportContextList.forEach((importContext) => {
            importContext.importSpecifiers.forEach((type) => {
                const referenceList = this.typeContext.getReferenceTypesByType({
                    type,
                    source: importContext.sourcePath,
                });
                const selfTypeObj = this.typeContext.getType({
                    type,
                    source: importContext.sourcePath,
                });
                const id = `${type}${importContext.sourcePath}`;
                if (!map.has(id)) {
                    map.set(id, selfTypeObj);
                }
                referenceList.forEach((item) => {
                    if (map.has(item)) {
                        return;
                    }
                    const itemObj = JSON.parse(item);
                    if (!itemObj) {
                        return;
                    }
                    const typeObj = this.typeContext.getType({
                        ...itemObj,
                    });
                    if (!typeObj) {
                        return;
                    }
                    map.set(item, typeObj);
                });
            });
        });
        map.forEach((typeObj) => {
            list.push(typeObj);
        });
        return list;
    }

    /**
     * 获取@markdown 标签的数据
     */
    getDataForMarkdownList() {
        const list = this.context.parserProgramContext.commentsList;
        const markdownList = [];
        list.filter((item) => {
            if (item.markdown) {
                const content = item.default.reduce((pre, item) => {
                    return pre + item + '\n';
                }, '');
                markdownList.push(content);
            }
        });
        return markdownList;
    }

    /**
     * 获取@title 标签的数据
     * @returns {import('../types/index').ITitleTagData[]}
     */
    getDataForTitles() {
        const list = this.context.parserProgramContext.commentsList;
        const filterList = [];
        list.forEach((item) => {
            if (item.title) {
                filterList.push({
                    title: getParamsFirstValue(item.title),
                    desc: getDefaultComment(item),
                    dots: item.dot,
                });
            }
        });
        return filterList;
    }

    /**
     * 获取插槽数据
     */
    getDataForTemplateSlots() {
        return this.context.parserTemplateContext?.slotList;
    }

    /**
     * 获取property 属性数据
     * @returns {import('../types/index').IPropertyData[]}
     */
    getDataForVueProperties() {
        const list = this.context.parserComponentContext.propertyContextList;
        const newList = list.map((ct) => {
            return {
                name: ct.name,
                type: ct.type,
                defaultValue: ct.defaultValue,
                require: ct.require,
                desc: getDefaultComment(ct.comments),
            };
        });
        return newList;
    }

    /**
     * 获取emits 数据
     * @returns {import('../types/index').IEmitesData[]}
     */
    getDataForEmits() {
        const list = this.context.parserComponentContext.emitsContextList;
        const newList = list.map((ct) => {
            return {
                name: ct.name,
                desc: ct.desc,
                params: ct.params,
            };
        });
        return newList;
    }

    /**
     * 获取@function 数据
     * @returns {import('../types/index').IFunctionData[]}
     */
    getDataForFunction() {
        const list = this.context.parserComponentContext.functionContextList;
        const newList = list.map((ct) => {
            return {
                name: ct.name,
                desc: getDefaultComment(ct.comments),
                returnType: ct.returnType,
                params: ct.params,
                functionStr: ct.functionStr,
                comments: ct.comments,
            };
        });
        return newList;
    }
}

module.exports = {
    DataManager,
};
