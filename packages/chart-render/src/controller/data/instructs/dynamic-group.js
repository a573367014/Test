import InstructsBase from './base';
import { clone } from '@antv/g2/lib/util';
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
        this.options = clone(options);
        const yFieldName = options.yField;
        const currentKey = this.currentKey;

        const getFieldValue = (item) => item[yFieldName];

        const { groupMap, keysList, valuesList } = groupBy(
            dataSource,
            (i) => i[this.groupKey],
            // 插入，间接实现插排
            // 优化性能
            (valusArray, item) => {
                let index = valusArray.length - 1;
                const itemValue = getFieldValue(item);
                while (index >= 0) {
                    const headItemValue = getFieldValue(valusArray[index]);
                    if (itemValue > headItemValue) {
                        break;
                    }
                    index--;
                }
                valusArray.splice(index + 1, 0, item);
            },
        );

        this.group = groupMap;
        this.groupKeys = keysList;
        this.groupValues = valuesList;
        this.groupKeysLength = keysList.length;

        /**
         * init startKeyIndex
         */
        let startKeyIndex = keysList.findIndex((k) => k === currentKey);
        if (startKeyIndex === -1) {
            startKeyIndex = this.groupKeys.length - 1;
            this.currentKey = this.groupKeys[startKeyIndex];
        }
        this.startKeys = startKeyIndex;

        return this.groupValues[startKeyIndex];
    }

    nextLoopKey() {
        let { startKeys, groupKeys } = this;
        startKeys++;
        // 循环
        if (startKeys >= groupKeys.length) {
            startKeys = 0;
        }
        this.startKeys = startKeys;
        this.currentKey = groupKeys[startKeys];
        return this.startKeys;
    }
}
