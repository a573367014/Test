import InstructsBase from './base';
import { groupBy, clone, each } from '@antv/g2/lib/util';

// 将数据按照区间重新划分
export default class GroudBy extends InstructsBase {
    callback(dataSource, options) {
        this.group = groupBy(dataSource, (i) => i[options.xField]);
        this.options = clone(options);

        const ticks = {};
        dataSource.forEach((item) => {
            each(item, (value, key) => {
                if (!Array.isArray(ticks[key])) {
                    ticks[key] = [];
                }
                ticks[key].push(value);
            });
        });

        this.ticks = ticks;
        return dataSource;
    }
}
