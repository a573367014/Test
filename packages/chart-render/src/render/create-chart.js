/**
 *
 * 由于g2没有实现title，所以手动实现了title
 */

import Chart from './chart';
import Global from '@antv/g2/lib/global';
import gaodingTheme from './gd-theme';

Global.setTheme(gaodingTheme);

/**
 * 关闭所有的active
 * @param {} chart
 */
function closeActiveAndSelect(chart) {
    chart &&
        chart.getAllGeoms().forEach((geom) => {
            geom.active(false).select(false).tooltip(false);
        });
}

/**
 * 关闭所有交互模式
 * @param {G2Chart}} $chart
 */
function resetChartInteraction($chart) {
    // 关闭默认的交互模式
    $chart.tooltip(false);
    // 关闭所有geoms的交互
    closeActiveAndSelect($chart);
    // 在重新渲染之后
    $chart.on('afterdrawgeoms', closeActiveAndSelect.bind(null, $chart));
}

/**
 *
 * @param {Object} config
 */
export default function createChart({
    container,
    renderer,
    width,
    height,
    animate,
    padding,
    // pixelRatio
}) {
    // const pixelRatio = window.devicePixelRatio * (1 / 0.5);

    const $chart = new Chart({
        container,
        width,
        height,
        renderer, // : 'svg',
        animate: animate !== false, // 默认开启
        _autoPaddingAppend: padding,
        padding: 'auto',
        autoPaddingAppend: 0,

        // pixelRatio: 2,

        // 设置图表整体的边框和背景样式，是一个对象，包含如下属性：
        // background: {
        //     fill: { string }, // 图表背景色
        //     fillOpacity: { number }, // 图表背景透明度
        //     stroke: { string }, // 图表边框颜色
        //     strokeOpacity: { number }, // 图表边框透明度
        //     opacity: { number }, // 图表整体透明度
        //     lineWidth: { number }, // 图表边框粗度
        //     radius: { number } // 图表圆角大小
        // }

        // 图表绘图区域的边框和背景样式，是一个对象，包含如下属性
        // plotBackground: {
        //     fill: { string }, // 图表背景色
        //     fillOpacity: { number }, // 图表背景透明度
        //     stroke: { string }, // 图表边框颜色
        //     strokeOpacity: { number }, // 图表边框透明度
        //     opacity: { number }, // 图表整体透明度
        //     lineWidth: { number }, // 图表边框粗度
        //     radius: { number } // 图表圆角大小
        // }
    });

    /**
     * @hack
     * 由于canvas元素缩放导致位置获取不对
     * 需要对位置算上变形位置
     */
    // let $canvas = $chart.get('canvas');
    // $canvas.getPointByClient = function getPointByClient(clientX, clientY) {
    //     var el = this.get('el');
    //     var pixelRatio = this.get('pixelRatio') || 1;
    //     var bbox = el.getBoundingClientRect();
    //     var clientWidth = bbox.width;
    //     var clientHeight = bbox.height;
    //     var width = this.get('width');
    //     var height = this.get('height');

    //     // 变形问题
    //     return {
    //         x: (clientX - bbox.left) * pixelRatio * width / clientWidth,
    //         y: (clientY - bbox.top) * pixelRatio * height / clientHeight,
    //     };
    // };

    // 关闭图表的所有交互模式
    resetChartInteraction($chart);

    return $chart;
}
