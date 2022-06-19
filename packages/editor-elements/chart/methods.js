/**
 * @class EditorChartElementMixin
 * @description 元素的专属方法
 */
import diffAndSwitchModel, { substituteModelKey } from './helper/diff-switch-chart';

export default {
    // TODO：增加图表
    // addChart(element) {},
    playAnimateChart(element) {
        const vm = this.getComponentById(element.$id);
        vm && vm.playAnimate();
    },
    pauseAnimateChart(element) {
        const vm = this.getComponentById(element.$id);
        vm && vm.pauseAnimate();
    },
    replayAnimateChart(element) {
        const vm = this.getComponentById(element.$id);
        vm && vm.replayAnimate();
    },

    /**
     * 改变图表元素的维度数据
     * 要卸载当前的元素，重新负值model，再实例化
     * @memberof EditorChartElementMixin
     * @param {ChartElement} element
     * @param {Object} obj
     * @param {Object} obj.metrics 数据维度描述
     * @param {Array} obj.chartData 数据对象
     */
    changeChartEffect(
        element,
        {
            metrics, // 纬度关系
            chartData, // 数据
            scales, // 列定义
        },
    ) {
        element.metrics = metrics;
        element.scales = scales;
        element.chartData = chartData;
    },

    /**
     * 对比编辑项，切换图表
     * @memberof EditorChartElementMixin
     * @param {ChartElement} chartElement 当前切换元素
     * @param {ChartElement} initialModel 当前元素的初始化数据
     * @param {ChartElement} changeModel 将要切换的目标对象
     * @param {Layout} layout 画布
     */
    switchChart(chartElement, initialModel, changeModel, layout = this.currentLayout) {
        const editor = this;
        // 对比不同
        const elemData = diffAndSwitchModel({
            currentModel: chartElement, // 当前元素
            initialModel: initialModel, // 当前对象的原对象
            changeModel: changeModel, // 要切换的对象
        });
        // 获取位置信息
        ['left', 'top', 'width', 'height', 'sceneId'].forEach((key) => {
            chartElement[key] && (elemData[key] = chartElement[key]);
        });

        // 创建元素
        // Todo: 要对兼容面板做设配大小
        const elem = editor.createElement(elemData);
        // 同步 metaInfo 信息
        elem.metaInfo = chartElement.metaInfo;
        // 置换modelKey
        substituteModelKey(chartElement, elem);
        // 删除元素。
        editor.removeElement(chartElement, layout);
        // 新增元素
        editor.addElement(elem, layout);
        // 聚焦元素
        editor.focusElement(elem, layout);

        // 返回
        return elem;
    },
};
