/**
 * @type  { import('@babel/traverse').Node }
 */
const getDeclarations = (node) => {
    if (node.declarations && node.declarations.length) {
        return node.declarations.map((item) => item?.id?.name);
    }
    return [];
};

/**
 * @type  { import('@babel/traverse').Node }
 */
const getDeclarationFirst = (node) => {
    const list = getDeclarations(node);
    return list.length ? list[0] : '';
};

module.exports = {
    getDeclarations,
    getDeclarationFirst,
};
