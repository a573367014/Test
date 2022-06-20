/**
 * 生成随机id
 */
function buildRandomId() {
    return parseInt(Math.random() * 10000);
}

const hasOwnProperty = Object.prototype.hasOwnProperty;

/**
 * 分组
 * @param {} data
 * @param {*} condition
 */
const groupBy = function (data, condition, _push) {
    if (!condition || !Array.isArray(data)) {
        return data;
    }
    let key = null;
    const result = {};
    const keysList = [];
    const valuesList = [];
    data.forEach(function (item) {
        key = condition(item);
        if (hasOwnProperty.call(result, key)) {
            const valusArray = result[key];
            if (_push) {
                _push(valusArray, item);
            } else {
                valusArray.push(item);
            }
        } else {
            const valusArray = [item];
            keysList.push(key);
            valuesList.push(valusArray);
            result[key] = valusArray;
        }
    });
    return {
        groupMap: result,
        keysList: keysList,
        valuesList: valuesList,
    };
};

export { buildRandomId, hasOwnProperty, groupBy };
