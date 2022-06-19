import tinycolor from 'tinycolor2';
import { IColor } from '../types/index';

export const getIColorByString = (defaultColor: string) => {
    const tinyColor = tinycolor(defaultColor);
    const hsva = tinyColor.toHsv();
    return {
        h: hsva.h,
        s: hsva.s,
        v: hsva.v,
        a: hsva.a,
        format: 'hsva',
    } as IColor;
};
