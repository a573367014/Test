import InstructsBase from './base';
import { groupBy } from '@antv/g2/lib/util';

export function getAllCount(data, computeKey) {
    return data.reduce((all, item) => {
        let computeValue = Number(item[computeKey]);
        if (isNaN(computeValue)) {
            computeValue = 0;
        }
        return all + Math.abs(computeValue);
    }, 0);
}

function getPrecentValue(allCount, value) {
    value = Number(value);
    if (isNaN(value)) {
        value = 0;
    }
    const precent = Math.round((value / allCount) * 10000);
    return precent / 100;
}

function computePrecent(data, computeKey, precentKey) {
    if (data.length === 1 && data[0][computeKey] <= 100) {
        const item = data[0];
        item[precentKey] = Number(item[computeKey]);
        return;
    }
    const allCount = getAllCount(data, computeKey);
    const lastIndex = data.length - 1;
    let reduceCount = 0;

    data.forEach((item, index) => {
        if (index === lastIndex) {
            item[precentKey] = (10000 - reduceCount) / 100;
        } else {
            const precentValue = getPrecentValue(allCount, item[computeKey]);
            item[precentKey] = precentValue;
            reduceCount = reduceCount + Math.floor(precentValue * 100);
        }
    });
}

export default class ComputePrecent extends InstructsBase {
    constructor(keyName = 'precent', { groupByKey, computeKey, open }) {
        super();
        this.precentKey = keyName; // 赋值百分比的key
        this.computeKey = computeKey; // 计算百分比的key
        this.groupByKey = groupByKey; // 计算百分比的分组
        this.open = open || false;
    }

    callback(data) {
        if (!this.open) return data;

        // 进行分组
        const { groupByKey, computeKey, precentKey } = this;
        const fieldGroup = groupByKey ? groupBy(data, (i) => i[groupByKey]) : {};
        const fieldGroupKey = Object.keys(fieldGroup);

        if (groupByKey && fieldGroupKey.length > 0) {
            fieldGroupKey.forEach((type) => {
                computePrecent(fieldGroup[type], computeKey, precentKey);
            });
        } else {
            computePrecent(data, computeKey, precentKey);
        }

        return data;
    }
}
