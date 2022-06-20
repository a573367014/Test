import BaseChart from '../base-chart';
import LabelController from '../../controller/label/index';
import { registerRandomShape, unregisterShape } from '../../helpers/g2-helper';
import createColumnRectShapeDraw from '../../render/shape/column-rect-shape';
import columnSchema from './base-schema';
import { getDefaultBySchema } from '../../helpers/schema';
import { merge, pick } from '@antv/g2/lib/util';
/**
 * @class BaseColumn
 */
export default class BaseColumn extends BaseChart {
    getDefaultModel() {
        return {
            settings: {
                isTransformPercent: false,
                itemTopRadiusRatio: 0,
                itemBottomRadiusRatio: 0,
                itemWidthRatio: 0.5,
                itemMaxWidth: 100,
                autoItemMargin: true,
                itemMarginRatio: 0.3,
                itemborderWidth: 0,
                itemborderColor: '#ccccccff',
                clipShapeRenderType: 'height',
            },
        };
    }

    beforeInit() {
        this.model.settings = merge(getDefaultBySchema(columnSchema), this.model.settings);
        this._intervalShapeName = this._registerShape(); // 注册图形
    }

    /**
     * 不采用G2 label, 自己重新画
     * @override
     */
    _initLabel() {
        this.$labelController = new LabelController(this.model.label, this.metrics.yField);
    }

    /**
     * 初始化图形
     * @override
     */
    _initGeom() {
        this.geom = this.chart.interval();
        this._resetGetNormalizedSize();
    }

    /**
     * @override
     */
    _initGeomStyle() {
        if (!this.geom) return;
        const {
            itemborderWidth,
            itemborderColor,
            itemTopRadiusRatio,
            itemBottomRadiusRatio,
            opacity,
        } = this.model.settings;
        const itemTopRadiusRatioPrecent = itemTopRadiusRatio + '%';
        const itemBottomRadiusRatioPrecent = itemBottomRadiusRatio + '%';

        // 声明shape
        this.geom.style({
            lineWidth: itemborderWidth,
            stroke: itemborderColor,
            radius: [
                itemTopRadiusRatioPrecent,
                itemTopRadiusRatioPrecent,
                itemBottomRadiusRatioPrecent,
                itemBottomRadiusRatioPrecent,
            ],

            shape: pick(this.model.settings, [
                'specialShape',
                'autoReverse',
                'shapePath',
                'shapeRenderType',
                'shapeRenderSize',
                'opacity',
            ]),
            // 裁剪配置
            clipShape: pick(this.model.settings, [
                'clipShapeHeight', // 堆叠柱状图专有字段
                'enableClipShape',
                'clipShapePath',
                'clipShapeRenderType',
                'clipShapeRenderSize',

                'autoFillColor',
                'clipShapeColor',
                'clipShapeOpacity',
                'clipShapeBorderColor',
                'clipShapeBorderWidth',
            ]),
        });
        if (opacity !== undefined) {
            this.geom.opacity(opacity);
        }

        // 注册图形
        if (this._intervalShapeName) {
            this.geom.shape(this._intervalShapeName);
        }

        // 调整间距
        this.adjustColumnMargin();
    }

    /**
     * @override
     */
    _initScalse() {
        const self = this;
        /**
         * @hack
         * 针对柱状图进行居中调整
         */
        this.chart._setCatScalesRange = function () {
            const {
                startRange = 0,
                endRange = 1,
                allRange = 1,
            } = self.getDeaultRangeWithInterval();
            const scale = this.getXScale();
            let range;
            if ((scale.isCategory || scale.isIdentity) && scale.values) {
                const count = scale.values.length;
                if (count === 1) {
                    // 居中状态
                    range = [startRange + allRange / 2, endRange];
                } else {
                    // 两边留下分类空间的一半
                    let offset = 0;
                    offset = ((allRange / count) * 1) / 2;
                    // 坐标轴最前面和最后面留下空白防止绘制柱状图时
                    range = [startRange + offset, endRange - offset];
                }
                scale.range = range;
            }
        };
        super._initScalse();
    }

    /**
     * 重写获取调整宽度的设置，加入最大宽度配置
     * @private
     */
    _resetGetNormalizedSize() {
        const _getNormalizedSize = this.geom.getNormalizedSize;

        /**
         * @hack
         * 获取宽度
         */
        const self = this;
        this.geom.getNormalizedSize = function getNormalizedSize() {
            const computeSize = self.computeNormalizedSize();
            const coordWidth = this._getWidth();
            const itemWidth = computeSize * coordWidth;

            const itemMaxWidth = self.model.settings.itemMaxWidth;
            // set maxSize
            if (itemWidth > itemMaxWidth) {
                return itemMaxWidth / coordWidth;
            }
            return computeSize;
        };
    }

    /**
     * 计算柱子宽度
     * @private
     */
    computeNormalizedSize() {
        const { model } = this;
        const { allRange } = this.getDeaultRangeWithInterval();
        const intervalCount = this.getIntervalCount();
        // TODO, 后期开放控制
        const scaleRange = allRange;
        return (scaleRange / intervalCount) * model.settings.itemWidthRatio;
    }

    /**
     * @private
     * 获取柱子数量
     */
    getIntervalCount() {
        return this.getScalesByField(this.metrics.xField).values.length;
    }

    /**
     * 获取x坐标轴控制器
     * @private
     */
    getXScaleAxisController() {
        const { geom, $xAxisController, $yAxisController } = this;
        if (geom) {
            const XScale = geom.getXScale();
            return $xAxisController.field === XScale.field ? $xAxisController : $yAxisController;
        }
        return $xAxisController;
    }

    getYScaleAxisController() {
        const { geom, $xAxisController, $yAxisController } = this;
        if (geom) {
            const YScale = geom.getYScale();
            return $yAxisController.field === YScale.field ? $yAxisController : $xAxisController;
        }
        return $yAxisController;
    }

    /**
     * 获取默认的渲染范围
     * @private
     */
    getDeaultRangeWithInterval() {
        let { startRange = 0, endRange = 1 } = this.getXScaleAxisController().config;
        if (startRange === null) {
            startRange = 0;
        }
        if (endRange === null) {
            endRange = 1;
        }
        return {
            startRange,
            endRange,
            allRange: endRange - startRange,
        };
    }

    /**
     * 注册核心绘制方法
     * 增加绘制radius
     */
    _registerShape() {
        const factoryName = 'interval';
        // 先注销
        if (this._intervalShapeName) {
            unregisterShape(factoryName, this._intervalRadiusShape);
        }
        const shapeConfig = this._createShape();
        if (shapeConfig) {
            return registerRandomShape(factoryName, shapeConfig);
        }
    }

    /**
     * 创建图形对象
     */
    _createShape() {
        return createColumnRectShapeDraw(this);
    }

    /**
     * 销毁注册
     */
    beforeDestroy() {
        unregisterShape('interval', this._intervalShapeName);
    }

    /**
     * @override
     * @param {object} settings
     */
    changeSettings(settings) {
        super.changeSettings(settings);
        this._initGeomStyle();
        this.chart.repaint();
    }

    /**
     * 监听渲染事件，对数据进行调整
     * 1. 比如： 调整宽度的时候，要进行重新计算
     */
    adjustColumnMargin() {
        /**
         * @hack
         */
        this.chart.on('beforepaint', this._adjustScalse.bind(this));
    }

    /**
     * 调整区间
     * @hack
     */
    _adjustScalse() {
        const { itemWidthRatio, itemMarginRatio, autoItemMargin } = this.model.settings;
        if (autoItemMargin === true) return;

        // 当前的渲染范围
        const XScale = this.geom.getXScale();
        const [rangeMin, rangMax] = XScale.range;

        // 当前分组（柱子）数量
        const intervalCount = XScale.values.length;
        const normalSize = this.geom.getNormalizedSize(); // 调整后的比例

        // 柱子宽度
        // 每一个柱子大小比例,
        const { startRange = 0, endRange = 1, allRange = 1 } = this.getDeaultRangeWithInterval();

        let IntervalWidth = itemWidthRatio * (allRange / intervalCount);
        // 如果柱子宽度大于调整后的宽度，采用调整后的宽度
        if (IntervalWidth >= normalSize) {
            IntervalWidth = normalSize;
        }

        // 计算出正确的分组宽度
        // 分组宽度 = 柱子的宽度 + 柱子间距宽度
        const ScaleWidth = IntervalWidth + IntervalWidth * itemMarginRatio;

        const range = (allRange - ScaleWidth * (intervalCount - 1)) / 2;
        this._rangeMin = startRange + range;
        this._rangeMax = endRange - range;

        if (
            this._rangeMax > this._rangeMin &&
            (this._rangeMin !== rangeMin || this._rangeMax !== rangMax)
        ) {
            XScale.change({
                range: [this._rangeMin, this._rangeMax],
            });
        }
    }
}
