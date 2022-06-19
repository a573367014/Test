/**
 * @follow: vue-color/src/mixin/color.js
 */

import tinycolor from 'tinycolor2';

function parseColor(data, oldHue) {
    // default value shim

    if(!data) {
        data = '#0000';
    }
    var alpha = data && data.a;
    var color;

    // hsl is better than hex between conversions
    if(data && data.hsl) {
        color = tinycolor(data.hsl);
    }
    else if(data && data.hex && data.hex.length > 0) {
        color = tinycolor(data.hex);
    }
    else {
        color = tinycolor(data);
    }

    if(color && (color._a === undefined || color._a === null)) {
        color.setAlpha(alpha || 1);
    }

    var hsl = color.toHsl();
    var hsv = color.toHsv();

    if(hsl.s === 0) {
        hsv.h = hsl.h = data.h || (data.hsl && data.hsl.h) || oldHue || 0;
    }

    const colors = {
        hsl: hsl,
        hex: color.toHexString().toUpperCase(),
        rgba: color.toRgb(),
        hsv: hsv,
        oldHue: data.h || oldHue || hsl.h,
        source: data.source,
        a: data.a || color.getAlpha(),

        _color: color
    };

    Object.defineProperty(colors, 'toString', {
        configurable: true,
        enumerable: false,
        writable: true,
        value(format) {
            return color.toString(format);
        }
    });

    return colors;
}

export default parseColor;
