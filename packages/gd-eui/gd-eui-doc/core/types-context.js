const { compileFiles } = require('../typedoc/bin/typedoc');
const Enumerations = 'Enumerations';
const Interfaces = 'Interfaces';
const TypeAliases = 'Type aliases';
const Variables = 'Variables';
const Functions = 'Functions';
const Modules = 'Modules';

const TYPE_DESC = {
    ENUM: 'enum',
    INTERFACE: 'interface',
    TYPE: 'type',
    NUMBER: 'Number',
    BOOLEAN: 'Boolean',
    STRING: 'String',
    METHOD: 'method',
};

class TypesContext {
    filePath = '';
    tsconfigPath = '';
    /**
     * @type {import('../typedoc/core/lib/serialization/schema').ModelToObject<import('../typedoc/core/lib/models/index').ProjectReflection>}
     */
    typesJson = null;
    enumerationsId = [];
    enumerations = [];
    interfacesId = [];
    interfaces = [];
    typeAliasesId = [];
    typeAliases = [];
    variablesId = [];
    variables = [];
    functionsId = [];
    functions = [];
    modulesId = [];
    allNodeMap = new Map();

    /**
     * 加载
     * @param {string[]} filePaths ts文件
     * @param {string} tsconfigPath  tsconfig 文件
     */
    load(filePaths, tsconfigPath) {
        let files = [];
        if (typeof filePaths === 'string') {
            files.push(filePaths);
        } else {
            files = filePaths;
        }
        const res = compileFiles(files, tsconfigPath);
        console.log('type .error', res.error);
        if (res.error) {
            return;
        }
        this.typesJson = res.data;
    }
    /**
     * 初始化加载
     */
    // load(path) {
    //     const json = fs.readFileSync(path, 'utf-8');
    //     this.typesJson = JSON.parse(json);
    // }

    // loadTypesJson(typeJson) {
    //     this.typesJson = typeJson;
    // }

    getAllTypes() {
        const list = [];
        return list.concat(
            this.enumerations,
            this.interfaces,
            this.typeAliases,
            this.variables,
            this.functions,
        );
    }

    /**
     * 获取类型定义
     * @param { {type: string, source: string} } type
     */
    getType(type) {
        // type type, source
        let typeObj = this.getAllTypes().find((item) => {
            return type.type === item.name && type.source === item.sources;
        });

        if (typeObj) {
            return typeObj;
        }

        typeObj = this.getAllTypes().find((item) => {
            return type.type === item.name;
        });

        return typeObj;
    }

    /**
     * 获取对应类型的相关类型
     * @param { {type: string, source: string} } type
     * @returns {string[]}
     */
    getReferenceTypesByType(type) {
        const typeObj = this.getType(type);
        if (typeObj) {
            const map = this.getReferenceTypes(typeObj?.node);
            const list = [];
            map.forEach((v) => {
                list.push(v);
            });
            return list;
        }
        return [];
    }

    parseGroup() {
        const self = this;
        this.typesJson.groups &&
            this.typesJson.groups.forEach((group) => {
                switch (group.title) {
                    case Enumerations: {
                        self.enumerationsId = group.children;
                        break;
                    }
                    case Interfaces: {
                        self.interfacesId = group.children;
                        break;
                    }
                    case TypeAliases: {
                        self.typeAliasesId = group.children;
                        break;
                    }
                    case Variables: {
                        self.variablesId = group.children;
                        break;
                    }
                    case Functions: {
                        self.functionsId = group.children;
                        break;
                    }
                    case Modules: {
                        self.modulesId = group.children;
                        break;
                    }
                    default:
                        break;
                }
            });
    }

    /**
     * 获取注释
     * @param {{comment: {shortText: string}}} child
     */
    getComment(child) {
        if (child.comment && child.comment.shortText) {
            return child.comment.shortText;
        }
        return '';
    }

    /**
     * 获取来源
     * @param {Object} child
     */
    getSources(child) {
        // if (child.sources) {
        //     return child.sources.map(item => item.fullFileName);
        // }
        // return [];
        if (child.sources && child.sources.length) {
            return child.sources[0].fullFileName;
        }
        return '';
    }

    getFullFileNameBysources(sources) {
        if (sources && sources.length) {
            return sources[0].fullFileName;
        }
        return '';
    }

    /**
     * 是否可选
     * @param {Object} child
     */
    getIsOptional(child) {
        if (child.flags && child.flags.isOptional) {
            return child.flags.isOptional;
        }
        return false;
    }

    /**
     * @returns {Map<string, string>}
     */
    getReferenceTypes(node, originMap = new Map()) {
        const typeMap = new Map();
        const formatKey = (name, source) => {
            return `{"type":"${name}","source":"${this.getFullFileNameBysources(source)}"}`;
        };
        if (originMap.has(formatKey(node?.name, node?.sources))) {
            return typeMap;
        }
        const addValue = (v) => {
            if (!typeMap.has(v)) {
                typeMap.set(v, v);
            }
            if (!originMap.has(v)) {
                originMap.set(v, v);
            }
        };
        const addValueByMap = (map) => {
            map.forEach((value) => {
                addValue(value);
            });
        };
        switch (node?.type?.type) {
            case 'literal': {
                const typeDesc = node?.type.value;
                // let typeDesc = Object.prototype.toString.call(node?.type.value);
                // typeDesc = typeDesc.substring(
                //     typeDesc.lastIndexOf(' ') + 1,
                //     typeDesc.lastIndexOf(']'),
                // );
                // addValue(typeDesc);
                addValue(formatKey(typeDesc, node.sources));
                break;
            }
            case 'intrinsic': {
                // addValue(node?.type.name);
                addValue(formatKey(node?.type.name, node.sources));
                break;
            }
            case 'reference': {
                if (node?.type?.typeArguments && node?.type?.typeArguments.length) {
                    node?.type?.typeArguments.forEach((item) => {
                        // addValue(this.getTypeName(item));
                        addValue(formatKey(this.getTypeName(item), node?.sources));
                    });
                } else {
                    addValue(
                        formatKey(node?.type.name, this.allNodeMap.get(node.type.id)?.sources),
                    );
                }
                break;
            }
            // intersection TODO
            // reflection TODO
            default:
                break;
        }
        // TODO 暂时只处理interface
        if (node?.kindString === 'Interface') {
            // addValue(node?.name);
            addValue(formatKey(node?.name, node.sources));
        }

        if (node?.children && node?.children.length) {
            node.children.forEach((item) => {
                const map = this.getReferenceTypes(item, originMap);
                addValueByMap(map);
            });
        }
        if (node?.signatures && node.signatures.length) {
            node.signatures.forEach((item) => {
                const map = this.getReferenceTypes(item, originMap);
                addValueByMap(map);
            });
        }
        if (node?.parameters && node?.parameters.length) {
            node.parameters.forEach((item) => {
                const map = this.getReferenceTypes(item, originMap);
                addValueByMap(map);
            });
        }
        if (node?.typeParameter && node?.typeParameter.length) {
            node.typeParameter.forEach((item) => {
                const map = this.getReferenceTypes(item, originMap);
                addValueByMap(map);
            });
        }
        if (node?.type?.types) {
            node.type.types.forEach((item) => {
                if (item?.id >= 0) {
                    const map = this.getReferenceTypes(item, originMap);
                    addValueByMap(map);
                } else if (item?.declaration) {
                    // 特殊情况
                    const map = this.getReferenceTypes(item.declaration, originMap);
                    addValueByMap(map);
                }
            });
        }
        if (node?.type?.typeArguments) {
            node.type.typeArguments.forEach((item) => {
                if (item?.id >= 0) {
                    const map = this.getReferenceTypes(item, originMap);
                    addValueByMap(map);
                } else if (item?.declaration) {
                    // 特殊情况
                    const map = this.getReferenceTypes(item.declaration, originMap);
                    addValueByMap(map);
                }
            });
        }
        if (node?.type?.declaration) {
            // 特殊情况
            const map = this.getReferenceTypes(node?.type?.declaration, originMap);
            addValueByMap(map);
        }
        // 特殊情况
        if (node?.type?.elementType) {
            const map = this.getReferenceTypes(
                this.allNodeMap.get(node?.type?.elementType?.id),
                originMap,
            );
            addValueByMap(map);
        }
        return typeMap;
    }

    /**
     * 获取所有节点
     */
    getAllNodeMap(node) {
        const map = new Map();
        const mergeMap = (sourceMap) => {
            sourceMap.forEach((value, key) => {
                map.set(key, value);
            });
        };
        if (node?.children && node?.children.length) {
            node.children.forEach((item) => {
                const nodeMap = this.getAllNodeMap(item);
                mergeMap(nodeMap);
            });
        }
        if (node?.signatures && node.signatures.length) {
            node.signatures.forEach((item) => {
                const nodeMap = this.getAllNodeMap(item);
                mergeMap(nodeMap);
            });
        }
        if (node?.parameters && node?.parameters.length) {
            node.parameters.forEach((item) => {
                const nodeMap = this.getAllNodeMap(item);
                mergeMap(nodeMap);
            });
        }
        if (node?.typeParameter && node?.typeParameter.length) {
            node.typeParameter.forEach((item) => {
                const nodeMap = this.getAllNodeMap(item);
                mergeMap(nodeMap);
            });
        }
        // 特殊情况
        if (node?.type?.declaration) {
            const nodeMap = this.getAllNodeMap(node?.type?.declaration);
            mergeMap(nodeMap);
        }
        if (node?.id >= 0) {
            map.set(node.id, node);
        }
        return map;
    }

    /**
     * 获取类型
     * @param {{type: string, elementType: object, types: []}} type
     * @returns
     */
    getTypeName(type) {
        if (!type) {
            return '';
        }
        let typeDesc = '';
        switch (type.type) {
            case 'literal': {
                typeDesc = type.value;
                // typeDesc = Object.prototype.toString.call(type.value);
                // typeDesc = typeDesc.substring(
                //     typeDesc.lastIndexOf(' ') + 1,
                //     typeDesc.lastIndexOf(']'),
                // );
                break;
            }
            case 'intrinsic': {
                typeDesc = type.name;
                break;
            }
            case 'reference': {
                typeDesc = type.name;
                if (type?.typeArguments && type?.typeArguments.length) {
                    typeDesc =
                        type?.typeArguments.reduce((pre, item, currentIndex) => {
                            const typeName = this.getTypeName(item);
                            if (currentIndex === type.typeArguments.length - 1) {
                                return pre + typeName;
                            }
                            return pre + typeName + ',';
                        }, `${type.name}<`) + '>';
                }
                break;
            }
            case 'array': {
                typeDesc = `Array<${this.getTypeName(type.elementType)}>`;
                break;
            }
            case 'union': {
                let pre = '';
                type.types.forEach((item, index) => {
                    if (index === 0) {
                        pre = this.getTypeName(item);
                        return;
                    }
                    pre = pre + ' | ' + this.getTypeName(item);
                });
                typeDesc = pre;
                break;
            }
            // intersection TODO
            // reflection TODO
            // indexedAccess indexType
            default:
                break;
        }
        return typeDesc;
    }

    /**
     * 解析枚举类型
     * @returns {{name: string, type: string, comment: string, children: {name: string, defaultValue: string, comment: string, type: string}, sources: string}}
     */
    parseEnum(child) {
        const self = this;
        const comment = this.getComment(child);
        const sources = this.getSources(child);
        const children =
            child.children &&
            child.children.map((item) => {
                return {
                    name: item.name,
                    // TODO 字符串类型的枚举
                    type: TYPE_DESC.NUMBER,
                    defaultValue: item.defaultValue,
                    comment: self.getComment(item),
                };
            });

        return {
            name: child.name,
            type: TYPE_DESC.ENUM,
            comment,
            children,
            sources,
            node: child,
        };
    }

    /**
     * 解析函数
     * @param {object} child
     * @returns
     */
    parseMethod(child) {
        const self = this;
        const name = child.name;
        const comment = this.getComment(child);
        const sources = this.getSources(child);
        const isOptional = this.getIsOptional(child);
        let parametersContent = '';
        const parameters = child?.signatures[0]?.parameters?.map((param, currentIndex, array) => {
            const prop = self.parseProperty(param);
            parametersContent +=
                `${prop.name}: ${prop.type}` + (currentIndex !== array.length - 1 ? ', ' : '');
            return prop;
        });
        const returns = this.getTypeName(child?.signatures[0].type);
        const defaultValue = `${name}(${parametersContent}): ${returns}`;
        return {
            name,
            type: TYPE_DESC.METHOD,
            defaultValue,
            comment,
            sources,
            isOptional,
            parameters,
            returns,
            node: child,
        };
    }

    /**
     * 解析属性
     * @param {object} child
     */
    parseProperty(child) {
        const name = child.name;
        const comment = this.getComment(child);
        const sources = this.getSources(child);
        const isOptional = this.getIsOptional(child);
        const type = child.type;
        const typeName = this.getTypeName(type);
        return {
            name,
            comment,
            sources,
            type: typeName,
            isOptional,
            node: child,
        };
    }

    /**
     * 解析变量
     * @param {object} child
     * @returns
     */
    parseVariable(child) {
        const name = child.name;
        const comment = this.getComment(child);
        const sources = this.getSources(child);
        const isOptional = this.getIsOptional(child);
        const type = child.type;
        // TODO: 目前只支持基础类型解析 reflection
        const typeDesc = this.getTypeName(type);
        return {
            name,
            comment,
            sources,
            type: typeDesc,
            isOptional,
            defaultValue: child.defaultValue,
            node: child,
        };
    }

    /**
     * 解析type类型
     * @param {object} child
     */
    parserType(child) {
        const name = child.name;
        const comment = this.getComment(child);
        const sources = this.getSources(child);
        const isOptional = this.getIsOptional(child);
        let method = null;

        let variable = null;
        // TODO 还有其他可能
        if (child.type.type === 'reflection') {
            method = this.parseMethod(child.type.declaration);
        } else if (child.type.type === 'array') {
            variable = this.parseVariable(child);
        } else if (child.type.type === 'reference') {
            variable = this.parseVariable(child);
        } else if (child.type.type === 'union') {
            variable = this.parseVariable(child);
        }
        return {
            name,
            type: TYPE_DESC.TYPE,
            comment,
            sources,
            isOptional,
            method,
            variable,
            node: child,
        };
    }

    /**
     * 解析接口
     * @param {object} child
     * @returns
     */
    parseInterface(child) {
        const self = this;
        const name = child.name;
        const comment = this.getComment(child);
        const sources = this.getSources(child);
        const children = child.children.map((item) => {
            if (item.kindString === 'Property') {
                return {
                    kind: 'Property',
                    ...self.parseProperty(item),
                };
            } else if (item.kindString === 'Method') {
                return {
                    ...self.parseMethod(item),
                };
            } else {
                return item;
            }
        });
        return {
            id: child.id,
            name,
            type: TYPE_DESC.INTERFACE,
            comment,
            sources,
            children,
            node: child,
        };
    }

    /**
     * 解析
     */
    parse() {
        if (!this.typesJson) {
            return;
        }
        // const self = this;
        this.parseGroup();
        this.allNodeMap = this.getAllNodeMap(this.typesJson);
        this.parseCase(this.typesJson);
    }

    parseGroupByNode(node) {
        let enumerationsId = [];
        let interfacesId = [];
        let typeAliasesId = [];
        let variablesId = [];
        let functionsId = [];
        let modulesId = [];
        node.groups &&
            node.groups.forEach((group) => {
                switch (group.title) {
                    case Enumerations: {
                        enumerationsId = group.children;
                        break;
                    }
                    case Interfaces: {
                        interfacesId = group.children;
                        break;
                    }
                    case TypeAliases: {
                        typeAliasesId = group.children;
                        break;
                    }
                    case Variables: {
                        variablesId = group.children;
                        break;
                    }
                    case Functions: {
                        functionsId = group.children;
                        break;
                    }
                    case Modules: {
                        modulesId = group.children;
                        break;
                    }
                    default:
                        break;
                }
            });
        return {
            enumerationsId,
            interfacesId,
            typeAliasesId,
            variablesId,
            functionsId,
            modulesId,
        };
    }

    parseCase(root) {
        const self = this;
        const group = this.parseGroupByNode(root);
        root.children &&
            root.children.forEach((child) => {
                // enum
                if (group.enumerationsId.includes(child.id)) {
                    const enumObj = self.parseEnum(child);
                    this.enumerations.push(enumObj);
                }
                // interface
                if (group.interfacesId.includes(child.id)) {
                    const interfaceObj = self.parseInterface(child);
                    this.interfaces.push(interfaceObj);
                }
                // type
                if (group.typeAliasesId.includes(child.id)) {
                    const typeObj = self.parserType(child);
                    this.typeAliases.push(typeObj);
                }
                // var
                if (group.variablesId.includes(child.id)) {
                    const varObj = self.parseVariable(child);
                    self.variables.push(varObj);
                }
                // function
                if (group.functionsId.includes(child.id)) {
                    const methodObj = self.parseMethod(child);
                    self.functions.push(methodObj);
                }
                if (group.modulesId.includes(child.id)) {
                    this.parseCase(child);
                    // child.children.forEach(())

                    // console.dir(child, { depth: null });
                    // const typeObj = self.parserType(child);
                    // console.dir(typeObj,  {
                    //   depth: null
                    // })
                    // this.typeAliases.push(typeObj);
                }
            });
    }
}

module.exports = {
    TypesContext,
};
