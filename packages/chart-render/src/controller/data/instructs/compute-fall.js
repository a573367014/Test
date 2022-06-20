import InstructsBase from './base';
import { cloneDeep, isArray } from '@antv/g2/lib/util';
import { getAllCount } from './compute-precent';

export default class ComputeFall extends InstructsBase {
    constructor({ rangeKey, valueKey } = {}) {
        super();
        this.rangeKey = rangeKey; // 赋值百分比的key
        this.valueKey = valueKey;
        this.sumName = '总数';
    }

    callback(data, options) {
        const { xField, yField } = options;
        const valueKey = this.valueKey || yField;
        const rangeKey = this.rangeKey || yField;
        const sumName = this.sumName;

        // 总value
        const allValue = (this.allValue = getAllCount(data, valueKey));

        // 总数量在前，总数量再后？
        // 目前统一在前
        const isBefore = true;

        const sunDataItem = {
            ...cloneDeep(data[0]),
            [xField]: sumName,
            [valueKey]: allValue,
        };

        if (isBefore) {
            // 注入到第一个
            data.unshift(sunDataItem);

            for (let i = 0; i < data.length; i++) {
                const item = data[i];
                if (i > 0 && i < data.length - 1) {
                    const beforeItem = data[i - 1];
                    const rangeValues = beforeItem[rangeKey];

                    // 计算区间
                    const beforeValue = isArray(rangeValues)
                        ? rangeValues[0]
                        : beforeItem[valueKey];

                    item[rangeKey] = [beforeValue - item[valueKey], beforeValue];
                }
            }
        } else {
            // 注入到最后一个
            data.push(sunDataItem);
            for (let i = 0; i < data.length; i++) {
                const item = data[i];
                if (i > 0 && i < data.length - 1) {
                    const beforeItem = data[i - 1];
                    const rangeValues = beforeItem[rangeKey];

                    // 计算区间
                    const beforeValue = isArray(rangeValues)
                        ? rangeValues[1]
                        : beforeItem[valueKey];

                    item[rangeKey] = [beforeValue, beforeValue + item[valueKey]];
                }
            }
        }
        return data;
    }
}
