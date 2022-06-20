import BaseColumn from '../../base/base-column/base-column';
import { merge } from '@antv/g2/lib/util';
import DimensionRevise, { TwoDimension } from '../../helpers/decorator/dimension-decorator';

/**
 * 基础柱状图
 * @class Column
 */
@DimensionRevise(TwoDimension)
export default class Column extends BaseColumn {
    getDefaultModel() {
        const defaultModel = super.getDefaultModel();
        return merge(defaultModel, {
            label: {
                offset: 0.09,
            },
        });
    }
}
