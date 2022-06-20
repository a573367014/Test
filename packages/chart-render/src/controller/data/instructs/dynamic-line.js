import InstructsBase from './base';
import { groupBy } from '../../../helpers/util';

// 将数据按照区间重新划分
export default class GroudBy extends InstructsBase {
    constructor({ groupKey, currentKey }) {
        super();
        this.groupKey = groupKey;
        this.currentKey = currentKey;
        this.startKeys = 0;
    }

    callback(dataSource, options) {
        this.options = options;
        const currentKey = this.currentKey;

        const { groupMap, keysList, valuesList } = groupBy(dataSource, (i) => i[this.groupKey]);

        this.group = groupMap;
        this.groupKeys = keysList;
        this.groupValues = valuesList;
        this.groupKeysLength = keysList.length;

        /**
         * init startKeyIndex
         * 默认最后一个
         */
        let startKeyIndex = keysList.findIndex((k) => k === currentKey);
        if (startKeyIndex === -1) {
            startKeyIndex = keysList.length - 1;
            this.currentKey = keysList[startKeyIndex];
        }
        this.startKeys = startKeyIndex;

        // 采用累加的方式做
        let dataList = [];
        while (startKeyIndex--) {
            dataList = valuesList[startKeyIndex].concat(dataList);
        }
        this.dataList = dataList;
        return dataList;
    }

    nextLoopKey() {
        let { startKeys, groupKeys } = this;
        startKeys++;
        // 循环
        if (startKeys >= groupKeys.length) {
            startKeys = 0;
            this.dataList = [];
        }
        this.startKeys = startKeys;
        this.currentKey = groupKeys[startKeys];
        return this.startKeys;
    }

    getLastValue() {
        const dataList = this.dataList;
        const dataItem = dataList[dataList.length - 1];
        if (dataItem) {
            return dataItem[this.options.yField];
        }
    }
}
