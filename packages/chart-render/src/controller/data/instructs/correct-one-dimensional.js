import InstructsBase from './base';

// 修改为一维数据
export default class CorrectOneDimensional extends InstructsBase {
    constructor(dimensionalField, saveDimensionalValue) {
        super();
        this.dimensionalField = dimensionalField;
        this.saveDimensionalValue = saveDimensionalValue;
    }

    callback(dataSource, options) {
        const xField = this.dimensionalField || options.xField;
        const xFieldColIndex = dataSource[0].findIndex((i) => i === xField);

        let firstXField = null;

        return dataSource.filter((row, index) => {
            if (index === 0) return true;

            if (!firstXField) {
                firstXField = row[xFieldColIndex];
                return true;
            }
            if (row[xFieldColIndex] === firstXField) {
                return true;
            }

            return false;
        });
    }
}
