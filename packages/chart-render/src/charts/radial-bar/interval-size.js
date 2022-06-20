import Interval from '@antv/g2/lib/geom/interval';

export default class IntervalRatioSize extends Interval {
    constructor(cfg) {
        super(cfg);

        /**
         * @override
         * 获取宽度size
         */
        this.getNormalizedSize = function () {
            const computeSize = this.computeNormalizedSize();
            const coordWidth = this._getWidth();
            const styleOptions = this.get('styleOptions');

            // 最大值
            const { itemMaxWidth } = (styleOptions && styleOptions.style) || {};
            const itemWidth = computeSize * coordWidth;

            // set maxSize
            if (itemWidth > itemMaxWidth) {
                return itemMaxWidth / coordWidth;
            }

            return computeSize;
        };
    }

    /**
     * 获取柱子具体宽度
     */
    getNormalWidthSize() {
        return this.getNormalizedSize() * this._getWidth();
    }

    /**
     * 计算柱子比例
     * @private
     */
    computeNormalizedSize() {
        const count = this.getIntervalCount();
        const styleOptions = this.get('styleOptions');
        const { itemWidthRatio } = (styleOptions && styleOptions.style) || {};

        // TODO:
        const scaleRange = 1;

        return (scaleRange / count) * itemWidthRatio;
    }

    /**
     * @private
     * 获取柱子数量
     */
    getIntervalCount() {
        return this.getXScale().ticks.length;
    }
}
