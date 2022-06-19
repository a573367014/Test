import tinycolor from 'tinycolor2';
import { IColor } from '../types';

export const getColorStringByIColor = (color: IColor) => {
    const tycolor = tinycolor.fromRatio({
        h: color.h,
        v: color.v,
        s: color.s,
        a: color.a,
    });
    return tycolor.toRgbString();
};
