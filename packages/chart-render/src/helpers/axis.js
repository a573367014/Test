import { cosByDeg, tanByDeg, atanByDeg } from './math';
import { FONT_FAMILY } from '../render/gd-theme';

export function computedLabelWidth({ width, height, rotate, textAlign }) {
    const c = getShiftCoefficient(textAlign, width, rotate);
    const distance = computedDistanceByCenter(width, height, rotate);

    return distance + c;
}

// 以长方形中心为旋转点，计算旋转后，距离坐标切线的距离。
const computedDistanceByCenter = (w, h, r) => {
    if (r > 180) r = r - 180;
    if (r > 90) r = 180 - r;

    return Math.sqrt(
        (Math.pow(w, 2) + Math.pow(h, 2)) / (4 + 4 * Math.pow(tanByDeg(r - atanByDeg(h / w)), 2)),
    );
};

/**
 * 中心点偏移到左右系数
 * @param {string} textAlign
 * @param {number} width
 * @param {number} rotate
 */
function getShiftCoefficient(textAlign, width, rotate) {
    const e = (width / 2) * cosByDeg(rotate);
    switch (textAlign) {
        case 'left':
            return -e;
        case 'center':
            return 0;
        case 'right':
            return e;
    }
}

/**
 * 获取文字宽度
 * @param {*} font
 * @param {*} text
 */
export function BBox(font, text) {
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.font = font;
    return ctx.measureText(text).width;
}

/**
 *
 * @param {*} config
 */
export function getFont(config) {
    let { fontSize, fontWeight, fontFamily = FONT_FAMILY } = config;
    // reset fontFamily
    fontFamily = fontFamily
        ? fontFamily
              .split(',')
              .map((i) => i.replace(/"/g, ''))
              .join(' ')
        : null;
    return [fontWeight, fontSize + 'px', fontFamily].join(' ');
}
