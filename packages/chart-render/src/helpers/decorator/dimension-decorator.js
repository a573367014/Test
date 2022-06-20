const TwoDimension = 'twoDimension';
const ThreeDimension = 'threeDimension';

export { TwoDimension, ThreeDimension };

export default function DimensionRevise(dimModel) {
    function initTwoMetrice(metrics) {
        const { colorDimension, xField } = metrics;
        // const xFieldAndColorDimension;
        if (!xField) {
            metrics.xField = colorDimension;
        } else if (!colorDimension) {
            metrics.colorDimension = xField;
        } else if (xField !== colorDimension) {
            metrics.xField = colorDimension;
        }
        return metrics;
    }

    return function (target) {
        const _initMetrice = target.prototype.initMetrice;
        /**
         * @override
         */
        target.prototype.initMetrice = function () {
            _initMetrice.call(this);
            if (dimModel === TwoDimension) {
                initTwoMetrice(this.metrics);
            }
        };
    };
}
