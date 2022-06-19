/*
 * @Author: lijianzhang
 * @Date: 2018-10-24 23:35:09
 * @Last Modified by: wenxing
 * @Last Modified time: 2021-11-03 23:46
 */
const path = require('path');
const { GdEuiDoc } = require('../../../../gd-eui-doc/index');

module.exports = (options) => {
    return {
        name: `vue-plugin-${options.name}`,
        extendMarkdown(md) {
            md.use(require('markdown-it-container'), options.name, {
                render: function (tokens, idx) {
                    var m = tokens[idx].info.trim().match(new RegExp(`^${options.name}\s*(.*)$`));
                    if (tokens[idx].nesting === 1) {
                        console.log('complier', m[1].trim());
                        const gdeuiDoc = new GdEuiDoc();
                        gdeuiDoc.load(
                            path.resolve(options.baseDir, m[1].trim()),
                            path.resolve(__dirname, '../../../../tsconfig.json'),
                            // (source) => {
                            //     if (source.indexOf('/src/types') === -1) {
                            //         return true;
                            //     }
                            //     return false;
                            // },
                        );
                        let content = gdeuiDoc.getMdForTitles();
                        content += gdeuiDoc.getMdForMarkdowns();
                        content += '### Props\n\n';
                        content += gdeuiDoc.getMdForVueProperties();
                        content += '### Emits\n\n';
                        content += gdeuiDoc.getMdForEmits();
                        content += '### Slots\n\n';
                        content += gdeuiDoc.getMdForTemplateSlots();
                        content += '### Api\n\n';
                        content += gdeuiDoc.getMdForFunction();
                        content += '### 类型说明\n\n';
                        content += gdeuiDoc.getMdForTypes();
                        content = content.replace(/</g, '&lt;');
                        content = content.replace(/>/g, '&gt;');
                        return `${md.render(content).html}<!-- `;
                    }
                    return `-->`;
                },
            });
        },
    };
};
