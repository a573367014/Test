import { columnBarBaseShape } from './bar-rect-shape';
import { merge } from '@antv/g2/lib/util';

/**
 * @param {content} chart
 */
export default function createStackRectShapeDraw(chart) {
    /**
     * 获取堆叠情况下的整个柱子大小
     * @param {Srting} xFieldValue
     */
    function getStackPonints(xFieldValue) {
        const xField = chart.metrics.xField;
        const dataArray = chart.geom.get('dataArray');

        const lastArray = dataArray[dataArray.length - 1];
        const startArray = dataArray[0];
        const getPointsByXFieldValue = (i) => i._origin[xField] === xFieldValue;

        const startPoints = startArray.find(getPointsByXFieldValue).points;
        const endPoints = lastArray.find(getPointsByXFieldValue).points;

        return [startPoints[0], endPoints[1], endPoints[2], startPoints[3]];
    }

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
        /**
         * 主绘制方法
         */
        draw(cfg, container) {
            /**
             * 1. 绘制裁剪背景对象
             */
            let clipGroup = container;
            let points = null;
            if (cfg.style.clipShape.enableClipShape) {
                clipGroup = this.createClipGroup(cfg, container);

                // 根据shape, 重置points
                if (cfg.style.clipShape.clipShapeRenderType !== 'contain') {
                    points = this.parseAndResetPoints(clipGroup.attr('clip'), cfg.points);
                }
            }

            // 2. 绘制长方形
            points = points || this.parsePoints(cfg.points);
            const shapeContaninter = this.createSpecialShape(clipGroup, points, {
                ...cfg.style.shape,
                style: {
                    ...cfg.style,
                    fill: cfg.color,
                    fillOpacity: cfg.opacity,
                },
            });

            // 返回长方形
            return shapeContaninter;
        },

        /**
         * 绘制背景裁剪对象
         */
        createClipGroup(cfg, container) {
            const containerId = cfg.origin._origin[chart.metrics.xField];
            let clipGroup = container.findById(containerId);
            if (!clipGroup) {
                /**
                 * 堆叠柱状图有数据高度和整个柱子区分
                 */
                let shapeRectInfo = null;
                if (cfg.style.clipShape.clipShapeHeight === 'height') {
                    const xFieldValue = cfg.origin._origin[chart.metrics.xField];
                    const points = getStackPonints(xFieldValue);
                    shapeRectInfo = this.buildRectPointInfo(points);
                    shapeRectInfo.shapeFullHeight = shapeRectInfo.shapeHeight;
                } else {
                    shapeRectInfo = this.buildRectPointInfo(cfg.points);
                }
                const clipShape = this.drawBackGroundClipShape(cfg, container, shapeRectInfo);
                clipGroup = container.addGroup({
                    id: containerId,
                    attrs: {
                        clip: clipShape,
                    },
                });
            }
            return clipGroup;
        },
    });
}
