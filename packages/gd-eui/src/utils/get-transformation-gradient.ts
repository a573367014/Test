import { IGradientColor, IColor } from '../types/index';
import { getColorStringByIColor } from './get-color-string-by-icolor';

export const transformationGradientString = (steps: IGradientColor[]) => {
    const list = steps.map((step: IGradientColor) => {
        let color: IGradientColor | string = '';
        if (typeof step.color === 'string') {
            color = step.color;
        } else {
            color = getColorStringByIColor(step.color as IColor);
        }
        return {
            color,
            offset: step.offset,
        };
    });
    return list.sort((a, b) => a.offset - b.offset);
};
