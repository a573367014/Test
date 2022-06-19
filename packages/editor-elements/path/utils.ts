import type { IPathElementModel } from '@gaoding/editor-framework/src/types/editor';
import type { EffectFilling } from '@gaoding/editor-framework/src/types/effect';
import { getLinearGradientPoint } from '@gaoding/editor-utils/gradient';
import paper from 'paper';
import { PaperColor } from './types';

export function getRectRenderRadius(model: IPathElementModel) {
    const max = Math.floor(Math.min(model.width, model.height) / 2);
    return Math.min(max, model.radius || 0);
}

/**
 * 元素渐变值转换成paper渐变
 */
export function modelColorToPaperColor(model: IPathElementModel, isEdit = false) {
    const color = model.$fillColor;
    if (!color) return null;
    if (typeof color === 'string') return new paper.Color(color);
    const [x0, y0, x1, y1] = getLinearGradientPoint(
        color.angle - (isEdit ? model.rotate : 0),
        model.width,
        model.height,
    );
    const gradient = new paper.Gradient();
    gradient.stops = color.stops.map(
        (stop) => new paper.GradientStop(new paper.Color(stop.color), stop.offset),
    );
    const origin = new paper.Point(x0, y0);
    const destination = new paper.Point(x1, y1);
    if (isEdit) {
        origin.x += model.left;
        origin.y += model.top;
        destination.x += model.left;
        destination.y += model.top;
    }
    return new paper.Color(gradient, origin, destination);
}

export function paperColorToModelColor(color: PaperColor): EffectFilling {
    if (color.type === 'rgb') return { type: 'color', color: color.toCSS(true), enable: true };

    return {
        type: 'gradient',
        enable: true,
        gradient: {
            type: 'linear',
            angle: 0,
            stops: color.gradient.stops.map((stop) => ({
                color: stop.color.toCSS(true),
                offset: stop.offset,
            })),
        },
    };
}
