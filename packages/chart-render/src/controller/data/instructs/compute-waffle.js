import InstructsBase from './base';
import {
    isArray,
    isFunction,
    isString,
    groupBy,
    assign,
    each,
    forIn,
    keys,
    map,
    pick,
} from '@antv/g2/lib/util';

export default class ComputeRange extends InstructsBase {
    constructor({ yField, colorDimension, xField, maxCount, rows } = {}) {
        super();
        this.yField = yField;
        this.colorDimension = colorDimension;
        this.xField = xField;
        this.maxCount = maxCount;
        this.rows = rows;
    }

    callback(data) {
        const { xField, yField, colorDimension, maxCount, rows } = this;
        const option = {
            as: [xField, yField],
            fields: [colorDimension, yField],
            maxCount: parseInt(maxCount),
            rows: parseInt(rows), // 此处不取整会渲染错误
        };
        const dataArray = waffle(data, option);

        return dataArray;
    }
}

//  声明默认值
const DEFAULT_OPTIONS = {
    fields: ['name', 'value'], // fields
    rows: 20,
    size: [1, 1], // 画布宽高比
    scale: 1,
    groupBy: [],
    maxCount: 500, // 格子上限
    gapRatio: 0.1,
    as: ['x', 'y'],
};

function partition(rows, group_by, order_by) {
    let newRows = rows;
    if (order_by && order_by.length) {
        newRows = simpleSortBy(rows, order_by);
    }

    let groupingFn = '';

    if (isFunction(group_by)) {
        groupingFn = group_by;
    } else if (isArray(group_by)) {
        groupingFn = (row) => `_${group_by.map((col) => row[col]).join('-')}`;
        // NOTE: Object.keys({'b': 'b', '2': '2', '1': '1', 'a': 'a'}) => [ '1', '2', 'b', 'a' ]
        // that is why we have to add a prefix
    } else if (isString(group_by)) {
        groupingFn = (row) => `_${row[group_by]}`;
    }
    // 手动进行非空校验
    let groups = '';
    if (groupingFn) {
        groups = groupBy(newRows, groupingFn);
    }
    return groups;
}

function simpleSortBy(arr, keys) {
    let comparer = '';
    if (isFunction(keys)) {
        comparer = keys;
    } else if (isArray(keys)) {
        comparer = (a, b) => {
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                if (a[key] < b[key]) {
                    return -1;
                }
                if (a[key] > b[key]) {
                    return 1;
                }
            }
            return 0;
        };
    } else if (isString(keys)) {
        comparer = (a, b) => {
            if (a[keys] < b[keys]) {
                return -1;
            }
            if (a[keys] > b[keys]) {
                return 1;
            }
            return 0;
        };
    }
    return arr.sort(comparer);
}

// 数据转化方法
function waffle(data, option) {
    // let formatData = {};
    // const [X, Y] = option.as;
    // // 对数据先进行一层转化
    // formatData = data.map(function(item) {
    //     return {
    //         name: item[X],
    //         value: item[Y]
    //     };
    // });
    const options = assign({}, DEFAULT_OPTIONS, option);

    const fields = options.fields;
    const [nameField, valueField] = fields;
    const [asX, asY] = options.as;
    const groupBy = options.groupBy;
    const groups = partition(data, groupBy);
    const groupKeys = keys(groups);
    const [width, height] = options.size;
    const maxCount = options.maxCount;
    const groupCount = groupKeys.length;
    const partHeight = height / groupCount;
    const rows = options.rows;
    const gapRatio = options.gapRatio;
    const result = [];
    let scale = options.scale;
    let currentGroupIndex = 0;
    let wStep = 0;

    // getting suitable scale and width step
    forIn(groups, (group) => {
        const totalValue = sum(map(group, (row) => row[valueField]));
        let cols = Math.ceil((totalValue * scale) / rows);
        if (totalValue * scale > maxCount) {
            scale = maxCount / totalValue;
            cols = Math.ceil((totalValue * scale) / rows);
        }
        wStep = width / cols;
    });
    // distributing values into grid
    forIn(groups, (group) => {
        const heightRange = [currentGroupIndex * partHeight, (currentGroupIndex + 1) * partHeight];
        const h = heightRange[1] - heightRange[0];
        const hStep = (h * (1 - gapRatio)) / rows;
        let currentCol = 0;
        let currentRow = 0;
        each(group, (row) => {
            const value = row[valueField];
            const count = Math.round(value * scale);
            for (let i = 0; i < count; i++) {
                if (currentRow === rows) {
                    currentRow = 0;
                    currentCol++;
                }
                const resultRow = pick(row, [nameField, valueField].concat(groupBy));
                resultRow[asX] = currentCol * wStep + wStep / 2;
                resultRow[asY] = currentRow * hStep + hStep / 2 + heightRange[0];
                resultRow._wStep = wStep;
                resultRow._hStep = hStep;
                currentRow++;
                result.push(resultRow);
            }
        });
        currentGroupIndex += 1;
    });

    return result;
}

/**
 * Our default sum is the [Kahan-Babuska algorithm](https://pdfs.semanticscholar.org/1760/7d467cda1d0277ad272deb2113533131dc09.pdf).
 * This method is an improvement over the classical
 * [Kahan summation algorithm](https://en.wikipedia.org/wiki/Kahan_summation_algorithm).
 * It aims at computing the sum of a list of numbers while correcting for
 * floating-point errors. Traditionally, sums are calculated as many
 * successive additions, each one with its own floating-point roundoff. These
 * losses in precision add up as the number of numbers increases. This alternative
 * algorithm is more accurate than the simple way of calculating sums by simple
 * addition.
 *
 * This runs on `O(n)`, linear time in respect to the array.
 *
 * @param {Array<number>} x input
 * @return {number} sum of all input numbers
 * @example
 * sum([1, 2, 3]); // => 6
 */
function sum(x) {
    // If the array is empty, we needn't bother computing its sum
    if (x.length === 0) {
        return 0;
    }

    // Initializing the sum as the first number in the array
    let sum = x[0];

    // Keeping track of the floating-point error correction
    let correction = 0;

    let transition;

    for (let i = 1; i < x.length; i++) {
        transition = sum + x[i];

        // Here we need to update the correction in a different fashion
        // if the new absolute value is greater than the absolute sum
        if (Math.abs(sum) >= Math.abs(x[i])) {
            correction += sum - transition + x[i];
        } else {
            correction += x[i] - transition + sum;
        }

        sum = transition;
    }

    // Returning the corrected sum
    return sum + correction;
}
