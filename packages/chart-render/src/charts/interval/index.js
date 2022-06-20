import BaseColumn from '../../base/base-column/base-column';
import GroudBy from '../../controller/data/instructs/group-by';
import { merge } from '@antv/g2/lib/util';
import PrecentDecorator from '../../helpers/decorator/precent-decorator';

/**
 * @class GroupInterval
 */
@PrecentDecorator(false)
export default class GroupInterval extends BaseColumn {
    getDefaultModel() {
        const defaultM = super.getDefaultModel();
        return merge(defaultM, {
            settings: {
                autoItemMargin: false,
            },
            label: {
                offset: 0.09,
            },
        });
    }

    /**
     * @override
     */
    beforeInit() {
        this._initGroudpField();
        this.initGroudBy(); // 统计能力
        super.beforeInit();
    }

    /**
     * 初始化分组字段
     */
    _initGroudpField() {
        const { groudField, colorDimension, xField } = this.metrics;
        if (!groudField) {
            this.metrics.groudField =
                colorDimension !== xField ? colorDimension : this.getGroudField();
        }
        // 分组只能是分类类型
        this.model.scales = {
            [this.metrics.groudField]: {
                type: 'cat',
            },
        };
    }

    /**
     * 获取分组维度
     * 获取规则：获取除了xField，yField之外的第一个维度
     * TODO: 如果该维度不存在应该怎么办？
     */
    getGroudField() {
        const allDimension = this.$dataSetController.dimension;
        const { xField, yField } = this.metrics;
        return allDimension.filter((i) => ![xField, yField].includes(i))[0];
    }

    /**
     * 数据归类处理能力
     * 在数据处理过程中加入数据统计归类，用来帮助计算柱子数量，计算偏移数量
     */
    initGroudBy() {
        this.groudByInterval = new GroudBy();
        this.$dataSetController.registerTranform(this.groudByInterval);
    }

    /**
     * @override
     */
    getIntervalCount() {
        const group = this.groudByInterval.group;
        const groupKeys = Object.keys(group);
        const maxLenght = groupKeys.reduce((len, fieldName) => {
            const groudItemLen = group[fieldName].length;
            return len > groudItemLen ? len : groudItemLen;
        }, 0);
        return maxLenght * groupKeys.length;
    }

    /**
     * @override
     */
    _initGeom() {
        super._initGeom();
        this._resetRectShapePonint();
    }

    /**
     * @override
     */
    _initGeomStyle() {
        super._initGeomStyle();
        const { itemWidthRatio, itemMarginRatio, autoItemMargin } = this.model.settings;
        // 设置数据调整
        this.geom.adjust({
            type: 'dodge', // 分组
            dodgeBy: this.metrics.groudField, // 分组字段
            marginRatio: autoItemMargin ? 1 : itemMarginRatio, // 分组的间距
            dodgeRatio: autoItemMargin ? 0.5 : itemWidthRatio, // 每一柱子百分比
        });
    }

    /**
     * @hack
     * 重写计算矩形绘图关键节点方法
     */
    _resetRectShapePonint() {
        const self = this;

        /**
         * 获取当前柱子到中心柱子的距离index
         * @param {string} name 当前柱子的名称
         * @param {array} list 所有柱子集
         */
        function getDistanceIndexBy(name, list) {
            const index = list.findIndex((i) => i === name);
            return (list.length - 1) / 2 - index;
        }
        const _createShapePointsCfg = this.geom.createShapePointsCfg;
        this.geom.createShapePointsCfg = function createShapePointsCfg(obj) {
            const shapePoint = _createShapePointsCfg.call(this, obj);

            if (self.model.settings.autoItemMargin) {
                return shapePoint;
            }

            /***
             * G2中，每一条柱子大小都是经过调整的
             * 例如： 一个分组为一个整体 1， 有5个数据(5个柱子)， 每一个数据为 1 / 5 = 0.2 宽度
             *  那么 ‘数据宽度’ 为 0.2
             * ‘柱子宽度’ 为 0.2 * 0.5(默认值，柱子为数据宽度一半) = 0.1
             * ‘柱子之间的margin’ 为 ‘数据宽度’（0.2） * marginRatio
             *
             *
             * 为了解决宽度能够在图表小宽度下自适应，并且在图表大宽度下能够显示正常大小的柱子。
             * 1. 引入最大宽度变量，当 '柱子宽度': 0.1 * (实际整个分组宽度，单位px) > 最大宽度， 我们限制柱子的宽度为最大宽度
             * 2. 为了避免歧义，将margin含义改为， ‘柱子宽度’ * marginRatio，以前为 ‘数据宽度’ * marginRatio，
             *
             *
             * 对比，我们需要在绘制图形的时候，对柱子的位置进行调整。
             */
            const groudField = self.metrics.groudField;
            let tickValues = [];
            if (groudField) {
                tickValues = self.getScalesByField(groudField).values;
            }
            // ticks
            if (tickValues) {
                const distand = getDistanceIndexBy(obj[groudField], tickValues); // 计算当前柱子距离中心柱子的个数
                const size = self.computeNormalizedSize(); // g2生成的调整柱子比例
                const normSize = this.getNormalizedSize(obj); // 重写方法后，调整的柱子比例，加入了最大宽度限制
                // 柱子缩小了，需要偏移的柱子的缩放量
                const adjustSize = size - normSize;

                // margin 含义变了，还需要调整柱子的margin
                const adjustMargin = self.model.settings.itemMarginRatio * (size - normSize);
                // 计算公式
                shapePoint.x = shapePoint.x + distand * (adjustSize + adjustMargin);
            }

            return shapePoint;
        };
    }

    /**
     * @override
     * TODO: 设置分组距离
     */
    adjustColumnMargin() {}
}
