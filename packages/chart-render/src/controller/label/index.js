import { textStyleAdapter } from '../../helpers/adapters/text';
import BaseAdapter from '../base-dapter';
import { merge } from '@antv/g2/lib/util';

export default class LabelController extends BaseAdapter {
    /**
     * 默认参数
     */
    getDefaultCfg() {
        return {
            enable: false,

            offset: 0, // 偏移量，不同类型的图offset相对偏移位置不同
            color: '#000000', // 颜色
            fontWeight: 400, // 加粗
            fontSize: 22, // 字体大小
            autoRotate: true,
            // textBaseline: 'middle',
            // textAlign: 'center'
            // position: '',
            // formatter
            // formatter: i => i
            animateOption: {
                appear: {
                    animation: 'fadeIn',
                    delay: 0,
                    duration: 350,
                    easing: 'easeLinear',
                },
                update: {
                    animation: 'fadeIn',
                    duration: 350,
                    easing: 'easeLinear',
                },
            },
        };
    }

    /**
     * @constructor
     * @param {Object} cfg 配置对象
     * @param {string} field 字段
     * @param {Object} geom 图形对象
     */
    constructor(cfg, field, geom) {
        super(cfg);

        // init field
        this.field = field;
        this.$geom = null;

        // 绑定geom
        geom && this.bindGeom(geom);
    }

    /**
     * 根据model转换成g2的配置
     * @override
     */
    buildG2Config(config) {
        let { fontSize, offset, autoRotate } = config;
        // if(Math.abs(offset) > 5) {
        //     offset = offset / 18;
        // }
        offset = fontSize * offset;

        return {
            // scatter 按照散点图 label 布局算法对所有 label 进行二次布局。数据过于密集的情况下会剔除放不下的 label
            // treemap 剔除形状容纳不了的 label。
            // map: label 将会初始定位到地图板块的可视中心，为了防止 label 之间相互覆盖布局，尝试向四周偏移，会剔除放不下的 label。
            // TODO: 散点图可优化
            type: 'default', //
            // labelLine: {
            //     lineWidth: 1, // 线的粗细
            //     stroke: '#ff8800', // 线的颜色
            //     lineDash: [ 2, 1 ], // 虚线样式
            // },
            offset: offset,
            autoRotate: autoRotate,

            // position: 'center',
            // /**
            //  * 格式化文本信息
            //  * @param  {string} text  文本值
            //  * @param  {object} item  该文本值对应的原始数据记录
            //  * @param  {number} index 索引值
            //  * @return {string}       返回格式化后的文本
            //  */
            // formatter: function(text, item, index) {
            //     return text + item.point.y     // 设置文本为 x + y
            // },

            // // template
            // useHtml: false,
            // htmlTemplate(text, item, index) {
            //     return '<div>' + text + '</div>';
            // },

            textStyle: textStyleAdapter(this.config),
            formatter: config.formatter ? config.formatter : null,
            // formatter: function formatter(val, item) {
            //     return item.point.value;
            // }

            animateCfg: config.animateOption || {},
        };
    }

    /**
     * 全量改变model
     * @param {LabelConfig} cfg
     */
    changeLabel(cfg) {
        // 初始化改变
        this.changeConfig(cfg);
        // 配置label
        this._deployLabel();
    }

    /**
     * 改变label字段
     * @param {string} field
     */
    changeField(field) {
        if (!field || this.field === field) return;

        // 重新设置
        this.field = field;
        this._deployLabel();
    }

    /**
     * 绑定geom
     * @param {*} geom
     * @param {*} field
     */
    bindGeom(geom) {
        // init
        if (!geom) return;
        this.$geom = geom;

        /**
         * 重写geom label fn
         */
        rewriteLabelFn(geom);

        // 部署
        this._deployLabel();
    }

    /**
     * 配置label
     */
    _deployLabel() {
        const { field, $geom } = this;
        if (!field || !$geom) return;
        if (this.enable) {
            $geom.label(field, this.getG2Config());
        } else {
            $geom.label(false);
        }
    }

    changeChartLabel(cfg) {
        this._labelConfig = merge(this._labelConfig, cfg);
        this.setChartConfig();
    }
}

/**
 * 兼容label值设置为false的方法
 * bug: https://github.com/antvis/g2/issues/1537
 */
function rewriteLabelFn(geom) {
    const _label = geom.label;
    // 重写
    geom.label = function (field, callback, cfg) {
        const self = this;
        let labelCfg = self.get('labelCfg');
        if (!labelCfg) {
            labelCfg = {};
            self.set('labelCfg', labelCfg);
        }
        if (field === false) {
            self.set('labelCfg', null);
            return;
        }
        _label.call(this, field, callback, cfg);
    };
}
