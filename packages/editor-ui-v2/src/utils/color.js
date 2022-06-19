import tinycolor from 'tinycolor2';
/**
 * 是否为常规颜色
 * @param {*} color
 */
export function isPureColor(color) {
    if(typeof color !== 'string') return false;
    return tinycolor(color).isValid();
}

/**
 * 是否为渐变颜色
 * @param {*} color
 */
export const isGradientColor = color => {
    return Array.isArray(color.stops);
};

/**
 * 是否为图案颜色
 * @param {*} color
 */
export const isMapColor = color => {
    return color && Object.keys(color).includes('image');
};

/**
 * 渐变对象转成css background
 */
export function gradient2BackgroundStyle(gradient) {
    const { angle, stops } = gradient;
    return `linear-gradient(${angle + 90}deg, ${stops.map(stop => `${stop.color} ${stop.offset * 100}%`)})`;
}
