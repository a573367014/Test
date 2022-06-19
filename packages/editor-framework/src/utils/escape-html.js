/**
 * Escape html
 * 在保留 span 标签前提下转义其它标签
 * @douding
 * @xuebi
 */

const r = /^<\/span>/i;
const rSpanTagOpen = /^<span[^>]*>/i;
const rTagClose = /^<\/[\w]+>/i;
const rTagOpen = /^<[^<]+>/i;
const rValue = /^[^<]+/i;

const sanitize = (html) => html.replace(/</g, '&lt;').replace(/>/g, '&gt;');
const noop = (str) => str;

// 优先级 span 最高，其次为普通标签，最后为标签所包裹值
const rules = [
    { match: (str) => r.exec(str), convert: noop },
    { match: (str) => rSpanTagOpen.exec(str), convert: noop },
    { match: (str) => rTagClose.exec(str), convert: sanitize },
    { match: (str) => rTagOpen.exec(str), convert: sanitize },
    {
        // 对 Value 类型绕过形如 <span>1<2<span> 的异常情形
        match(str) {
            let result = '';
            const value = rValue.exec(str);
            if (!value) return null;

            while (true) {
                const value = rValue.exec(str);
                if (value) {
                    result += value[0];
                    str = str.substr(value[0].length);
                } else if (str[0] === '<' && !rTagOpen.exec(str)) {
                    str = str.substr(1);
                    result += '<';
                } else {
                    break;
                }
            }

            return [result];
        },
        convert: sanitize,
    },
];

function getToken(str) {
    for (let i = 0; i < rules.length; i++) {
        const raw = rules[i].match(str);
        if (raw) {
            return {
                len: raw[0].length,
                sanitized: rules[i].convert(raw[0]),
            };
        }
    }
}

export default function escape(str, keepSpan = false) {
    if (!keepSpan) {
        return sanitize(str);
    }

    let results = '';
    // 顺序读入字符串中标签 token 并按需处理
    while (str.length > 0) {
        const token = getToken(str);
        str = str.substr(token.len);
        results += token.sanitized;
    }
    return results;
}
