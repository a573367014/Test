/**
 * 角度转弧度
 * @param {number} d 角度单位值
 * @returns {number} 弧度单位的值
 */
export const degToRadian = (d) => {
    if (Math.abs(d % 180) === 0) {
        return Math.PI * (d / 180);
    }
    return (Math.PI / 180) * d;
};

/**
 * 弧度转角度
 * @param {number} r 弧度单位值
 * @returns {number} 角度单位值
 */
export const radianToDeg = (r) => (180 / Math.PI) * r;

/**
 * math.sin, cos, tan 参数的单位都是弧度单位
 * 对 sin，cos, tan 针对角度单位的函数
 * @param {number} d 度数
 */
export const tanByDeg = (d) => Math.tan(degToRadian(d));
export const cosByDeg = (d) => Math.cos(degToRadian(d));
export const sinByDeg = (d) => Math.sin(degToRadian(d));

/**
 * @param {*} i
 * Math.atan 返回值单位是 弧度
 * atanByDeg 返回值单位是 角度
 */
export const atanByDeg = (i) => radianToDeg(Math.atan(i));
