const compiler = require('vue-template-compiler/build');

/**
 * @param {String} fileContent vue文件内容
 */
const spliceVue = (fileContent) => {
    const json = compiler.parseComponent(fileContent);
    return {
        template: {
            content: json.template.content,
            start: json.template.start,
            end: json.template.end,
        },
        script: {
            content: json.script.content,
            lang: json.script.attrs || 'js',
            start: json.script.start,
            end: json.script.end,
        },
    };
};

module.exports = {
    spliceVue,
};
