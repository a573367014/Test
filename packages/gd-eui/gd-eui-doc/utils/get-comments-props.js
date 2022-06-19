/**
 * 查询是否存在类型定义 {xx}
 * @param {string} param
 * @returns {{string: number, end: number, content: string} | null} 返回对应类型
 */
const checkHasType = (param) => {
    let hasType = false;
    let stack = 0;
    let start = 0;
    let end = 0;
    for (let index = 0; index < param.length; index++) {
        const char = param.charAt(index);
        if (char !== ' ' && char !== '{' && !hasType) {
            return null;
        }
        if (char === '{' && !hasType) {
            hasType = true;
            start = index + 1;
        }
        if (char === '{') {
            stack++;
        }
        if (char === '}') {
            stack--;
            end = index;
        }
    }
    if (hasType && stack !== 0) {
        hasType = false;
    }
    if (!hasType) {
        return null;
    }
    return {
        start,
        end,
        content: param.substring(start, end),
    };
};

/**
 * 解析comment属性值
 * @param {import('../types/index').IComments} comment
 * @param {string} prop
 * @returns {import('../types/index').ITypeComment[]}
 */
const getCommentsProps = (comment, prop) => {
    if (!comment[prop]) {
        return [];
    }
    const params = [];
    comment?.[prop].forEach((param) => {
        let type = '';
        let name = '';
        let desc = '';
        const typeObj = checkHasType(param);
        if (typeObj) {
            type = typeObj.content;
            param = param.substring(typeObj.end + 1);
        }
        param = param.trim();
        const spl = param.split(' ').map((item) => item.trim());
        if (spl.length === 1) {
            name = spl[0];
        }
        if (spl.length > 1) {
            name = spl[0];
            for (let index = 1; index < spl.length; index++) {
                const element = spl[index];
                desc = desc + element;
            }
        }
        params.push({
            type,
            name,
            desc,
        });
    });
    return params;
};

module.exports = {
    getCommentsProps,
};
