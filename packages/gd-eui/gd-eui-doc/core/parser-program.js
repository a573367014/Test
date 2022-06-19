const { ParserBaseContext } = require('./parser-base');

class ParserProgramContext extends ParserBaseContext {
    /**
     * @type {import('../types/index').IComments[]}
     */
    commentsList = [];
    /**
     * @param {import('@babel/traverse').NodePath} path
     */
    constructor(path) {
        super();
        this.path = path;
    }

    /**
     * @param {string} script
     */
    parser(script) {
        this.content = script.substring(this.path.start, this.path.end);
        const list = [];
        this.path.comments.forEach((comment) => {
            if (comment.type === 'CommentBlock') {
                const comments = this.getCommentByComments([comment]);
                list.push(comments);
            }
        });
        this.commentsList = list;
    }
}

module.exports = {
    ParserProgramContext,
};
