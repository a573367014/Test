/**
 * lib/pixel-helper.js
 * 提供像素与绝对长度的转换工具
 */

const ALLOWED_UNITS = ['in', 'cm', 'mm', 'pt'];

/**
 * 单位数据换算
 */
function unitValueTransform(value, dpi, unit, decimalPlaces, mapTransformFn) {
    const validValue = Math.max(value, 0);
    const validDpi = Math.max(dpi, 0);
    let result = validDpi;

    if (!ALLOWED_UNITS.includes(unit)) {
        result = validValue;
    } else if (validValue === 0 || validDpi === 0) {
        result = 0;
    } else {
        result = mapTransformFn[unit]?.(validValue) || validValue;
    }
    if (decimalPlaces === -1) {
        return result;
    }
    const radio = Math.pow(10, decimalPlaces);
    return Math.round(result * radio) / radio;
}

/**
 * 将绝对长度转换为像素值
 * @param {number} absoluteLength - 绝对长度值
 * @param {number} dpi - 转换的dpi
 * @param {string} unit - 转换的绝对长度单位, 'in', 'cm' , 'mm'
 * @param {number} decimalPlaces - 保留的小数位，0 取整，1 保留一位小数，-1 不处理结果值
 * @returns {number} 转换后四舍五入的像素值
 */
export function absoluteLengthToPixel(absoluteLength, dpi, unit, decimalPlaces = 0) {
    return unitValueTransform(absoluteLength, dpi, unit, decimalPlaces, {
        in: (v) => v * dpi,
        cm: (v) => (v * dpi) / 2.54,
        mm: (v) => (v * dpi) / 2.54 / 10,
        pt: (v) => (v / dpi) * 72,
    });
}

/**
 * 将像素转换为绝对长度单位
 * @param {number} px - 像素值
 * @param {number} dpi - 转换的dpi
 * @param {string} unit - 转换的绝对长度单位, 'in', 'cm' , 'mm' , 'pt'
 * @param {number} decimalPlaces - 保留的小数位，0 取整，1 保留一位小数，-1 不处理结果值
 * @returns {number} 转换后四舍五入的绝对长度整值
 */
export function pixelToAbsoluteLength(px, dpi, unit, decimalPlaces = 0) {
    return unitValueTransform(px, dpi, unit, decimalPlaces, {
        in: (v) => v / dpi,
        cm: (v) => (v / dpi) * 2.54,
        mm: (v) => (v / dpi) * 2.54 * 10,
        pt: (v) => (v * dpi) / 72,
    });
}

/**
 * 通过绝对长度计算dpi
 * @param { number } width - 绝对宽度
 * @param { number } height - 绝对高度
 * @param {string} unit - 转换的绝对长度单位, 'in', 'cm' , 'mm'
 * @returns {number} 转换的dpi
 */
export function getDpi(width, height, unit) {
    if (!ALLOWED_UNITS.includes(unit) || !(height > 0) || !(width > 0)) {
        return 0;
    }

    switch (unit) {
        case 'in':
            width = width * 2.54;
            height = height * 2.54;
            break;
        case 'mm':
            width = width / 10;
            height = height / 10;
            break;
        case 'cm':
        default:
            break;
    }

    if ((width > 300 && width <= 500) || (height > 300 && height <= 500)) {
        return 45;
    }
    if ((width > 120 && width <= 300) || (height > 200 && height <= 300)) {
        return 72;
    }
    if ((width > 60 && width <= 120) || (height > 60 && height <= 200)) {
        return 150;
    }
    if (width <= 60 && height <= 60) {
        return 300;
    }
}

/**
 * 将绝对宽高转换为像素值
 * @param {number} width - 绝对宽度
 * @param {number} height - 绝对高度
 * @param {string} unit - 转换的绝对长度单位, 'in', 'cm' , 'mm'
 * @returns {object} 转换后的像素值与dpi {width: number, height: number, dpi: number}
 */
export function absoluteSizeToPixelSize(width, height, unit, defaultDpi) {
    if (!ALLOWED_UNITS.includes(unit)) {
        return {
            width: width,
            height: height,
            dpi: 0,
        };
    }
    const dpi = getDpi(width, height, unit) || defaultDpi;
    return {
        width: absoluteLengthToPixel(width, dpi, unit),
        height: absoluteLengthToPixel(height, dpi, unit),
        dpi: dpi,
    };
}

export default {
    absoluteLengthToPixel,
    pixelToAbsoluteLength,
    getDpi,
    absoluteSizeToPixelSize,
};
