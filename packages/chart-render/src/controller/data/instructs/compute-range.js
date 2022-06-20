import InstructsBase from './base';

export default class ComputeRange extends InstructsBase {
    constructor({ startRangeKey, endRangKey, rangeKey } = {}) {
        super();
        this.startRangeKey = startRangeKey;
        this.endRangKey = endRangKey;
        this.rangeKey = rangeKey;
    }

    callback(data) {
        const { startRangeKey, endRangKey, rangeKey } = this;
        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            const startRangeValue = item[startRangeKey];
            const endRangValue = item[endRangKey];
            if (
                typeof startRangeValue === 'number' &&
                !isNaN(startRangeValue) &&
                typeof endRangValue === 'number' &&
                !isNaN(endRangValue)
            ) {
                item[rangeKey] = [startRangeValue, endRangValue];
            }
        }
        return data;
    }
}
