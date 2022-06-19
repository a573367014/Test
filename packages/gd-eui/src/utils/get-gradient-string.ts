import tinycolor from 'tinycolor2';
import { IGradientColor, IColorOffset } from '../types';
import { getTransformationIColor } from './get-transformation-color';

export const getGradientString = (angle: number, steps: Array<IGradientColor>) => {
    if (steps.length === 0) return '';
    steps = steps.length === 1 ? steps.concat(steps) : steps;

    const colors: IColorOffset[] = [];
    for (let index = 0; index < steps.length; index++) {
        const item: IGradientColor = steps[index];
        const targetColor = getTransformationIColor(item.color);
        // console.log('targetColor', targetColor, item.color);
        const tycolor = tinycolor.fromRatio({
            h: targetColor.h,
            v: targetColor.v,
            s: targetColor.s,
            a: targetColor.a,
        });
        const colorHSL = tycolor.toHsl();
        const color = `hsla(${colorHSL.h}, ${colorHSL.s * 100}%, ${colorHSL.l * 100}%, ${
            colorHSL.a
        })`;
        colors.push({
            color,
            offset: item.offset * 100,
        });
    }
    colors.sort((a, b) => {
        return a.offset - b.offset;
    });
    return `linear-gradient(${90 - angle}deg, ${colors.map(
        (step: IColorOffset) => `${step.color} ${step.offset}%`,
    )})`;
};
