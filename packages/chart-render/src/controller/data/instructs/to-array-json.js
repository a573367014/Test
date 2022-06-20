import InstructsBase from './base';
import { isEmpty } from '@antv/g2/lib/util';
import { SCALE_TYPES } from '../../../helpers/constants';

export default class ToArrayJson extends InstructsBase {
    callback(data, options, scales) {
        return this.connectorArray(data, options, scales);
    }

    /**
     * 将数据从tableArray转换为tableJson
     * Todo: 大数据量计算优化
     * @example
     * let data = [['', '苹果', '香蕉']，['2011', 20, 30]]
     * tableArrayConnector(data)
     * // return [{column: '苹果', type: '2011', value: 20}, [{column: '香蕉', row: '2011', value: 30}]
     * @param [Array] data tableArray
     * @returns [Array] tableJson
     *
     *
     */
    connectorArray(data, options, scales = {}) {
        const headerNameRow = data.shift();
        const columnTableData = [];
        data.forEach((row) => {
            const rowObj = {};
            row.forEach((value, index) => {
                const columnName = headerNameRow[index];
                const formatCallback = this.getFormatByScales(
                    scales[columnName],
                    columnName,
                    options,
                );
                if (value !== undefined && value !== null && value !== '' && columnName) {
                    rowObj[columnName] = formatCallback(value);
                }
            });
            if (!isEmpty(rowObj)) {
                columnTableData.push(rowObj);
            }
        });
        return columnTableData;
    }

    getFormatByScales(scale, columnName, { yField }) {
        const scaleType = scale && scale.type;
        // 尝试转换为数字
        const TryToNumber = (value) => (isNaN(Number(value)) ? value : Number(value));
        const ToString = (value) => String(value);
        const noop = (i) => i;
        const isYFieldColumn = (n) =>
            Array.isArray(yField) ? yField.includes(n) : yField === columnName;
        // 如果没有列描述，如果是y轴会尝试转换数字
        if (!scaleType && isYFieldColumn(columnName)) {
            return TryToNumber;
        } else if (scaleType === SCALE_TYPES.LINEAR) {
            return TryToNumber;
        } else if (scaleType === SCALE_TYPES.CAT) {
            return ToString;
        } else {
            return noop;
        }
    }
}
