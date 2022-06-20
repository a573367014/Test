import InstructsBase from './base';

export default class ComputePrecent extends InstructsBase {
    constructor(valueField) {
        super();

        this.valueField = valueField;
        this.computedMap = null;
    }

    callback(data, options) {
        const computedMap = (this.computedMap = new Map());
        const metricsField = options.colorDimension; // 类型
        const valueField = this.valueField || options.yField;

        //
        data.forEach((item) => {
            const metricsValue = item[metricsField];

            // 先设置
            if (!computedMap.has(metricsValue)) {
                computedMap.set(metricsValue, {
                    maxItem: item,
                    minItem: item,
                    average: 0,
                    allValue: 0,
                    dataLength: 0,
                });
            }
            // 获取
            const computedItem = computedMap.get(metricsValue);
            //
            const value = item[valueField];
            const maxValue = computedItem.maxItem[valueField];
            const minValue = computedItem.minItem[valueField];

            // 最大项
            if (value > maxValue) {
                computedItem.maxItem = item;
            } else if (value < minValue) {
                computedItem.minItem = item;
            }

            // 全数字
            computedItem.allValue += Number(value);
            computedItem.dataLength++;
        });
        // 计算
        computedMap.forEach((computedItem) => {
            computedItem.maxItem.__isMax = true;
            computedItem.minItem.__isMin = true;
            computedItem.average = computedItem.allValue / computedItem.dataLength;
        });

        return data;
    }

    // 获取最大值项
    getMaxItemByMetrics(metrics) {
        if (!this.computedMap || !this.computedMap.has(metrics)) return null;
        return this.computedMap.get(metrics).maxItem;
    }

    // 获取最小值项
    getMinItemByMetrics(metrics) {
        if (!this.computedMap || !this.computedMap.has(metrics)) return null;
        return this.computedMap.get(metrics).minItem;
    }

    // 获取平均值
    getAverageByMetrics(metrics) {
        if (!this.computedMap || !this.computedMap.has(metrics)) return null;
        return this.computedMap.get(metrics).average;
    }

    isMaxItem() {}
}
