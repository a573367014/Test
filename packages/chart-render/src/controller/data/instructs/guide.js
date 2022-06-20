import InstructsBase from './base';

// 辅助信息
export default class Guide extends InstructsBase {
    constructor() {
        super();
        this.min = null;
        this.max = null;
    }

    callback(dataSource, options) {
        const yField = options.yField;
        const firstValue = dataSource[0][yField];

        //
        let min = firstValue;
        let max = firstValue;

        dataSource.forEach((item) => {
            const value = item[yField];
            if (value > max) {
                max = value;
            } else if (value < min) {
                min = value;
            }
        });

        this.max = max;
        this.min = min;

        return dataSource;
    }
}
