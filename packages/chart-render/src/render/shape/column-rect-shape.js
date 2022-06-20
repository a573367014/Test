import { drawLabelWithLabelController } from '../components/draw-label';
import { createSpecialShapeRender, CLIPSHAPE_RENDER_SIZE } from '../clip/index';
import RectPoint from '../../helpers/rect-point';
import { merge } from '@antv/g2/lib/util';
import { clipStyleAdapter } from '../../helpers/adapters/style';

/**
 * 将圆角配置%号的转换为具体数字
 * @param {*} radius
 * @param {*} radiusWidth
 */
export function parseRadius(radius, radiusWidth) {
    const r = Array.isArray(radius)
        ? radius.map((i) =>
              /\d+(\.\d+)?%/.test(i) ? radiusWidth * (parseFloat(i) / 100) : parseFloat(i),
          )
        : 0;
    // [0, 0, 0, 0] 转换为0的意义：利用g绘制底层采用rect方法绘制，更快速。
    if (Array.isArray(r) && r.every((i) => i === 0)) {
        return 0;
    }
    return r;
}

/**
 * 绘制有圆角的长方形
 * @param {*} container
 * @param {*} points
 * @param {*} param2
 */
export function drawColumnRect(container, points, attrs) {
    const width = points[2].x - points[1].x;
    const height = Math.abs(points[1].y - points[0].y);
    const radius = parseRadius(attrs.radius, Math.min(width / 2, height / 2));

    return drawRectByPoints(container, points, {
        ...attrs,
        radius,
    });
}

/**
 * 根据柱子的点获取柱子的长宽配置
 * @param {Object} points
 * @param {Obejct} param1
 */
function getRectRange(points, { lineWidth }) {
    const xValues = [];
    const yValues = [];
    for (let i = 0, len = points.length; i < len; i++) {
        const point = points[i];
        xValues.push(point.x);
        yValues.push(point.y);
    }
    const xMin = Math.min.apply(null, xValues);
    const yMin = Math.min.apply(null, yValues);
    const xMax = Math.max.apply(null, xValues);
    const yMax = Math.max.apply(null, yValues);
    const haldLineWidth = lineWidth / 2;

    return {
        x: xMin + haldLineWidth,
        y: yMin + haldLineWidth,
        width: xMax - xMin - lineWidth,
        height: yMax - yMin - lineWidth,
    };
}

/**
 * 根据点位置长方形
 * @param {*} container
 * @param {*} points
 * @param {*} style
 */
export function drawRectByPoints(container, points, style) {
    const rectCfg = getRectRange(points, style);
    return container.addShape('rect', {
        className: 'interval',
        attrs: {
            ...rectCfg,
            ...style,
        },
    });
}

/**
 * todo: 缓存处理绘制函数
 * 绘制label
 * @param {*} group
 * @param {*} origin
 * @param {*} points
 */

export function drawColumnShapeLabel($labelController, group, { points, origin, coord, id }) {
    // 同一个
    if (!$labelController || !$labelController.enable) {
        return;
    }
    const isAutoReversal = points[0].y < points[1].y;
    const formatCfg = (cfg) => {
        let offsetY = cfg.offset;
        let { textBaseline = 'bottom' } = cfg.textStyle;
        if (isAutoReversal) {
            offsetY = -offsetY;
            textBaseline = textBaseline === 'top' ? 'bottom' : 'top';
        }
        cfg.textStyle = {
            textAlign: 'center',
            ...cfg.textStyle,
            textBaseline,
        };
        cfg.offsetY = offsetY;
        return cfg;
    };
    drawLabelWithLabelController(
        $labelController,
        group,
        {
            origin,
            id,
            coord,
            x: points[1].x + Math.abs(points[2].x - points[1].x) / 2,
            y: points[1].y - (points[1].y - points[2].y) / 2,
        },
        formatCfg,
    );
}

/**
 * 获取异形绘制对象
 * @param {*} container
 * @param {*} shapeType
 */
export function getSpecialShapeByType(container, shapeInfo, shapeKey = '_clipSpecialShape') {
    let drawSpecialShape = container[shapeKey];
    const shapeType = shapeInfo.path;
    if (!drawSpecialShape || drawSpecialShape.type !== shapeType) {
        drawSpecialShape = createSpecialShapeRender(container, shapeInfo);
        // save
        drawSpecialShape.type = shapeType;
        container[shapeKey] = drawSpecialShape;
    }
    return drawSpecialShape;
}

export const columnBaseShape = {
    getCoordHeight() {},
    getSize(points) {
        return points[2].x - points[1].x;
    },
    parseAndResetPoints(clipShape, points) {
        const { height: clipShapeHeight, width: clipShapeWidth } = clipShape.getBBox();
        const coordHeight = this.getCoordHeight();
        /**
         * 相差大于0.01需要重置高度
         */
        const isResetY = Math.abs(coordHeight - clipShapeHeight) > 0.01;
        if (isResetY) {
            const r = clipShapeHeight / coordHeight;
            points.forEach((item) => {
                item.y = item.y * r;
            });
        }

        points = this.parsePoints(points);
        const columnWidth = this.getSize(points);
        const isResetX = columnWidth < clipShapeWidth;
        if (isResetX) {
            const halfWidth = (clipShapeWidth - columnWidth) / 2;
            points.forEach((item, index) => {
                item.x = item.x + (index <= 1 ? -halfWidth : +halfWidth);
            });
        }

        return points;
    },
    drawBackGroundClipShape(shapeCfg, container, shapeRectInfo) {
        const { shapeWidth, shapeFullHeight } = shapeRectInfo;
        const { clipShapePath, clipShapeRenderType, clipShapeRenderSize } = shapeCfg;
        // 获取渲染函数
        const drawSpecialShape = getSpecialShapeByType(container, clipShapePath);
        // 直接渲染
        return drawSpecialShape({
            // x, y
            ...shapeRectInfo.getStartBottomPoint(),
            // 渲染方式和大小
            renderType: clipShapeRenderType,
            renderSize: clipShapeRenderSize || CLIPSHAPE_RENDER_SIZE.HRIGHT,
            width: shapeWidth,
            height: shapeFullHeight,
            // style
            style: clipStyleAdapter(shapeCfg),
        });
    },
    createClipGroup(cfg, container) {
        // 绘制
        const shapeRectInfo = this.buildRectPointInfo(cfg.points);
        // add colors
        const shapeCfg = cfg.style.clipShape;
        shapeCfg.color = cfg.color;

        const clipShape = this.drawBackGroundClipShape(shapeCfg, container, shapeRectInfo);
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
                // 渲染方式和大小
                renderType: shapeRenderType,
                renderSize: shapeRenderSize,
                // style
                style,
            });
        } else {
            shapeContaninter = drawColumnRect(container, points, style);
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
export default function createRectShapeDraw(chart) {
    /**
     * 注册图形
     */
    return merge({}, columnBaseShape, {
        getCoordHeight() {
            const { range } = chart.geom.getYScale();
            const [{ y: fullHeight }, { y: minHeight }] = this.parsePoints([
                {
                    y: range[1],
                },
                {
                    y: range[0],
                },
            ]);
            // 获取原来的高度
            return Math.abs(fullHeight - minHeight);
        },
        buildRectPointInfo(points) {
            const { range } = chart.geom.getYScale();
            return new RectPoint(points, {
                coordParse: this,
                range,
            });
        },
        /**
         * 主绘制方法
         * @param {Object} cfg
         * @param {G-Group} container
         */
        draw(cfg, container) {
            let clipGroup = container;
            let points = null;

            /**
             * 1. 绘制异形裁剪图层
             */
            const { enableClipShape, clipShapePath } = cfg.style.clipShape || {};
            if (enableClipShape && clipShapePath) {
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

            // 3. 绘制label
            // label比柱子层级高，所以要在柱子之后绘制
            //

            drawColumnShapeLabel(chart.$labelController, container, {
                origin: cfg.origin._origin,
                id: cfg._id,
                coord: this._coord,
                points,
            });

            // 4. 必须返回，否则动画会失效
            return shapeContaninter;
        },
    });
}
