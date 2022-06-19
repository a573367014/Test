/**
 * @param {import('../types/index').IComments} comments
 */
const getDefaultComment = (comments) => {
    if (comments.default.length === 0) {
        return '';
    }
    const desc = comments.default.reduce((pre, value) => {
        return pre + value;
    });
    return desc;
};

module.exports = {
    getDefaultComment,
};
