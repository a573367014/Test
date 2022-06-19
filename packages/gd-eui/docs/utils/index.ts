import tinycolor from 'tinycolor2';

/**
 * 将hvs颜色转为rgba
 * @param hsv
 */
export function hsv2RgbHex(hsv: any) {
    const color = tinycolor.fromRatio({
        h: hsv.h,
        s: hsv.s,
        v: hsv.v,
        a: hsv.a,
    });
    return color.toHexString().toUpperCase();
}
