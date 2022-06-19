// 深遍历筛选对象属性
export function flattenPickValue(obj, picker) {
    let result = [];
    Object.entries(obj).forEach(([key, value]) => {
        if (typeof value === 'object') {
            result = result.concat(flattenPickValue(value, picker));
        }
        if (picker({ key, value })) {
            result.push(value);
        }
    });
    return result;
}
