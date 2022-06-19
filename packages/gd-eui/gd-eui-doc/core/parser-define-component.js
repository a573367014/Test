const { ParserBaseContext } = require('./parser-base');
const { ParsePropertyContext } = require('./parser-property');
const { ParserEmitsContext } = require('./parser-emits');
const { ParserFunctionContext } = require('./parser-function');
const { getDeclarationFirst } = require('../utils/get-declarations');
const { getCommentsProps } = require('../utils/get-comments-props');

const PROPERTY_NAME = 'name';
const PROPERTY_PROPS = 'props';
const PROPERTY_DATA = 'data';
const PROPERTY_EMITS = 'emits';
const PROPERTY_SETUP = 'setup';

class ParserDefineComponentContext extends ParserBaseContext {
    /**
     * @type {ParsePropertyContext[]}
     */
    propertyContextList = [];
    /**
     * @type {ParserEmitsContext[]}
     */
    emitsContextList = [];
    /**
     * @type {ParserFunctionContext[]}
     */
    functionContextList = [];

    /**
     * @type { import('@babel/traverse').NodePath }
     */
    hasCommentApiByPath(path) {
        // 有加注释
        if (!this.hasCommentsByPath(path)) {
            return false;
        }
        const comment = this.getComments(path.node);
        // @function标识
        if (!comment?.function) {
            return false;
        }
        return true;
    }

    /**
     * @param {string} script
     */
    parser(script) {
        const content = script.substring(this.node.start, this.node.end);
        this.content = content;
        const self = this;
        this.path.traverse({
            ObjectProperty(path) {
                if (path.parentPath.parentPath !== self.path) {
                    return;
                }
                const keyName = path.node.key.name;
                if (keyName === PROPERTY_NAME) {
                    return;
                }
                /**
                 * 解析: props
                 */
                if (keyName === PROPERTY_PROPS) {
                    const valuePath = path.get('value');
                    path.traverse({
                        ObjectProperty(childPath) {
                            if (childPath.parentPath === valuePath) {
                                const propertyParse = new ParsePropertyContext(childPath);
                                propertyParse.parser(script);
                                self.propertyContextList.push(propertyParse);
                            }
                        },
                    });
                    return;
                }
                if (keyName === PROPERTY_DATA) {
                    return;
                }
                /**
                 * 解析: emit
                 */
                if (keyName === PROPERTY_EMITS) {
                    const valuePath = path.get('value');
                    path.traverse({
                        StringLiteral(childPath) {
                            if (childPath.parentPath !== valuePath) {
                                return;
                            }
                            const emitsParser = new ParserEmitsContext(childPath);
                            emitsParser.parser(script);
                            self.emitsContextList.push(emitsParser);
                        },
                    });
                }
            },
            ObjectMethod(path) {
                self.parserSetupMethod(path, self.path, script);
            },
        });
    }

    /**
     * @param  { import('@babel/traverse').NodePath } path
     * @param  { import('@babel/traverse').NodePath } originPath
     * @param {string} script
     */
    parserSetupMethod(path, originPath, script) {
        const self = this;
        // 找setup方法
        if (path.parentPath.parentPath !== originPath) {
            return;
        }
        if (path.node.key.name !== PROPERTY_SETUP) {
            return;
        }

        path.traverse({
            /**
             * 解析: function函数定义
             */
            FunctionDeclaration(childPath) {
                if (!self.hasCommentApiByPath(childPath)) {
                    return;
                }
                const parserFunction = new ParserFunctionContext(childPath);
                parserFunction.parser(script);
                self.functionContextList.push(parserFunction);
            },
            /**
             * 解析: 变量形式的函数定义
             */
            VariableDeclaration(childPath) {
                if (!self.hasCommentApiByPath(childPath)) {
                    return;
                }
                const name = getDeclarationFirst(childPath.node);
                const comments = self.getComments(childPath.node);
                const commentParams = getCommentsProps(comments, 'param');

                let isFirst = false;
                const parserFun = (funChildPath) => {
                    if (!isFirst) {
                        const functionContext = new ParserFunctionContext(funChildPath);
                        functionContext.parser(script);
                        functionContext.name = name;
                        functionContext.comments = comments;
                        functionContext.params.forEach((param) => {
                            if (param.desc && param.desc.length) {
                                return;
                            }
                            const commentParam = commentParams.find((item) => {
                                return param.name === item.name;
                            });
                            param.desc = commentParam ? commentParam.desc : '';
                        });
                        self.functionContextList.push(functionContext);
                        isFirst = true;
                    }
                };
                childPath.traverse({
                    // 箭头函数
                    ArrowFunctionExpression(funChildPath) {
                        parserFun(funChildPath);
                    },
                    // function函数
                    FunctionExpression(funChildPath) {
                        parserFun(funChildPath);
                    },
                });
            },
        });
    }
}

module.exports = {
    ParserDefineComponentContext,
};
