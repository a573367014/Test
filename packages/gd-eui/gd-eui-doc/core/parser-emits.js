const { ParserBaseContext } = require('./parser-base');
const { getCommentsProps } = require('../utils/get-comments-props');

class ParserEmitsContext extends ParserBaseContext {
    name = '';
    desc = '';
    /**
     * @type {import('../types/index').IParamComment[]}
     */
    params = [];
    /**
     * @param {string} script
     */
    parser(script) {
        const content = script.substring(this.node.start, this.node.end);
        this.content = content;
        const name = this.node.value;
        const comments = this.getComments(this.node);
        const desc = comments.default.reduce((pre, value) => {
            return pre + value;
        }, '');
        const params = getCommentsProps(comments, 'param');
        this.name = name;
        this.desc = desc;
        this.params = params;
    }
}

module.exports = {
    ParserEmitsContext,
};
