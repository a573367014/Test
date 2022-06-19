const { ParserBaseContext } = require('./parser-base');

class ParsePropertyContext extends ParserBaseContext {
    name = '';
    type = '';
    defaultValue = '';
    require = false;
    /**
     * @type {import('../types/index').IComments}
     */
    comments = {};

    /**
     * @param {string} script
     */
    parser(script) {
        this.content = script.substring(this.node.start, this.node.end);
        const name = this.node.key.name;
        const type = this.getTypeByNode(this.node, script);
        let defaultValue = this.getValueByNodePath(this.path);
        if (type === 'Null') {
            defaultValue = null;
        } else if (type === 'undefined') {
            defaultValue = undefined;
        }
        const comments = this.getComments(this.node);
        this.name = name;
        this.type = type;
        this.defaultValue = defaultValue;
        this.comments = comments;
        if (this.node.value.type === 'ObjectExpression') {
            const obj = this.getParamsByObjectContent(this.path.get('value').toString());
            this.require = obj.require ? Boolean(obj.require) : false;
        }
    }
}

module.exports = {
    ParsePropertyContext,
};
