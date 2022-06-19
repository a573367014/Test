const bt = require('@babel/types');
const commentRE = /\s*\*\s{1}/g;

const leadRE = /^@(\w+)\b/;

class ParserBaseContext {
    /**
     * @type  { import('@babel/traverse').Node }
     */
    node = {};
    /**
     * @type { import('@babel/traverse').NodePath }
     */
    path = {};
    /**
     * @type {string}
     */
    content = '';

    /**
     * 初始化
     * @param {import('@babel/traverse').NodePath} path
     */
    constructor(path) {
        this.path = path;
        this.node = path?.node;
    }

    /**
     * @param {string} literal
     */
    literalToType(literal) {
        const type = literal
            .replace('Literal', '')
            .replace('Expression', '')
            .replace('Numeric', 'Number');
        return type;
    }

    /**
     * @param { import('@babel/traverse').Node  } node
     * @returns {string}
     */
    getLiteralValue(node) {
        let data = '';
        if (bt.isStringLiteral(node) || bt.isBooleanLiteral(node) || bt.isNumericLiteral(node)) {
            data = node.value.toString();
        }
        return data;
    }

    /**
     * @param {import('@babel/traverse').NodePath} path
     */
    hasCommentsByPath(path) {
        return path?.node?.leadingComments;
    }

    /**
     * 对象字符串解析为对象
     * @param {string} content
     */
    getParamsByObjectContent(content) {
        content = content.substring(content.indexOf('{') + 1, content.lastIndexOf('}')).trim();
        const stackChar = [];
        const paramContentList = [];
        let starIndex = 0;
        for (let index = 0; index < content.length; index++) {
            const char = content.charAt(index);
            if (char === '<' || char === '[' || char === '(' || char === '{') {
                stackChar.push(char);
            }
            if (
                (char === '>' && stackChar[stackChar.length - 1] === '<') ||
                (char === ']' && stackChar[stackChar.length - 1] === '[') ||
                (char === ')' && stackChar[stackChar.length - 1] === '(') ||
                (char === '}' && stackChar[stackChar.length - 1] === '{')
            ) {
                stackChar.pop();
            }
            if (
                (char === ',' && stackChar.length === 0) ||
                (index === content.length - 1 && stackChar.length === 0)
            ) {
                paramContentList.push(content.substring(starIndex, index + 1).trim());
                starIndex = index + 1;
            }
        }
        const paramsList = paramContentList.map((item) => {
            const obj = item.trim();
            const pl = [
                obj.substring(0, obj.indexOf(':')),
                obj.substring(obj.indexOf(':') + 1, obj.length),
            ];
            return {
                [pl[0]]: pl[1].trim(),
            };
        });
        const obj = Object.assign({}, ...paramsList);
        return obj;
    }

    /**
     * 获取节点类型
     * @param { import('@babel/traverse').Node  } node
     * @param { string } script
     */
    getTypeByNode(node, script) {
        if (bt.isObjectMethod(node) || bt.isArrowFunctionExpression(node.value)) return 'Function';
        const dataNode = node.value;
        if (bt.isIdentifier(dataNode)) return dataNode.name;
        if (bt.isAssignmentExpression(dataNode) || bt.isAssignmentPattern(dataNode)) {
            if (bt.isIdentifier(dataNode.left)) {
                return dataNode.left.name;
            }
        }
        if (
            bt.isLiteral(dataNode) ||
            (bt.isExpression(dataNode) && !bt.isBinaryExpression(dataNode))
        ) {
            if (dataNode.type === 'ObjectExpression') {
                const typeStr = script.substring(
                    dataNode.properties[0].value.start,
                    dataNode.properties[0].value.end,
                );
                if (typeStr.indexOf('PropType') !== -1) {
                    return typeStr.substring(typeStr.indexOf('<') + 1, typeStr.lastIndexOf('>'));
                }
                return typeStr;
            }
            if (dataNode.type === 'MemberExpression') {
                return 'MemberExpression';
            }
            return this.literalToType(dataNode.type);
        }
        return '';
    }

    /**
     * 获取节点值
     * @param {import('@babel/traverse').NodePath} nodePath
     */
    getValueByNodePath(nodePath) {
        let dataNode = nodePath.node.value;

        if (dataNode.type === 'ObjectExpression') {
            dataNode.properties.forEach((property) => {
                if (property.key.name === 'default') {
                    dataNode = property.value;
                }
            });
        }

        // 数组直接返回值
        if (bt.isArrayExpression(nodePath.node.value)) {
            return nodePath.get('value').toString();
        }

        // 基础类型
        if (bt.isLiteral(dataNode)) {
            return this.getLiteralValue(dataNode);
        }
        if (bt.isAssignmentExpression(dataNode) || bt.isAssignmentPattern(dataNode)) {
            if (bt.isLiteral(dataNode.right)) {
                return this.getLiteralValue(dataNode.right);
            }
        }

        // 子节点的值
        const valueString = nodePath.get('value').toString();
        if (nodePath.node.value.type === 'ObjectExpression') {
            const obj = this.getParamsByObjectContent(valueString);
            if (obj.default) {
                return obj.default;
            }
        }
        return '';

        // 判断是否是在全局作用域内存在
        // let hasInBindings = Object.keys(nodePath.scope.bindings).find((type) => {
        //   return valueString.indexOf(type) !== -1;
        // });
        // let hasInGlobals = Object.keys(nodePath.scope.globals).find((type) => {
        //   return valueString.indexOf(type) !== -1;
        // });
        // if (hasInBindings || hasInGlobals) {
        //   return valueString;
        // }
        // return valueString;
        // return "";
    }

    /**
     * @param { import('@babel/traverse').Node  } node
     */
    isCommentLine(node) {
        return node.type === 'CommentLine';
    }

    /**
     * @param { import('@babel/traverse').Node  } node
     */
    isCommentBlock(node) {
        return node.type === 'CommentBlock';
    }

    isCodeBlockDeclaration(value) {
        return value.includes('```');
    }

    /**
     * @param {string[]} comments
     */
    filterBlockComments(comments) {
        let codeBlockStarted;
        return comments
            .map((t) => {
                if (this.isCodeBlockDeclaration(t) && codeBlockStarted) codeBlockStarted = false;
                const res = codeBlockStarted ? t : t.trim();
                if (this.isCodeBlockDeclaration(t) && typeof codeBlockStarted === 'undefined')
                    codeBlockStarted = true;
                return res;
            })
            .filter((t) => t);
    }

    /**
     * @returns {import('../types/index').IComments}
     */
    getCommentByComments(commentNodes) {
        const res = {
            default: [],
        };
        let comments = '';
        let matchs = '';
        let codeBlockStarted = false;
        const self = this;
        commentNodes.forEach((node) => {
            if (this.isCommentLine(node)) {
                if (self.isCodeBlockDeclaration(node.value) && codeBlockStarted)
                    codeBlockStarted = false;
                comments = codeBlockStarted ? node.value.replace(/^\s/, '') : node.value.trim();
                if (
                    self.isCodeBlockDeclaration(node.value) &&
                    typeof codeBlockStarted === 'undefined'
                )
                    codeBlockStarted = true;
                matchs = comments.match(leadRE);
                if (matchs) {
                    const key = matchs[1];
                    res[key] = res[key] || [];
                    res[key].push(comments.replace(leadRE, '').trim());
                } else {
                    res.default.push(comments);
                }
            } else if (this.isCommentBlock(node)) {
                comments = node.value.replace(commentRE, '\n').replace(/^\*/, '').split('\n');
                comments = this.filterBlockComments(comments);
                let currentKey = 'default';
                comments.forEach((c) => {
                    if ((matchs = c.match(leadRE))) {
                        currentKey = matchs[1];
                        res[currentKey] = res[currentKey] || [];
                        res[currentKey].push(c.replace(leadRE, '').trim());
                    } else {
                        res.default.push(c);
                    }
                });
            }
        });
        Object.keys(res).forEach((k) => {
            res[k] = res[k].filter((comment) => !comment.includes('eslint-disable'));
        });
        return res;
    }

    /**
     * @returns {import('../types/index').IComments}
     */
    getComments(node, trailing = false) {
        const res = {
            default: [],
        };
        const commentNodes = trailing ? node.trailingComments || [] : node.leadingComments || [];
        if (!commentNodes || !commentNodes.length) return res;
        return this.getCommentByComments(commentNodes);
    }
}

module.exports = {
    ParserBaseContext,
};
