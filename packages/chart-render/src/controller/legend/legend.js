import { combine } from '../../helpers/index';
import { textStyleAdapter } from '../../helpers/adapters/text';
import {
    registerRandomShape,
    unregisterShape,
    registerPointShapeMarkerCfg,
    getShapeMarkerCfg,
} from '../../helpers/g2-helper';
import { merge } from '@antv/g2/lib/util';

function rectAngleSymbolMarker(x, y, radius) {
    const xr = radius;
    const yr = radius * 0.55;

    return [
        ['M', x - xr, y - yr],
        ['L', x + xr, y - yr],
        ['L', x + xr, y + yr],
        ['L', x - xr, y + yr],
        ['Z'],
    ];
}
function rectGetMarkerCfg({ color, radius }) {
    return {
        fill: color,
        // fillOpacity: opacity,
        lineWidth: 0,
        radius: radius,
        stroke: color,
        symbol: rectAngleSymbolMarker,
    };
}
registerPointShapeMarkerCfg('rectangle', {
    getMarkerCfg: rectGetMarkerCfg,
});

// vertical、horizontal
const LAYOUT_MAP = {
    VERTICAL: 'vertical',
    HORIZONTAL: 'horizontal',
};

export default class LegendController {
    /**
     * 默认值
     */
    static getDefaultCfg() {
        return {
            enable: false, // 是否开启
            position: 'bottom', // 位置，目前只开放 top/bottom

            // style ------
            color: '#000000', // 颜色
            fontSize: 18, // 大小
            fontWeight: 400, //
            lineHeight: 18,

            // todo
            layout: null,
            marker: 'rectangle', // 'auto', 'defualt' , 'rectangle', circle, square, line

            // 系数 ------
            offset: 1.88, // 偏移量
            opacity: 0.94, // 图形透明度

            // 图形半径
            shapeRadiusRatio: 1,

            itemWidthRatio: 14,
            itemHeightRatio: 1.5,

            // 针对长方形
            shapeWidthRatio: 2.22, // 宽度比例，基于文字大小
            shapeHeightRatio: 1.22, // 高度比例，基于文字大小

            // 前后距离
            shapeToTextWidthRatio: 0.56, // 图形距离文字前间隔
            textToNextShapeWidthRatio: 1.67, // 后间隔， 文字距离下一个图形的间隔

            // 针对分类类型的图例，是否启用尾部跟随图例
            attachLast: false,
        };
    }

    /**
     * @constructor
     */
    constructor(chart, legendsOptions, field) {
        this.chart = chart;
        this.field = field;
        this.mergeDefault(legendsOptions);

        this.initLegend();
    }

    /**
     * 合并默认值
     * @param {object} cfg
     */
    mergeDefault(cfg) {
        this.config = combine(cfg, this.config || {}, LegendController.getDefaultCfg());
    }

    /**
     * 注册图形
     */
    registerPointShape(type) {
        /**
         * 奇淫巧技
         * 根据源码采取的技巧，有问题找汤勺，钱葱
         */
        const shapeType = 'point';
        if (this.legendShapeName) {
            unregisterShape(shapeType, this.legendShapeNam);
        }
        // 注册图形
        const _self = this;
        this.legendShapeName = registerRandomShape(shapeType, {
            getMarkerCfg(cfg) {
                const markerCfg = getShapeMarkerCfg(type, cfg);
                markerCfg.radius = _self.getLengthRaius();
                markerCfg.opacity = _self.config.opacity;
                return markerCfg;
            },
        });

        return this.legendShapeName;
    }

    /**
     * 获取半径
     */
    getLengthRaius() {
        const { fontSize, shapeRadiusRatio } = this.config;
        return shapeRadiusRatio * fontSize;
    }

    // 绘制图例图形的方法
    // 长方形
    // todo: 后期绘制出更多图形提供多样性选择
    symbolMarker(x, y) {
        const { shapeHeightRatio, shapeWidthRatio, fontSize } = this.config;
        // 1. 长宽
        // 2. 短
        const xr = (shapeWidthRatio * fontSize) / 2;
        const yr = (shapeHeightRatio * fontSize) / 2;

        return [
            ['M', x - xr, y - yr],
            ['L', x + xr, y - yr],
            ['L', x + xr, y + yr],
            ['L', x - xr, y + yr],
            ['Z'],
        ];
    }

    // 更新配置
    updateConfig(key, value) {
        this.config[key] = value;
        this.initLegend();
    }

    // 改变legend
    changeLegend(cfg) {
        this.config = merge(this.config, cfg);
        this.initLegend();
    }

    // 渲染数据
    initLegend() {
        if (!this.config) return;
        const { enable } = this.config;
        // 直接关闭
        if (!enable) {
            this._callChatrLegend(false);
            return;
        }
        // 初始化配置了
        this.deployLegend();
    }

    // 部署legend
    deployLegend() {
        this._callChatrLegend(this.assembleConfig());
    }

    _callChatrLegend(cfg) {
        if (this.field === null) {
            this.chart.legend(cfg);
        } else {
            this.chart.legend(this.field, cfg);
        }
    }

    /**
     * 根据model生成G2配置
     */
    assembleConfig() {
        let {
            position,
            shapeToTextWidthRatio,
            textToNextShapeWidthRatio,
            itemWidthRatio,
            itemHeightRatio,
            fontSize,
            marker,
            attachLast,
            layout,
        } = this.config;
        const textStyle = textStyleAdapter(this.config);

        if (!layout) {
            layout = this._autoLayoutByPosition(position);
        }

        let LinerHeight = itemHeightRatio * fontSize;
        let LinerWidth = itemWidthRatio * fontSize;
        if (layout === LAYOUT_MAP.VERTICAL) {
            [LinerHeight, LinerWidth] = [LinerWidth, LinerHeight];
        }

        /**
         * offset是根据位置生成上下的间距
         */
        const [offsetX, offsetY] = this.rebuildOffsetXY();
        return {
            // 公共配置 --------------------------------------------------------------

            /**
             * 1.
             * 设置图例的显示位置，可设置的值为12个：
             * > top-left,top-center,top-right,bottom-left,bottom-center,bottom-right，
             * > left-top,left-center,left-bottom,right-top,right-center,right-bottom
             * 也可使用bottom,top,left,right设置位置，此时对应的值分别为 bottom-center,top-center,left-bottom,right-bottom
             * 默认为 bottom-center
             */
            position: position,
            /**
             * 2.
             * 用于设置各个图例项的排列方式，可设置值包括：vertical、horizontal，分别表示垂直和水平排布。
             * 目前会在左右居中的时候会自动配置为垂直方向，所以暂时不开放
             */
            layout: layout,
            /**
             * 3.
             * 图例标题，暂时不开放
             */
            title: null,
            /**
             * 4.
             * 左右偏移
             * 目前对外不开放，只用来调较padding错误
             */
            offsetY: offsetY,
            offsetX: offsetX,
            /**
             * 5.
             * 文字样式
             */
            textStyle,
            /**
             * 6.
             * 是否可点击
             */
            clickable: false, // 关闭交互
            hoverable: false, // 关闭交互

            /**
             * 针对分类类型的图例
             * --------------------------------------------------------------
             */
            /**
             * 7.
             * 是否启用尾部跟随图例， 仅适用于line、area、stackArea
             */
            attachLast: attachLast,
            /**
             *
             */
            titleGap: 0,
            // 图例项垂直方向的间距
            itemMarginBottom: (itemHeightRatio - 1) * fontSize,
            // 每一项分类之间的间距
            itemGap: textToNextShapeWidthRatio * fontSize,
            // 图例图形和文字之间的间距
            _wordSpaceing: shapeToTextWidthRatio * fontSize,
            // itemWidth: '',
            // 回调函数，用于格式化图例每项的文本显示。
            // itemFormatter(val) {
            //     return val; // val 为每个图例项的文本值
            //  }
            // itemFormatter

            /**
             * 图形样式
             *
             * > 'rectangle' 自己实现
             * >  暂时开放:
             * 'circle', 圆形
             * 'square', 正方形
             * 'line' 线
             *
             *
             * 不开放
             * 'bowtie',
             * 'diamond',
             * 'hexagon',
             * 'triangle',
             * 'triangle-down',
             * 'hollowCircle',
             * 'hollowSquare',
             * 'hollowBowtie',
             * 'hollowDiamond',
             * 'hollowHexagon',
             * 'hollowTriangle',
             * 'hollowTriangle-down',
             * 'cross',
             * 'tick',
             * 'plus',
             * 'hyphen', // 横线
             * 'line'
             */
            marker: marker === 'auto' ? null : this.getMarkerName(),
            // 图形半径，自己兼容 link: @src/render/chart.js@16 __resetLegendFnSupprtMarkerRadius 方法
            radius: this.getLengthRaius(),

            // isSegment: true,
            slidable: false, // 关闭交互
            // sizeType: 'circle'
            /**
             * 针对连续图例，渐变色可配置
             * --------------------------------------------------------------
             */
            width: LinerWidth,
            height: LinerHeight,
            selectedMode: 'single',
            triggerAttr: {
                fill: 'red',
                height: itemHeightRatio * fontSize,
                width: 10,
                radius: 4,
                shadowBlur: 0,
                shadowOffsetX: 0,
                shadowOffsetY: 0,
            },
            // 14, 由于 text 代码 y: TRIGGER_WIDTH / 2 + this.get('textOffset') + 10, （TRIGGER_WIDTH = 8）
            textOffset: 10,
        };
    }

    _autoLayoutByPosition(position) {
        if (/^left/.test(position) || /^right/.test(position)) {
            return LAYOUT_MAP.VERTICAL;
        } else {
            return LAYOUT_MAP.HORIZONTAL;
        }
    }

    /**
     * 重新生成offset
     * 针对G2做区别
     */
    rebuildOffsetXY() {
        let { position, offset, fontSize } = this.config;
        const legendBlockRaius = this.getLengthRaius();

        /**
         * 重新计算
         * offset 开放是一个比例，具体值是 fontSize * offset
         */
        offset = Math.round(offset * fontSize, 0);

        let offsetY = 0;
        let offsetX = 0;
        // 根据位置生成上下的间距

        if (/^top/.test(position)) {
            offsetY = offsetY - offset;
        } else if (/^bottom/.test(position)) {
            offsetY = offsetY + offset;
        } else if (/^left/.test(position)) {
            offsetX = offsetX - offset;
        } else if (/^right/.test(position)) {
            offsetX = offset - legendBlockRaius / 2;
        }

        // 对左侧间距进行修复
        if (/left/.test(position)) {
            const paddingLeft = (this.chart.get('_autoPaddingAppend') || [])[3];
            offsetX += paddingLeft;
        }

        return [offsetX, offsetY];
    }

    getMarkerName() {
        const { marker } = this.config;
        const openMarkersList = ['circle', 'square', 'line'];
        if (marker === null || marker === 'auto') {
            return null;
        } else if (openMarkersList.includes(marker)) {
            return marker;
        }
        // 注册
        return this.registerPointShape(marker);
    }

    // 销毁
    destroy() {
        // 注销图形
        this.legendShapeName && unregisterShape('point', this.legendShapeName);
    }
}
