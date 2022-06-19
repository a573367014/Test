import { getIColorByString } from './get-icolor-by-string';
import { IColor } from '../types/index';

/**
 * 获取转换后的颜色
 * @param color
 */
export const getTransformationIColor = (color: string | IColor) => {
    if (typeof color === 'string') {
        return getIColorByString(color);
    }
    return color;
};
