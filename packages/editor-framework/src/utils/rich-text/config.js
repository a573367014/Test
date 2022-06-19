import tinycolor from 'tinycolor2';
import { trim } from 'lodash';
// 自定义标签标识、用于定位节点
const CUSTOMIZE_MARK = 'data-customize';

// style样式名称，实际名称跟model的转换
const styleMap = reverseSetMap({
    color: 'color',
    'text-decoration': 'textDecoration',
    'text-decoration-line': 'textDecoration',
    'font-size': 'fontSize',
    'font-family': 'fontFamily',
    'font-weight': 'fontWeight',
    'font-style': 'fontStyle',
});
styleMap.textDecoration = 'text-decoration';

// style样式值，实际样式跟model的转换
const styleValueMap = {
    // hexa || rgba
    color: (value) => value && tinycolor(value).toString('rgb'),
    'font-size': (value) => (isNaN(value - 0) ? value : value + 'px'),
    fontSize: (value) => parseFloat(value),
    'font-weight': resetFontWeightValue,
    fontWeight: resetFontWeightValue,
    // 'font-family': (value) => value.replace(/"/g, '').split(',')[0],
    fontFamily: (value) => {
        let str = value.replace(/"/g, '').split(',');
        str = str.find((str) => str.indexOf('-subset') === -1) || '';
        return trim(str);
    },
    textDecoration: (value) => (value === null || value === 'null' ? 'none' : value),
    'text-decoration': (value) => (value === null || value === 'null' ? 'none' : value),
    fontStyle: (value) => (value === null || value === 'null' ? 'normal' : value),
    'font-style': (value) => (value === null || value === 'null' ? 'normal' : value),
};

// 命令名称别名
const commandAliasMap = {
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: 'foreColor',
    fontFamily: 'fontName',
};
const commandValueMap = {
    fontSize: (value) => parseFloat(value),
    fontWeight: (value) => (value ? 700 : 400),
    fontStyle: (value) => (value ? 'italic' : 'normal'),
    fontFamily: (value) => {
        if (value) {
            let str = value.toString().replace(/"/g, '').split(',');
            str = str.find((str) => str.indexOf('-subset') === -1) || '';
            return trim(str);
        }

        return value;
    },
    color: (value) => value,
    textDecoration: (value) => value,
};

export { CUSTOMIZE_MARK, styleMap, styleValueMap, commandAliasMap, commandValueMap };

function reverseSetMap(map) {
    Object.keys(map).forEach((name) => {
        map[map[name]] = name;
    });
    return map;
}

function resetFontWeightValue(value) {
    const map = {
        700: 700,
        800: 700,
        900: 700,
        bold: 700,
        true: 700,
    };
    return map[value] || 400;
}
