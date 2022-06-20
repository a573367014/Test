import { drawLabelWithLabelController } from '../components/draw-label';
import { parseRadius, drawRectByPoints, getSpecialShapeByType } from './column-rect-shape';
import { merge } from '@antv/g2/lib/util';
import { clipStyleAdapter } from '../../helpers/adapters/style';
import { CLIPSHAPE_RENDER_SIZE } from '../clip/index';

/**
 * 绘制条形
 * @param {*} container
 * @param {*} points
 * @param {*} param2
 */
export function drawBarRect(container, points, style) {
    const width = Math.abs(points[1].y - points[2].y);
    const height = points[1].x - points[0].x;
    let radius = parseRadius(style.radius, Math.min(width / 2, Math.abs(height) / 2));
    if (radius !== 0) {
        // 对换一下角度
        radius.unshift(radius.pop());
        if (height < 0) {
            radius = [radius[1], radius[0], radius[3], radius[2]];
        }
    }
    return drawRectByPoints(container, points, {
        ...style,
        radius,
    });
}

/**
 * 绘制label
 * @param {*} group
 * @param {*} origin
 * @param {*} points
 */
function _drawBarShapeLabel(group, { id, origin, points, coord }) {
    const $labelController = this.$labelController;
    const isAutoReversal = points[0].x > points[1].x;

    const formatCfg = (cfg) => {
        const { offset } = cfg;
        let { textAlign = 'right' } = cfg.textStyle;
        let offsetX = -offset;
        if (isAutoReversal) {
            offsetX = -offsetX;
            textAlign = textAlign === 'left' ? 'right' : 'left';
        }
        // 自动适应
        delete cfg.offset;
        cfg.offsetX = offsetX;
        cfg.textStyle.textAlign = textAlign;
        return cfg;
    };

    drawLabelWithLabelController(
        $labelController,
        group,
        {
            // shapeLabelConfig
            origin,
            id,
            coord,
            x: points[1].x,
            y: points[1].y - (points[1].y - points[2].y) / 2,
        },
        formatCfg,
    );
}

export const columnBarBaseShape = {
    getSize(points) {
        return points[2].y - points[1].y;
    },
    buildRectPointInfo(points) {
        const parsedPoints = this.parsePoints([
            ...points,
            {
                x: 0,
                y: 0,
            },
        ]);
        return {
            shapeFullWidth: this.getCoordHeight(),
            shapeHeight: parsedPoints[1].y - parsedPoints[2].y,
            getStartLeftPoint() {
                return {
                    x: parsedPoints[4].x,
                    y: parsedPoints[2].y - (parsedPoints[2].y - parsedPoints[1].y) / 2,
                };
            },
        };
    },
    parseAndResetPoints(clipShape, points) {
        const { height: clipShapeHeight, width: clipShapeWidth } = clipShape.getBBox();
        const coordWidth = this.getCoordHeight();

        /**
         * 相差大于0.01需要重置高度
         */
        const isResetY = Math.abs(coordWidth - clipShapeWidth) > 0.01;
        if (isResetY) {
            const r = clipShapeWidth / coordWidth;
            points.forEach((item) => {
                item.y = item.y * r;
            });
        }

        points = this.parsePoints(points);
        const columnHeight = this.getSize(points);
        const isResetH = columnHeight < clipShapeHeight;
        if (isResetH) {
            const halfHeight = (clipShapeHeight - columnHeight) / 2;
            points.forEach((item, index) => {
                item.y = item.y + (index <= 1 ? -halfHeight : +halfHeight);
            });
        }

        return points;
    },
    drawBackGroundClipShape(cfg, container, shapeRectInfo) {
        const { shapeFullWidth, shapeHeight } = shapeRectInfo;

        const shapeCfg = cfg.style.clipShape;
        const { clipShapePath, clipShapeRenderType, clipShapeRenderSize } = shapeCfg;
        shapeCfg.color = cfg.color;

        // 获取渲染函数
        const drawSpecialShape = getSpecialShapeByType(container, clipShapePath);
        return drawSpecialShape({
            // x, y
            ...shapeRectInfo.getStartLeftPoint(),
            // 宽高
            width: shapeFullWidth,
            height: shapeHeight,

            // 渲染方式和大小
            renderType: clipShapeRenderType,
            renderSize: clipShapeRenderSize || CLIPSHAPE_RENDER_SIZE.WIDTH,
            // style
            style: clipStyleAdapter(shapeCfg),
            position: 'left',
        });
    },
    createClipGroup(cfg, container) {
        // 绘制
        const shapeRectInfo = this.buildRectPointInfo(cfg.points);
        const clipShape = this.drawBackGroundClipShape(cfg, container, shapeRectInfo);
        // 新增clip图层
        return container.addGroup({
            attrs: {
                clip: clipShape,
            },
        });
    },
    /**
     * 绘制自定义图形
     * @param {*} container
     * @param {*} points
     * @param {*} shapeCfg
     */
    createSpecialShape(container, points, shapeCfg) {
        const { specialShape, shapePath, shapeRenderType, shapeRenderSize, autoReverse, style } =
            shapeCfg;
        let shapeContaninter = null;

        const width = points[2].x - points[1].x;
        const height = points[0].y - points[1].y;

        if (specialShape === true && shapePath) {
            const drawSpecialShape = getSpecialShapeByType(container, shapePath, '_specialShape');
            shapeContaninter = drawSpecialShape({
                // x, y
                x: points[1].x + width / 2,
                y: Math.max(points[0].y, points[1].y),
                // w/h
                width: width,
                height: Math.abs(height),
                position: 'left',
                // 渲染方式和大小
                renderType: shapeRenderType,
                renderSize: shapeRenderSize,
                // style
                style,
            });
        } else {
            shapeContaninter = drawBarRect(container, points, style);
        }
        // 两极反转
        // height < 0 说明是负值
        if (height < 0 && autoReverse) {
            shapeContaninter.move(-points[3].x, -points[3].y);
            shapeContaninter.rotate((180 / 180) * Math.PI);
            shapeContaninter.move(0 - width, 0 - height);
        }

        return shapeContaninter;
    },
};

/**
 * @param {content} chart
 */
export default function createBarRectShapeDraw(chart) {
    /**
     * 注册图形
     */
    return merge({}, columnBarBaseShape, {
        getCoordHeight() {
            const { range } = chart.geom.getYScale();
            const [{ x: fullWidth }, { x: minWidth }] = this.parsePoints([
                {
                    y: range[1],
                    x: 1,
                },
                {
                    y: range[0],
                    x: 0,
                },
            ]);

            return Math.abs(fullWidth - minWidth);
        },

        draw(cfg, container) {
            let clipGroup = container;
            let points = null;
            /**
             * 1. 绘制异形裁剪图层
             */
            if (
                cfg.style.clipShape &&
                cfg.style.clipShape.enableClipShape &&
                cfg.style.clipShape.clipShapePath
            ) {
                clipGroup = this.createClipGroup(cfg, container);
                points = this.parseAndResetPoints(clipGroup.attr('clip'), cfg.points);
            }

            // 2. 绘制常规柱状/自定义图形
            points = points || this.parsePoints(cfg.points);
            const shapeContaninter = this.createSpecialShape(clipGroup, points, {
                ...cfg.style.shape,
                style: {
                    ...cfg.style,
                    fill: cfg.color,
                    fillOpacity: cfg.opacity,
                },
            });

            // 绘制label
            _drawBarShapeLabel.call(chart, container, {
                origin: cfg.origin._origin,
                id: cfg._id,
                coord: this._coord,
                points,
            });

            // 必须返回，否则动画会失效
            return shapeContaninter;
        },
    });
}
