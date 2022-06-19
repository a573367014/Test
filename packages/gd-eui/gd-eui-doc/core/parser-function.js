const { ParserBaseContext } = require('./parser-base');
const { getParamType } = require('../utils/get-params-type');
const { getCommentsProps } = require('../utils/get-comments-props');

class ParserFunctionContext extends ParserBaseContext {
    name = '';
    /**
     * @type {import('../types/index').IParamComment[]}
     */
    params = [];
    returnType = '';
    /**
     * @type {import('../types/index').IComments}
     */
    comments = {};
    functionStr = '';
    parser(script) {
        const content = script.substring(this.node.start, this.node.end);
        this.content = content;
        const name = this.node?.id?.name || '';
        const params = [];
        const comments = this.getComments(this.node);
        const commentParams = getCommentsProps(comments, 'param');
        // 解析函数的参数
        this.node.params.forEach((node) => {
            const type = getParamType(node, script);
            const name = node.name;
            const paramsStr = script.substring(node.start, node.end);
            // 取参数描述
            const commentParam = commentParams.find((item) => {
                return name === item.name;
            });
            params.push({
                name,
                type,
                paramsStr,
                desc: commentParam ? commentParam.desc : '',
            });
        });

        let returnType = getParamType(this.node?.returnType, script);
        if (returnType.length === 0) {
            returnType = 'void';
        }
        const functionStr = `${name}(${params.reduce((total, item, currentIndex) => {
            if (currentIndex === params.length - 1) {
                return total + item.paramsStr;
            }
            return total + item.paramsStr + ',';
        }, '')}): ${returnType}`;

        this.name = name;
        this.params = params;
        this.returnType = returnType;
        this.comments = comments;
        this.functionStr = functionStr;
    }
}

module.exports = {
    ParserFunctionContext,
};
