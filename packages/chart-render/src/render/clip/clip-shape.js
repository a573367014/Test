import Svg2Path from './svg2path';
import { parsePathString } from '../../helpers/parse-path-string';

export const CLIPSHAPE_RENDER_TYPE = {
    SCALE: 'scale',
    CONTAIN: 'contain',
};
// 裁剪对象方式
export const CLIPSHAPE_RENDER_SIZE = {
    WIDTH: 'width',
    HRIGHT: 'height',
};

/**
 * @param {*} shapeType
 */
export function createSpecialShapePathRender(shapeInfo) {
    let { viewBox, path } = shapeInfo;
    path = parsePathString(path);

    return function getPathByDrawPoint({
        x,
        y,
        renderType = CLIPSHAPE_RENDER_TYPE.CONTAIN,
        renderSize,
        shapeBox,
        position = 'bottom',
    }) {
        const svgPath = new Svg2Path({
            viewBox,
            path,
        });

        const [, , boxWidth, boxHeight] = viewBox;
        /**
         * TODO:
         * 移动对齐点
         * 跟绘制点有关联
         */
        if (position === 'bottom') {
            svgPath.translate(boxWidth / 2, boxHeight);
        } else if (position === 'left') {
            svgPath.translate(0, boxHeight / 2);
        }

        const { width, height } = shapeBox;
        const scaleHeightRadius = height / boxHeight;
        const scaleWidthRadius = width / boxWidth;
        /**
         * 变形
         */
        if (renderType === CLIPSHAPE_RENDER_TYPE.CONTAIN) {
            svgPath.scaleX(scaleWidthRadius);
            svgPath.scaleY(scaleHeightRadius);
        } else if (renderType === CLIPSHAPE_RENDER_TYPE.SCALE) {
            /**
             * 缩放
             */
            if (renderSize === CLIPSHAPE_RENDER_SIZE.WIDTH) {
                svgPath.scale(scaleWidthRadius);
            } else if (renderSize === CLIPSHAPE_RENDER_SIZE.HRIGHT) {
                svgPath.scale(scaleHeightRadius);
            } else {
                svgPath.scale(Math.min(scaleWidthRadius, scaleHeightRadius));
            }
        }
        // 绘制点
        svgPath.draw(x, y);

        // 生成path
        return svgPath.build();
    };
}
