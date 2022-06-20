import Mirror from '@antv/g2/lib/facet/mirror';
import { getScalesByField } from '../../helpers/g2-helper';
import { BBox, getFont } from '../../helpers/axis';
import { isNil } from '@antv/g2/lib/util';

const isLeftAxis = (axis) =>
    axis && axis.label && (axis.position ? ['left', 'bottom'].includes(axis.position) : true);

export default class MyMirror extends Mirror {
    FacetNumber = 2;

    /**
     * 获取字段对应的值
     * @protected
     * @param  {String} field 字段名
     * @param  {Array} data 数据
     * @return {Array} 字段对应的值
     */
    getFieldValues(field, data) {
        const rst = [];
        const tmpMap = {};
        for (let i = 0; i < data.length; i++) {
            const obj = data[i];
            const value = obj[field];
            if (!isNil(value) && !tmpMap[value]) {
                rst.push(value);
                tmpMap[value] = true;
            }
            if (rst.length >= this.FacetNumber) {
                return rst;
            }
        }
        return rst;
    }

    /**
     * @override
     */
    initViews() {
        const chart = this.chart;
        const data = chart.get('data');
        const eachView = this.eachView;
        const facets = this.generateFacets(data);
        this.beforeEachView && this.beforeEachView(facets);
        const margin = this.margin / 2;

        const maxLength = Math.min(facets.length, this.FacetNumber);
        for (let i = 0; i < maxLength; i++) {
            const isMainView = i === 0;
            const facet = facets[i];
            const region = facet.region;
            const padding = [0, isMainView ? margin : 0, 0, !isMainView ? margin : 0];
            const view = chart.view({
                start: region.start,
                end: region.end,
                padding: padding,
            });
            view._setCatScalesRange = function () {
                const scale = this.getXScale();
                const [startRange = 0, endRange = 1] = scale.range;
                const allRange = endRange - startRange;

                if ((scale.isCategory || scale.isIdentity) && scale.values && !scale.__hasAdjust) {
                    const count = scale.values.length;
                    let range;
                    if (count === 1) {
                        // 居中状态
                        range = [startRange + allRange / 2, endRange];
                    } else {
                        // 两边留下分类空间的一半
                        const offset = ((1 / count) * 1) / 2;
                        // 坐标轴最前面和最后面留下空白防止绘制柱状图时
                        range = [startRange + offset, endRange - offset];
                    }
                    scale.range = range;
                    scale.__hasAdjust = true;
                }
            };
            facet.view = view;
            view.isMainView = isMainView;
            view.source(facet.data);
            view.scale(chart.get('options').scales);
            this.beforeProcessView(view, facet);
            if (eachView) {
                eachView(view, facet);
            }
            this.afterProcessView(view, facet);
        }
        this.facets = facets;
        this.adjustViewPadding();
        this.afterEachView && this.afterEachView(facets);
    }

    /**
     * 调整viewpadding
     */
    adjustViewPadding() {
        const minMargin = this.getMainViewMaxLableWidth();
        if (minMargin > this.margin) {
            this._changeMargin(minMargin);
        }
    }

    /**
     * 获取view的label最大宽度
     * @param {View} mainView
     * @param {TextStyle} labelStyle
     */
    getMainViewMaxLableWidth(mainView, labelStyle) {
        if (!mainView) {
            mainView = this.getMainView();
        }
        if (!labelStyle) {
            if (!mainView) return this.margin;
            const axis = mainView.get('options').axes[this.metrics.xField];
            if (!isLeftAxis(axis)) return this.margin;
            labelStyle = axis.label.textStyle;
        }
        // 如果不是在label在中间，则直接返回marin
        const font = getFont(labelStyle);
        const maxTick = this.getMaxLenthByScales();
        const minMargin = BBox(font, maxTick) + 20;
        return minMargin;
    }

    /**
     * 获取住main
     */
    getMainView() {
        return this.facets ? this.facets.find((i) => i.view.isMainView).view : null;
    }

    /**
     * 改变margin
     * @param {Number} margin
     */
    _changeMargin(margin) {
        const marginHalf = margin / 2;
        this.facets.forEach((facet) => {
            const view = facet.view;
            const isMainView = view.isMainView;
            const padding = [0, isMainView ? marginHalf : 0, 0, !isMainView ? marginHalf : 0];
            if (isMainView) {
                this.setXAxis(this.metrics.xField, view.get('options').axes, facet);
            }
            view.set('padding', padding);
            view.repaint();
        });
    }

    /**
     * 修改margin
     * @public
     * @param {Number} margin
     */
    changeMargin(margin) {
        this.margin = margin;
        this._changeMargin(this.getMargin());
    }

    /**
     * 获取marigin
     * @param {View} view
     * @param {TextStyle} labelStyle
     */
    getMargin(view, labelStyle) {
        const margin = this.margin;
        const minMargin = this.getMainViewMaxLableWidth(view, labelStyle);
        return minMargin && minMargin > margin ? minMargin : margin;
    }

    getMaxLenthByScales() {
        const scale = getScalesByField(this.chart, this.metrics.xField);
        return scale.ticks.reduce((a, b) => (String(a).length > String(b).length ? a : b));
    }

    /**
     * @override
     * @param {*} xField
     * @param {*} axes
     * @param {*} facet
     */
    setXAxis(xField, axes, facet) {
        if (facet.colIndex === 1 || facet.rowIndex === 1) {
            axes[xField].label = null;
            axes[xField].title = null;
        } else {
            const yAxis = axes[xField];
            if (yAxis && yAxis.label) {
                yAxis.label.textStyle.textAlign = 'center';
                yAxis.label.offset = this.getMargin(facet.view) / 2;
            }
        }
    }

    setYAxis() {}
}
