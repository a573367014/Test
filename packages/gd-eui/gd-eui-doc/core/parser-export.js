const { ParserBaseContext } = require('./parser-base');
const bt = require('@babel/types');

class ParserExportContext extends ParserBaseContext {
    /**
     * @type {string[]}
     */
    exportName = [];
    /**
     * @param {string} script
     */
    parser(script) {
        const content = script.substring(this.node.start, this.node.end);
        this.content = content;
        if (this.node.exportKind === 'type') {
            this.exportName.push(this.node?.declaration.id.name);
            return;
        }
        if (bt.isFunctionDeclaration(this.node?.declaration)) {
            this.exportName.push(this.node?.declaration.id.name);
        } else if (bt.isVariableDeclaration(this.node?.declaration)) {
            this.node?.declaration.declarations.forEach((element) => {
                this.exportName.push(element.id.name);
            });
        }
    }
}

module.exports = {
    ParserExportContext,
};
