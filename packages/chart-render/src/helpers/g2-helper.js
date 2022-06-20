import { upperFirst } from '@antv/g2/lib/util';
import '@antv/g2/lib/geom/index';
import Shape from '@antv/g2/lib/geom//shape/shape';
import { buildRandomId } from './util';

/**
 * 注销图形
 * @param {string} factoryName
 * @param {string} shapeType
 */
function unregisterShape(factoryName, shapeType) {
    const className = upperFirst(factoryName);
    const factory = Shape[className];
    factory[shapeType] = null;
    delete factory[shapeType];
}

/**
 * 注册随机shape
 * @param {*} shapeType
 * @param {*} shapeObj
 * @returns {string} shapeType
 */
function registerRandomShape(factoryName, shapeObj) {
    // 随机名
    const shapeType = factoryName + buildRandomId();
    Shape.registerShape(factoryName, shapeType, shapeObj);
    // 删除
    return shapeType;
}

/**
 * 注册图例图形
 * @param {String} shapeMarkerName 图形名称
 * @param {Object} shapeObj 图形配置
 */
function registerPointShapeMarkerCfg(shapeMarkerName, shapeObj) {
    Shape.registerShape('point', shapeMarkerName, shapeObj);
    return shapeMarkerName;
}

/**
 * 获取内置图例图形配置
 * @param {String} shapeMarkerName 图形名称
 * @param {Object} cfg 预先配置
 */
function getShapeMarkerCfg(shapeMarkerName, cfg) {
    return Shape.getShapeFactory('point').getMarkerCfg(shapeMarkerName, cfg);
}

/**
 * 删除geom
 * @param {*} geom
 * @param {*} chart
 */
function removeGeom(geom, chart) {
    if (!geom) return;
    geom.destroy();
    const geoms = chart.get('geoms');
    chart.set(
        'geoms',
        geoms.filter((i) => i !== geom),
    );
}

/**
 * 修改chart的度量
 * @param {*} chart
 * @param {*} field
 * @param {*} config
 */
function changeChartScale(chart, field, config) {
    if (!field || !config || Object.keys(config).length === 0) return;
    // merge defaultConfig
    const defaultConfig = chart.get('options').scales[field] || {};
    Object.keys(config).forEach((key) => {
        defaultConfig[key] = config[key];
    });
    // 1. 设置options配置
    chart.scale(field, defaultConfig);
    // 2. 同步更改实例
    const fieldScale = chart.get('scales')[field];
    if (fieldScale) {
        fieldScale.change(defaultConfig);
    }
}

/**
 * 根据字段名称获取scales对象
 * @param {g2Chart} chart g2 chart 实例
 * @param {String} field 字段名称
 */
function getScalesByField(chart, field) {
    const data = chart.get('data');
    const scales = chart.get('scales') || {};
    if (!field) return null;
    return scales[field] || chart.createScale(field, data);
}

// 统一导出
export {
    unregisterShape,
    registerRandomShape,
    registerPointShapeMarkerCfg,
    getShapeMarkerCfg,
    removeGeom,
    getScalesByField,
    changeChartScale,
};
