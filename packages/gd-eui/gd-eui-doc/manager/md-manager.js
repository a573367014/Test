class MdManager {
    _checkBlankContent(content) {
        return !content || !content.length;
    }

    /**
     * 获取H1标题
     * @param {string} title
     * @returns {string}
     */
    getH1(title) {
        if (this._checkBlankContent(title)) {
            return '';
        }
        return `# ${title}\n`;
    }

    /**
     * 获取H3标题
     * @param {string} title
     * @returns {string}
     */
    getH3(title) {
        if (this._checkBlankContent(title)) {
            return '';
        }
        return `### ${title}\n`;
    }

    /**
     * 获取自定义H标题
     * @param {string} title
     * @returns {string}
     */
    getH(title, count = 1) {
        if (this._checkBlankContent(title)) {
            return '';
        }
        return (
            new Array(count).fill(0).reduce((pre) => {
                return pre + '#';
            }, '') + ` ${title}\n`
        );
    }

    /**
     * 获取普通文本
     * @param {string} span
     * @returns {string}
     */
    getSpan(span) {
        if (this._checkBlankContent(span)) {
            return '';
        }
        return `${span}\n`;
    }

    /**
     * 获取无序列表
     * @param {strong[]} dots
     * @returns {string}
     */
    getDots(dots) {
        if (!dots) {
            return '';
        }
        return dots.reduce((pre, value) => {
            return pre + `- ${value}\n`;
        }, '');
    }

    /**
     * 获取一个table
     * @param {string[]} titles
     * @param {string[][]} dataList
     */
    getTable(titleList, dataList) {
        const titleListContent =
            titleList.reduce((pre, value) => {
                return pre + `| ${value} `;
            }, '') + '|\n';
        const titlesLine =
            titleList.reduce((pre) => {
                return pre + `| :-- `;
            }, '') + '|\n';
        let content = `${titleListContent}${titlesLine}`;
        dataList.map((rowList) => {
            const rowListContent =
                rowList.reduce((pre, value) => {
                    let filterValue = value;
                    // 转义处理
                    if (typeof filterValue === 'string') {
                        filterValue = filterValue.replace(/\|/g, `\\|`);
                        filterValue = filterValue.replace(/\n/g, '');
                    }
                    return pre + `| ${filterValue || '-'} `;
                }, '') + '|\n';
            content += rowListContent;
        });
        return content + '\n';
    }
}

module.exports = {
    MdManager,
};
