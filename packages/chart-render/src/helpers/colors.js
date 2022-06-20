import { isPlainObject, isString } from '@antv/g2/lib/util';
import tinycolor from 'tinycolor2';
import { COLOR_TYPE_MAP } from './constants';

/**
 * 是否是颜色
 * @param {string|Array} c 颜色
 * @returns {boolean}
 */
const isColor = (c) =>
    Array.isArray(c) ? c.some((i) => tinycolor(i).isValid()) : tinycolor(c).isValid(c);

/**
 * 修正颜色
 * @param {string|Array} value
 */
function parseColorItem(color) {
    if (isPlainObject(color) && color !== null) {
        switch (String(color.type)) {
            // 单色
            case 'color':
                return hexaToRgba(color.color);
            // 渐变
            case 'gradient':
                return parseLinearGradientsString(color.gradient);
        }
        // TODO: 支持放射性渐变
    } else if (isString(color)) {
        return hexaToRgba(color);
    }
    return color;
}

/**
 *
 * 将对象转换为可供g2渲染的字符串
 * @expamle
 * makeLinearGradientsString({
 *  gradientAngle: 0,
 *  stops: [
 *      { color: '#FFFFFF', offset: 0 },
 *      { color: '#000000', offset: 1 }
 * ]})
 *
 * return
 * l(0) 0:#ffffff 1:#000000'
 *
 *
 */
function parseLinearGradientsString({ angle, stops = [] }) {
    angle = Number(angle);
    if (isNaN(angle)) {
        angle = 0;
    } else if (angle < 0) {
        /** g2 不支持负数角度, 角度值为0-360 */
        angle = 360 - Math.abs(angle);
    }

    /** 转换 */
    const stopsArray = stops.map(({ color, offset }) =>
        color !== undefined && offset !== undefined ? `${offset}:${hexaToRgba(color)}` : '',
    );
    return `l(${angle}) ${stopsArray.join(' ')}`;
}

/**
 * 转换为6位16进制颜色单位
 * @param {string} c 颜色
 * @returns {string} 6位16进制颜色
 */
export function hexaToRgba(value) {
    if (isString(value) && isColor(value)) {
        return tinycolor(value).toPercentageRgbString();
    }
    return value;
}

/**
 * 解析颜色或者数组
 * 将model颜色转换为g2可识别的颜色字符串
 * @param {Array|Object|String} colors
 */
export function parseColorToString(colors) {
    if (Array.isArray(colors)) {
        colors = colors.map(parseColorItem);
    } else if (isPlainObject(colors) || isString(colors)) {
        colors = parseColorItem(colors);
    }
    return colors;
}

/**
 * 根据颜色类型中转换颜色
 * @param {Array} colors
 * @param {COLOR_TYPE_MAP} colorType
 */
export function parseColorsWithType(colors, colorType = COLOR_TYPE_MAP.POLYCHROME) {
    if (!Array.isArray(colors)) {
        colors = [colors];
    }
    // 转换颜色为字符串
    colors = parseColorToString(colors);
    // 多色
    if (colorType === COLOR_TYPE_MAP.POLYCHROME) {
        return colors;
    }
    // 单色
    else if (colorType === COLOR_TYPE_MAP.MONOCHROME) {
        return [colors[0]];
    }
    // 区间渐变色
    else if (colorType === COLOR_TYPE_MAP.GRADIEND) {
        return colors.join('-');
    }
}

export function parseColorsToArray(colors, colorType = COLOR_TYPE_MAP.POLYCHROME) {
    const parsedColorList = parseColorToString(colors);
    if (colorType === COLOR_TYPE_MAP.MONOCHROME) {
        const singleColor = parsedColorList[0];
        return [singleColor, singleColor];
    }
    // 区间色
    else if (colorType === COLOR_TYPE_MAP.GRADIEND) {
        return [parsedColorList[0], parsedColorList[parsedColorList.length - 1]];
    } else {
        return parsedColorList;
    }
}
