import BaseColumn from '../../base/base-column/base-column';
import GroudBy from '../../controller/data/instructs/group-by';
import { merge } from '@antv/g2/lib/util';
import LabelController from '../../controller/label/index';
import createStackRectShapeDraw from '../../render/shape/stack-column-shape';
import PrecentDecorator from '../../helpers/decorator/precent-decorator';

/**
 * @class StackInterval
 */
@PrecentDecorator(false)
class StackInterval extends BaseColumn {
    getDefaultModel() {
        const defaultModel = super.getDefaultModel();
        return merge(defaultModel, {
            label: {
                offset: -1.34,
            },
        });
    }

    /**
     * @override
     */
    beforeInit() {
        this.metrics.precentGroupKey = this.metrics.xField;
        this.initGroudBy(); // 统计能力
        super.beforeInit();
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
     * init label
     * @override
     */
    _initLabel() {
        const { metrics } = this;
        this.$labelController = new LabelController(this.model.label, metrics.yField, this.geom);
        this._setLabelFormatter(this.model.settings.isTransformPercent);
    }

    /**
     * @override
     */
    _initGeomStyle() {
        super._initGeomStyle();
        this.geom.adjust({
            type: 'stack', // 调整分组
            reverseOrder: false, // 颠倒数据
        });
    }

    /**
     * @override
     */
    _createShape() {
        return createStackRectShapeDraw(this);
    }
}

export default StackInterval;
