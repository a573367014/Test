/*
 * @Author: lijianzhang
 * @Date: 2018-10-24 23:35:31
 * @Last Modified by: lijianzhang
 * @Last Modified time: 2018-12-21 03:18:38
 */
const path = require('path');

const { createDefaultCompiler, compilerSFC, assembleSFC } = require('../../../../scripts/compiler-sfc');

const compiler = createDefaultCompiler({
    template: {
        optimizeSSR: false
    }
});

module.exports = () => ({
    name: 'demo-container',
    enhanceAppFiles: [path.resolve(__dirname, 'client.js')],
    extendMarkdown(md) {
        md.use(require('markdown-it-container'), 'demo', {
            render(tokens, idx) {
                if (tokens[idx].nesting === 1) {
                    let content = '';
                    let i = 1;
                    while (tokens[idx + i].type !== 'container_demo_close') {
                        content += tokens[idx + i].content;
                        tokens[idx + i].content = '';
                        i += 1;
                    }

                    const result = compilerSFC(compiler, content, 'demo-block');
                    // 当为ssr环境时, 去掉css
                    if (result.styles) {
                        result.styles.forEach(s => s.map = void 0);
                    }

                    let js = assembleSFC(compiler, 'demo-block', result);

                    // 对html转义处理, 不然模板会报错
                    js = js.replace(/export\s+default\s+__vue_normalize__/g,'return __vue_normalize__').replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;'} [c]));
                    const code = md.render('```html\n' + content + '\n```\n');
                    let desc = tokens[idx].info.trim().match(/^demo\s*(.*)$/)[1];
                    if (desc) {
                        desc = md.render(tokens[idx].info.trim().match(/^demo\s*(.*)$/)[1]).html;
                    }
                    return `
                            <demo-block vue="${js}">
                            <div slot="highlight">${code.html}</div>
                            ${desc.length ? `<div slot="desc">${desc}</div>` : ''}
                            <div slot="source"><!--`
                }
                return ' --></div></demo-block>\n';
            }
        });
    }
})
