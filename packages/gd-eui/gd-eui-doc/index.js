const { DataManager } = require('./manager/data-manager');
const { MdManager } = require('./manager/md-manager');

class GdEuiDoc {
    /**
     * @private
     */
    _dataManager = new DataManager();
    /**
     * @private
     */
    _mdManager = new MdManager();

    /**
     * 初始化
     * @param {string} targetFilePath vue文件
     * @param {string} tsconfigPath tsconfig文件
     * @param {function} shouldFilter 需要过滤的文件
     */
    load(targetFilePath, tsconfigPath, shouldFilter) {
        this._dataManager.load(targetFilePath, tsconfigPath, shouldFilter);
    }

    /**
     * 获取所有import的类型
     */
    getAllImportTypes() {
        return this._dataManager.getAllImportTypes();
    }

    /**
     * 获取所有export
     */
    getAllExportTypes() {
        this._dataManager.getAllExportTypes();
    }

    /**
     * 获取所有类型的数据
     * @returns {import('./types').ITypeObj[]}
     */
    getDataForTypes() {
        return this._dataManager.getDataForTypes();
    }

    /**
     * 获取所有类型的数据的md形式
     * @returns {import('./types').ITypeObj[]}
     */
    getMdForTypes() {
        const self = this;
        const list = this.getDataForTypes();
        let content = '';
        const createByType = (typeObj) => {
            content += self._mdManager.getH(typeObj.name, 4);
            content += self._mdManager.getSpan(typeObj.comment) + '\n';
            const table = [];
            typeObj.children.forEach((item) => {
                table.push([
                    item.name,
                    item.type,
                    item.comment,
                    item.isOptional,
                    item.defaultValue,
                ]);
            });
            content += self._mdManager.getTable(['参数', '类型', '说明', '可选', '默认值'], table);
        };
        const typeMap = new Map();
        list.forEach((typeObj) => {
            if (!typeObj) {
                return;
            }
            if (typeMap.has(typeObj.name)) {
                return;
            }
            typeMap.set(typeObj.name, typeObj.name);
            if (typeObj.type === 'enum') {
                createByType(typeObj);
            }
            if (typeObj.type === 'interface') {
                createByType(typeObj);
            }
            if (typeObj.type === 'type' && typeObj.variable) {
                content += self._mdManager.getH(typeObj.name, 4);
                content += self._mdManager.getSpan(typeObj.comment) + '\n';
                content += `类型: ${self._mdManager.getSpan(typeObj.variable.type)}\n`;
            }
            if (typeObj.type === 'type' && typeObj.method) {
                content += self._mdManager.getH(typeObj.name, 4);
                content += self._mdManager.getSpan(typeObj.comment) + '\n';
                if (typeObj.method.defaultValue && typeObj.method.defaultValue.length) {
                    const methodValue = typeObj.method.defaultValue.replace('__type', '');
                    content += self._mdManager.getSpan(methodValue) + '\n';
                }

                content += `返回值类型: ${self._mdManager.getSpan(typeObj.method.returns)}`;
                if (typeObj.method?.parameters?.length) {
                    const table = [];
                    typeObj.method.parameters.forEach((item) => {
                        table.push([
                            item.name,
                            item.type,
                            item.comment,
                            item.isOptional,
                            item.defaultValue,
                        ]);
                    });
                    content += self._mdManager.getTable(
                        ['参数', '类型', '说明', '可选', '默认值'],
                        table,
                    );
                }
            }
        });
        return content;
    }

    getDataForMarkdownList() {
        return this._dataManager.getDataForMarkdownList();
    }

    getMdForMarkdowns() {
        return this.getDataForMarkdownList().reduce((pre, item) => {
            return pre + item + '\n';
        }, '');
    }

    /**
     * 获取插槽数据
     */
    getDataForTemplateSlots() {
        return this._dataManager.getDataForTemplateSlots();
    }

    /**
     * 获取插槽md数据
     */
    getMdForTemplateSlots() {
        return this.getDataForTemplateSlots().reduce((pre, item) => {
            const name = this._mdManager.getH(item.name, 4);
            const desc = this._mdManager.getSpan(item.desc);
            return pre + name + desc;
        }, '');
    }

    /**
     * 获取@title 标签的数据
     * @returns {import('../types/index').ITitleTagData[]}
     */
    getDataForTitles() {
        return this._dataManager.getDataForTitles();
    }

    /**
     * 获取@title 标签的数据的md形式
     * @returns {string}
     */
    getMdForTitles() {
        const self = this;
        const list = this.getDataForTitles();
        const content = list.reduce((pre, item) => {
            const title = self._mdManager.getH3(item.title);
            const desc = self._mdManager.getSpan(item.desc);
            const dots = self._mdManager.getDots(item.dots);
            return pre + `${title}${desc}${dots}\n`;
        }, '');
        return content;
    }

    /**
     * 获取property 属性数据
     * @returns {import('../types/index').IPropertyData[]}
     */
    getDataForVueProperties() {
        return this._dataManager.getDataForVueProperties();
    }

    /**
     * 获取property 属性数据的md形式
     * @returns {string}
     */
    getMdForVueProperties() {
        const list = this.getDataForVueProperties();
        const table = [];
        list.forEach((item) => {
            table.push([
                item.name,
                item.desc,
                item.type,
                item.require,
                item.defaultValue.replace(/\n/g, ''),
            ]);
        });
        const data = this._mdManager.getTable(['参数', '说明', '类型', '可选值', '默认值'], table);
        return data;
    }

    /**
     * 获取emits 数据
     * @returns {import('../types/index').IEmitesData[]}
     */
    getDataForEmits() {
        return this._dataManager.getDataForEmits();
    }

    /**
     * 获取emits 数据的md形式
     * @returns {string}
     */
    getMdForEmits() {
        const self = this;
        const list = this.getDataForEmits();
        let content = '';
        list.forEach((item) => {
            content += self._mdManager.getH(item.name, 4);
            content += self._mdManager.getSpan(item.desc);
            const table = [];
            item.params.forEach((param) => {
                table.push([param.name, param.type, param.desc]);
            });
            const data = this._mdManager.getTable(['参数', '类型', '说明'], table);
            content += '\n' + data;
        });
        return content;
    }

    /**
     * 获取@function 数据
     * @returns {import('../types/index').IFunctionData[]}
     */
    getDataForFunction() {
        return this._dataManager.getDataForFunction();
    }

    /**
     * 获取@function 数据的md形式
     * @returns {string}
     */
    getMdForFunction() {
        const self = this;
        const list = this.getDataForFunction();
        let content = '';
        list.forEach((item) => {
            content += self._mdManager.getH(item.name, 4);
            content += self._mdManager.getSpan(item.functionStr);
            content += self._mdManager.getSpan(item.desc);
            const table = [];
            item.params.forEach((param) => {
                table.push([param.name, param.type, param.desc]);
            });
            const data = this._mdManager.getTable(['参数', '类型', '说明'], table);
            content += '\n' + data;
        });
        return content;
    }
}

module.exports = {
    GdEuiDoc,
};
