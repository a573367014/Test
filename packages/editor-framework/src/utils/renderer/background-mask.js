import utils from '../utils';
import { createCanvas } from '@gaoding/editor-utils/canvas';
import tinycolor from 'tinycolor2';

const roundRect = function (x, y, w, h, r) {
    if (w < 2 * r) {
        r = w / 2;
    }
    if (h < 2 * r) {
        r = h / 2;
    }
    this.beginPath();
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
};

const bezierEllipse = function (x, y, a, b) {
    const k = 0.5522848;
    const ox = a * k; // 水平控制点偏移量
    const oy = b * k; // 垂直控制点偏移量</p> <p> ctx.beginPath();
    // 从椭圆的左端点开始顺时针绘制四条三次贝塞尔曲线
    this.beginPath();
    this.moveTo(x - a, y);
    this.bezierCurveTo(x - a, y - oy, x - ox, y - b, x, y - b);
    this.bezierCurveTo(x + ox, y - b, x + a, y - oy, x + a, y);
    this.bezierCurveTo(x + a, y + oy, x + ox, y + b, x, y + b);
    this.bezierCurveTo(x - ox, y + b, x - a, y + oy, x - a, y);
    this.closePath();
};

export default function renderBackgroundMask({
    editor,
    layout,
    canvas,
    filterElements,
    customizeOpacity,
}) {
    const { backgroundMask } = layout;
    const width = Math.round(layout.width);
    const height = Math.round(layout.height);

    if (!backgroundMask) return null;
    if (!filterElements) {
        filterElements = [];

        utils.walkTemplet(
            (el) => {
                el.maskEnable && filterElements.push(el);
            },
            true,
            [layout],
        );
    }

    if (!filterElements.length) return null;

    const temCanvas = canvas || createCanvas(width, height);
    const temCtx = temCanvas.getContext('2d');

    if (!customizeOpacity) {
        temCtx.clearRect(0, 0, width, height);
        temCtx.save();
        temCtx.globalAlpha = backgroundMask.opacity;
        temCtx.fillStyle = tinycolor(backgroundMask.color).toRgbString();
        temCtx.fillRect(0, 0, width, height);
    }
    temCtx.globalAlpha = 1;

    temCtx.globalCompositeOperation = 'destination-out';
    temCtx.fillStyle = '#ff0000';

    filterElements.forEach((element) => {
        // 可能存在多层嵌套，需拉平处理
        const parents = editor.getParentGroups(element);
        element = parents.length
            ? parents.concat(element).reduce((a, b) => {
                  const result = utils.mergeTransform(a, b);
                  return Object.assign({}, b, result);
              })
            : element;

        const elementCenter = {
            x: element.left + element.width / 2,
            y: element.top + element.height / 2,
        };

        temCtx.save();
        temCtx.translate(elementCenter.x, elementCenter.y);
        temCtx.rotate(element.transform.rotation);
        temCtx.translate(-elementCenter.x, -elementCenter.y);
        try {
            if (element.type === 'rect') {
                roundRect.call(
                    temCtx,
                    Math.round(element.left + element.strokeWidth / 2),
                    Math.round(element.top + element.strokeWidth / 2),
                    Math.round(element.width - element.strokeWidth),
                    Math.round(element.height - element.strokeWidth),
                    Math.round(element.radius),
                );
            } else if (element.type === 'ellipse') {
                bezierEllipse.call(
                    temCtx,
                    Math.round(element.left + element.width / 2),
                    Math.round(element.top + element.height / 2),
                    Math.round(element.width / 2 - element.strokeWidth / 2),
                    Math.round(element.height / 2 - element.strokeWidth / 2),
                );
            }
        } catch (e) {}

        temCtx.fill();
        temCtx.restore();
    });
    temCtx.restore();

    return temCanvas;
}
