import G2Chart from '@antv/g2/lib/chart/chart.js';
import Title from './components/title';
import Util, { merge } from '@antv/g2/lib/util';
import Global from '@antv/g2/lib/global';
import Shape from '@antv/g2/lib/geom/shape/shape';

export default class Chart extends G2Chart {
    init() {
        super.init();
        this.__resetLegendFnSupprtMarkerRadius();
    }

    /**
     * @hack
     * 自定义图例和图形支持radius配置
     */
    __resetLegendFnSupprtMarkerRadius() {
        const legendController = this.get('legendController');
        const _addCategoryLegend = legendController._addCategoryLegend;

        legendController._addCategoryLegend = function (scale, attr, geom, filterVals, position) {
            const self = this;
            const field = scale.field;
            let legendOptions = self.options;
            const fieldOption = legendOptions[field];
            if (fieldOption) {
                legendOptions = fieldOption;
            }

            const legendMarkerRadius = Global.legendMarkerRadius;
            Global.legendMarkerRadius = legendOptions.radius || legendMarkerRadius;
            const legends = _addCategoryLegend.call(this, scale, attr, geom, filterVals, position);
            Global.legendMarkerRadius = legendMarkerRadius;

            return legends;
        };
        legendController.addMixedLegend = function (scales, geoms) {
            const self = this;
            const legendOptions = self.options;
            const items = [];
            const hasPushedScaleList = [];
            Util.each(scales, (scale) => {
                const value = scale.alias || scale.field;
                const fieldLegendOptions = legendOptions[scale.field];
                Util.each(geoms, (geom) => {
                    if (
                        fieldLegendOptions !== false &&
                        geom.get('visible') &&
                        scale.values &&
                        scale.values.length > 0 &&
                        !hasPushedScaleList.includes(scale) &&
                        geom.getYScale() === scale
                    ) {
                        const isSameMarker = !!legendOptions.marker;
                        const shapeType = isSameMarker ? 'point' : geom.get('shapeType') || 'point';
                        const shape = isSameMarker
                            ? legendOptions.marker
                            : geom.getDefaultValue('shape') || 'circle';
                        const shapeObject = Shape.getShapeFactory(shapeType);
                        const cfg = { color: geom.getDefaultValue('color') };
                        const marker = shapeObject.getMarkerCfg(shape, cfg);
                        /**
                         * 只增加这块代码
                         */
                        if (legendOptions.radius) {
                            marker.radius = legendOptions.radius;
                        }
                        const item = {
                            value,
                            marker,
                            field: scale.field,
                        };
                        items.push(item);
                        hasPushedScaleList.push(scale);
                    }
                }); // end of geom loop
            }); // end of scale loop
            const options = { custom: true, items };
            self.options = Util.deepMix({}, options, self.options);
            const legend = self.addCustomLegend();
            self._bindClickEventForMix(legend);
        };
    }

    /**
     * @override
     */
    _getAutoPadding() {
        let autoPadding = super._getAutoPadding();
        const _autoPaddingAppend = this.get('_autoPaddingAppend') || [];

        /**
         * legends
         * @hack 图例计算错误
         */

        // 如果当前图例开启，并且图例是左侧的。
        const legendController = this.get('legendController');
        const frontPlot = this.get('frontPlot');
        const backPlot = this.get('backPlot');
        const frontBBox = frontPlot.getBBox();
        const backBBox = backPlot.getBBox();
        const frontBBoxMinX = frontBBox.minX;
        const backBBoxMinX = backBBox.minX;

        const keys = Object.keys(legendController.legends);
        if (keys.length > 0 && keys.some((i) => /^left/.test(i))) {
            const legendsWidth = legendController.totalRegion.totalWidth;
            let offsetMinX = 0;

            if (!isFinite(backBBoxMinX) && frontBBoxMinX > 0) {
                offsetMinX = frontBBoxMinX;
            } else if (isFinite(frontBBoxMinX) && isFinite(backBBoxMinX)) {
                offsetMinX = Math.max(frontBBoxMinX, backBBoxMinX);
                // 不能大于0
                offsetMinX = Math.min(offsetMinX, 0);
            }

            autoPadding[3] = autoPadding[3] + legendsWidth + _autoPaddingAppend[3] - offsetMinX;
        }

        /**
         * @hack
         * autoPaddingAppend 应该支持一个数组
         */
        autoPadding = autoPadding.map((v, i) => (v += _autoPaddingAppend[i]));

        /**
         * 新增了title
         */
        const titleContorler = this.get('titleContorler');
        if (titleContorler && titleContorler.enable) {
            const outerTitlePadding = titleContorler.getTitleBoxPaddings();
            autoPadding = autoPadding.map((value, i) => value + outerTitlePadding[i]);
        }

        return autoPadding;
    }

    /**
     * 增加渲染title
     * @override
     */
    drawComponents() {
        super.drawComponents();
        // render
        this._renderTitle();
    }

    // 配置title
    title(cfg) {
        const options = this.get('options');
        if (options.title) {
            options.title = merge(options.title, cfg);
        } else {
            options.title = cfg;
        }
    }

    // 渲染title
    _renderTitle() {
        const options = this.get('options');
        const titleCfg = options.title;
        let titleContorler = this.get('titleContorler');

        // 先销毁
        if (titleContorler) {
            titleContorler.destroy();
        }

        // 初始化title
        titleContorler = new Title(titleCfg, {
            group: this.get('frontPlot'),
            wrapperWidth: this.get('width'),
            wrapperHeight: this.get('height'),
        });

        // 设置
        this.set('titleContorler', titleContorler);
    }

    /**
     * 改变title
     * @param {Object} cfg
     */
    changeTitle(cfg) {
        this.title(cfg);
        this.repaint();
    }

    /**
     * @override
     * @hack
     */
    _initControllers() {
        super._initControllers();
    }
}
