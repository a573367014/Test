import { getLinearGradientPoint } from "@gaoding/editor-utils/lib/gradient";
import paper from 'paper';
export function getRectRenderRadius(model) {
  var max = Math.floor(Math.min(model.width, model.height) / 2);
  return Math.min(max, model.radius || 0);
}
/**
 * 元素渐变值转换成paper渐变
 */

export function modelColorToPaperColor(model, isEdit) {
  if (isEdit === void 0) {
    isEdit = false;
  }

  var color = model.$fillColor;
  if (!color) return null;
  if (typeof color === 'string') return new paper.Color(color);

  var _getLinearGradientPoi = getLinearGradientPoint(color.angle - (isEdit ? model.rotate : 0), model.width, model.height),
      x0 = _getLinearGradientPoi[0],
      y0 = _getLinearGradientPoi[1],
      x1 = _getLinearGradientPoi[2],
      y1 = _getLinearGradientPoi[3];

  var gradient = new paper.Gradient();
  gradient.stops = color.stops.map(function (stop) {
    return new paper.GradientStop(new paper.Color(stop.color), stop.offset);
  });
  var origin = new paper.Point(x0, y0);
  var destination = new paper.Point(x1, y1);

  if (isEdit) {
    origin.x += model.left;
    origin.y += model.top;
    destination.x += model.left;
    destination.y += model.top;
  }

  return new paper.Color(gradient, origin, destination);
}
export function paperColorToModelColor(color) {
  if (color.type === 'rgb') return {
    type: 'color',
    color: color.toCSS(true),
    enable: true
  };
  return {
    type: 'gradient',
    enable: true,
    gradient: {
      type: 'linear',
      angle: 0,
      stops: color.gradient.stops.map(function (stop) {
        return {
          color: stop.color.toCSS(true),
          offset: stop.offset
        };
      })
    }
  };
}