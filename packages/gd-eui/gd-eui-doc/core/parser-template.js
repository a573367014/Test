const compiler = require('vue-template-compiler/build');

class ParserTemplateContext {
    template = '';
    /**
     * @type {import('vue-template-compiler').ASTElement}
     */
    ast = {};

    /**
     * @type {import('../types/index').ISlotData[]}
     */
    slotList = [];

    constructor(template) {
        this.template = template;
        /**
         * @type {import('vue-template-compiler').CompiledResult}
         */
        const res = compiler.compile(template, {
            comments: true,
        });
        if (!res.ast) {
            console.error('template parser fail!');
            return;
        }
        this.ast = res.ast;
        this.parser(res.ast);
    }

    /**
     *
     * @param {import('vue-template-compiler').ASTElement} ast
     */
    parserSlot(ast) {
        const list = [];
        const parent = ast.parent;
        const children = ast.children;
        // 找到tag
        if (ast.type === 1 && ast.tag === 'slot') {
            const slotName = ast.slotName;
            const index = parent.children.findIndex((item) => {
                return item === ast;
            });
            const commentNode = parent.children
                .slice(0, index)
                .reverse()
                .find((item) => {
                    if (item.type === 3 && item.isComment) {
                        return true;
                    }
                    return false;
                });

            if (commentNode) {
                list.push({
                    name: slotName,
                    desc: commentNode.text.trim(),
                });
            }
        }
        children &&
            children.forEach((child) => {
                list.push(...this.parserSlot(child));
            });
        return list;
    }

    /**
     *
     * @param {import('vue-template-compiler').ASTElement} ast
     */
    parser(ast) {
        const slotList = this.parserSlot(ast);
        this.slotList = slotList;
    }
}

module.exports = {
    ParserTemplateContext,
};
