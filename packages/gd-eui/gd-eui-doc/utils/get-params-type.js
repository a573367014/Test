/**
 * 获取节点类型
 * @param { import('@babel/traverse').Node } node
 * @param {string} script
 * @returns {string}
 */
const getParamType = (node, script) => {
    if (!node?.typeAnnotation) {
        return '';
    }
    if (node.typeAnnotation?.type === 'TSTypeAnnotation') {
        return getParamType(node.typeAnnotation, script);
    } else {
        return script.substring(node.typeAnnotation.start, node.typeAnnotation.end).trim();
    }
};

module.exports = {
    getParamType,
};
