import { FONT_FAMILY } from '../../render/gd-theme';
import { combine } from '../../helpers/index';

export default class TitleController {
    /**
     * 默认值
     */
    static getDefaultCfg() {
        return {
            enbale: true, // 开关

            // 上下
            // 左边，居中，居右
            position: 'top-center', // 方向，位置, 宽度

            // 垂直方向的offset偏移量
            offset: 0.78,

            // style
            fontSize: 36,
            color: '#000000',
            fontWeight: 600,
            lineHeight: 1.38,
            fontStyle: 'normal',
            fontVariant: 'normal',
            textAlign: 'left',
            textBaseline: 'middle',
            fontFamily: FONT_FAMILY,
        };
    }

    constructor(chart, options) {
        this.chart = chart;
        this.mergeDefault(options);
        this.initTitle();
    }

    /**
     * 合并默认值
     * @param {object} cfg
     */
    mergeDefault(cfg) {
        this.config = combine(cfg, TitleController.getDefaultCfg());
    }

    // 改变legend
    changeTitle(cfg) {
        this.mergeDefault(cfg);
        this.initTitle();
    }

    // 渲染数据
    initTitle() {
        this.chart.title(this.config);
    }
}
