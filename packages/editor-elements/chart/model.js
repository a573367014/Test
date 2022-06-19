import BaseModel from '@gaoding/editor-framework/src/base/element-base-model';

export default class ChartModel extends BaseModel {
    constructor(data) {
        if (typeof data.title === 'object' && !data.chartTitle) {
            data.chartTitle = data.title;
            delete data.title;
        }

        super(data);

        this.$loaded = false;

        // init colorType
        this.colorType = this.colorType || 0;
        this.scales = this.scales || {};
    }
}
