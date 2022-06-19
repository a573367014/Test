import { set, isPlainObject } from 'lodash';

/**
 * 需要遍历缩放的初始字段
 */
const scalePropsList = [
    'chartTitle', // 标题
    'legend', // 图例
    'label', // 数据显示
    'xAxis', // X坐标轴
    'yAxis', // y坐标轴
    'settings', // settings
];

/**
 * 计算边界值
 * @param {Number} value 值
 * @param {Number} min 最小值
 * @param {Number} max 最大值
 * @returns {Number} 边界值
 */
const getValueFrontier = (value, min, max) => {
    return min ? Math.max(min, value) : max ? Math.min(max, value) : value;
};

/**
 * 设置比例缩放
 * @param {Object} source 对象
 * @param {String} key 属性
 * @param {Number} value 属性值
 * @param {object} param
 * @param {Number} param.min 最小值
 * @param {Number} param.max 最大值
 * @param {Number} param.ratio 比例
 */
function setScaleRatio(source, key, value, { max, min, ratio }) {
    if (value && parseFloat(value) > 0) {
        // 1. 计算比例，取整
        let scaledValue = Math.round(parseFloat(value) * ratio);
        // 2. 获取最大最小边界值
        scaledValue = getValueFrontier(scaledValue, min, max);
        // 3. 设置
        set(source, key, scaledValue);
    }
    return source;
}

/**
 * 递归寻找字段
 * @param {Object} obj
 * @param {Array} props
 * @param {Function} callback
 */
const findPropDeep = (obj, props, callback) => {
    // 非纯对象禁止查找
    if (!isPlainObject(obj)) return obj;

    // 遍历
    Object.keys(obj).forEach((propKey) => {
        const propValue = obj[propKey];
        // 1. 当前字段是否是需要缩放的字段
        if (props.includes(propKey)) {
            callback(obj, propKey, propValue);
        }
        // 2. 判断当前字段是否是纯对象
        else {
            findPropDeep(propValue, props, callback);
        }
    });
};

/**
 * 将制定字段进行缩放
 * @param {Object} model
 * @param {Number} ratio
 * @param {Object} scaleKeyMap
 */
export function resizeChart(
    model,
    ratio,
    scaleKeyMap = {
        lineWidth: {
            min: 1,
        },
        fontSize: {
            min: 1,
        },
        pointRadius: {
            min: 1,
        },
    },
) {
    ratio = ratio || 1;
    if (ratio === 1) return model;

    const props = Object.keys(scaleKeyMap);
    // 获取
    const getScaleRuleByKey = (key) => ({
        ratio,
        ...scaleKeyMap[key],
    });

    // 遍历初始值
    scalePropsList.forEach((scaleKey) => {
        const scaleValue = model[scaleKey];
        if (!scaleValue) return;

        // 如果存在
        if (props.includes(scaleKey)) {
            setScaleRatio(model, scaleKey, scaleValue, getScaleRuleByKey(scaleKey));
        } else if (isPlainObject(scaleValue)) {
            /**
             * 进行深度遍历查找
             */
            findPropDeep(scaleValue, props, (source, key, value) => {
                setScaleRatio(source, key, value, getScaleRuleByKey(key));
            });
        }
    });

    return model;
}
