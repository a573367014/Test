// ------------------------------------
// schema modules
// ------------------------------------
export let schemaMap = {};
// if(process.env.NODE_ENV === 'development') {
schemaMap = (function getSchemasMap() {
    // const schemas = require.context('./', true, /schema.js$/);
    const schemas = import.meta.globEager('./*/*schema.js');

    console.log(schemas);
    return Object.keys(schemas).reduce((schemaObj, dirKey) => {
        const chartName = getHumpChartNameBydir(dirKey);
        if (chartName) {
            schemaObj[chartName] = schemas[dirKey].default;
        }
        return schemaObj;
    }, {});
})();
// }

// ------------------------------------
// chart modules
// ------------------------------------

const chartMap = {};
export default chartMap;

// static name
const CHART_TYPE_NAME = 'chartType';
const CHART_SETTINGS_SCHAMES = 'settingsSchemas';

/**
 * 遍历所有匹配到的文件
 */
// const charts = require.context('./', true, /index.js$/);
const charts = import.meta.globEager('./*/*index.js');
console.log(charts);
Object.keys(charts).forEach((key) => {
    // 根据目录获取图表类型名称
    const chartName = getHumpChartNameBydir(key);
    if (!chartName) return;

    // 获取图表构造函数
    const chartModule = charts[key].default || charts?.(key);

    // 设置构造函数的名称
    chartModule[CHART_TYPE_NAME] = chartName;
    chartMap[chartName] = chartModule;

    /**
     * 开发环境增加schema文件
     */
    // if(process.env.NODE_ENV === 'development') {
    const schemaModule = schemaMap[chartName];
    if (!schemaModule) {
        console.error('必须要有schemas文件');
    }
    chartModule[CHART_SETTINGS_SCHAMES] = schemaModule;
    // }
});

/**
 * 根据文件目录获取驼峰的文件夹名称
 * 文件文件路径获取文件夹名称，并转成驼峰
 * @param {string} d
 */
function getHumpChartNameBydir(d) {
    return toHump(getChartNameBydir(d));
}

/**
 * 根据目录文件获取文件夹
 * @param {string} dir
 */
function getChartNameBydir(dir) {
    const chartNameReg = /\/([\w|-]+)\/\w+.js$/;
    const group = chartNameReg.exec(dir);
    if (group === null) {
        return null;
    }
    return group[1];
}

/**
 * 中划线转驼峰
 * @param {string} name
 */
function toHump(name) {
    return (
        name &&
        name.replace(/-(\w)/g, function (all, letter) {
            return letter.toUpperCase();
        })
    );
}
