import { set, isPlainObject, pick } from 'lodash';

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
export function scale(model, ratio = 1, scaleKeyMap) {
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

/**
 * 获取场景宽高较小项，作为缩放对比基准
 */
function getMinScale({ width, height }) {
    return width <= height ? ['width', width] : ['height', height];
}

/**
 * 是否属于正常的范围内
 */
function isNormalRange([minScaleProp, minValue], minScene, maxScene) {
    return minScene[minScaleProp] <= minValue && minValue <= maxScene[minScaleProp];
}

/**
 * 获取画布与最小值的比例
 */
function getMinRatio([minScaleProp, minValue], minScene) {
    return minValue / minScene[minScaleProp];
}

/**
 * 获取画布的百分之90的缩放比
 */
function getNormalRatio([minScaleProp, minValue], modelScene) {
    const normalRatio = 0.9;
    return (minValue * normalRatio) / modelScene[minScaleProp];
}

/**
 *
 * 适配场景
 * @param {Object} chartModel
 * @param {Object} layoutScene 画布大小
 */
export default function sceneAutoAdapter(material, layoutScene) {
    // 当前画布的大小
    // 当前自己的大小

    let chartModel = material.model;
    // ----------------------------------
    // 逻辑
    // ----------------------------------

    // 1. 在合理的范围内正常显示。
    // 宽度 1080 - 1920
    // 高度 715 - 1080
    // 最大范围场景
    const chartMaxScene = {
        width: 1920,
        height: 1080,
    };
    // 最小范围场景
    const chartMinScene = {
        width: 1280,
        height: 715,
    };
    const minScale = getMinScale(layoutScene);
    if (isNormalRange(minScale, chartMinScene, chartMaxScene)) {
        return chartModel;
    }

    // 2. 获取缩放比
    let chartRatio = getMinRatio(minScale, chartMinScene, chartMaxScene);

    // 3，如果比例太小，小于0.48
    // 计算一个相对画布百分之90的比例，避免缩放过小
    const minRatio = 0.48;
    if (chartRatio < minRatio) {
        chartRatio = getNormalRatio(minScale, pick(chartModel, ['width', 'height']));
    }

    // 4. 暂时设置比例值最小为0.3
    // TODO:
    // 后期开发设计师后台设置图表最小最大宽高
    // 比例值到了一定程度， 还要将有文字的那些给隐藏掉。
    chartRatio = Math.max(0.3, chartRatio);

    // 5. 设置字段比例
    chartModel = scale(chartModel, chartRatio, {
        fontSize: {
            min: 12,
        },
        pointRadius: {
            min: 1,
        },
    });
    // 设置元素宽高自适应
    chartModel.width = chartModel.width * chartRatio;
    chartModel.height = chartModel.height * chartRatio;

    return chartModel;
}
