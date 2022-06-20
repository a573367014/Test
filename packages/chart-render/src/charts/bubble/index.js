import Point from '../point';
import { merge } from '@antv/g2/lib/util';

/**
 * @class Bubble
 */
export default class Bubble extends Point {
    getDefaultModel() {
        const defaultModel = super.getDefaultModel();
        return merge(defaultModel, {
            settings: {
                minPointRadius: 10,
                maxPointRadius: 50,
            },
            label: {
                offset: 0,
            },
        });
    }

    /**
     * @override
     */
    _initGeomStyle() {
        super._initGeomStyle();
        const { minPointRadius, maxPointRadius } = this.model.settings;
        this.geom.size(this.metrics.sizeDimension, [minPointRadius, maxPointRadius]);
    }
}
