import chartClassMap from './charts/index';
import { merge } from '@antv/g2/lib/util';

const toLocaleLowerCaseType = (i) => String(i).toLocaleLowerCase();
const CHART_CTOR_MAP = {};
Object.keys(chartClassMap).forEach((key) => {
    const type = toLocaleLowerCaseType(key);
    CHART_CTOR_MAP[type] = chartClassMap[key];
});

/**
 * 获取构造函数
 * @param {string} type
 * @returns {GeomClass} 图表类
 */
function getChartByType(type) {
    type = toLocaleLowerCaseType(type);
    if (!type || !CHART_CTOR_MAP[type]) {
        throw Error('type, 请检查类型');
    }
    return CHART_CTOR_MAP[type];
}

/**
 * 获取图表类型Settings的Schemas配置
 * @param {string} type
 * @returns {Array}
 */
function getSettingsSchemasByType(type) {
    const Ctor = this.getChartByType(type);
    return Ctor ? Ctor.settingsSchemas : [];
}

/**
 * 主方法
 * 创建render
 * @public
 * @param {element} 元素
 * @param {Object} 渲染model
 */
export default function chartRender(container, model) {
    // 兼容 model 层新的标题数据格式
    if (typeof model.chartTitle === 'object') {
        model = { ...model };
        model.title = model.chartTitle;
    }

    const type = toLocaleLowerCaseType(model.chartType);
    // 检查是否支持该类型
    if (!type || !CHART_CTOR_MAP[type]) {
        return Promise.reject(new Error(`暂时不支持${type}类型渲染`));
    }
    // get controll and init
    const ChartTypeCtor = CHART_CTOR_MAP[type];
    try {
        const chartTypeController = new ChartTypeCtor(container, model);
        chartTypeController.render(); // render
        chartTypeController._Ctor = ChartTypeCtor; // save controller
        return Promise.resolve(chartTypeController);
    } catch (e) {
        return Promise.reject(e);
    }
}

/**
 * 扩展chartRender的其他能力
 */
merge(chartRender, {
    getChartByType,
    getSettingsSchemasByType,
});

export { getChartByType, getSettingsSchemasByType };
