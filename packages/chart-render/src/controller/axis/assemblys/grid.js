import BaseAdapter from '../../base-dapter';
import { lineStyleAdapter } from '../../../helpers/adapters/line';
import { parseColorToString } from '../../../helpers/colors';

/**
 * 网格线适配
 */
export default class GridAdapter extends BaseAdapter {
    static adapterName = 'grid';
    /**
     * @override
     */
    getDefaultCfg() {
        return {
            enable: false,
            type: 'line',
            isAlign: false,
            hideFirstLine: true,
            hideLastLine: false,
            color: '#979797',
            opacity: 1,
            lineWidth: 1,
            lineDash: [5, 5],
        };
    }

    /**
     * 根据config生成G2配置对象
     * @override
     * @param {Object} cfg
     * @param {object} cfg
     * @param {boolean} cfg.enable 开关
     * @param {string} cfg.type line | polygon | default
     * @param {boolean} [cfg.isAlign=false] 是否居中
     * @param {boolean} [cgf.hideFirstLine=true] 隐藏第一条线，跟坐标轴线重合
     * @param {boolean} [cgf.hideLastLine=false] 隐藏最后一条
     * style
     * @param {string} cfg.color 颜色
     * @param {number} cfg.opacity 透明值
     * @param {number} cfg.lineWidth 线宽
     * @param {array} cfg.lineDash 虚线配置
     * @returns {object}
     */
    buildG2Config(cfg) {
        const { type, isAlign, alternateColor, hideFirstLine, hideLastLine } = cfg;

        //
        return {
            /**
             * 声明网格的类型，
             * line 表示线
             * polygon 表示矩形框
             * default 表示默认，默认会根据坐标轴进行适配
             *
             */
            type: !type || type === 'default' ? null : type,

            /**
             * 声明网格顶点从两个刻度中间开始，默认从刻度点开始
             * 网格居中
             */
            align: isAlign ? 'center' : null,

            /**
             * 网格线样式
             * 当网格类型 type 为 line 时，使用 lineStyle 设置样式
             */
            lineStyle: lineStyleAdapter(cfg),

            // Todo, 开放能力 当基线，0 轴在网格上的时候，只显示 0轴
            // hightLightZero: true, // 默认不高亮0轴
            // zeroLineStyle: { // 当且仅当 highLightZero 为 true 时生效
            //     stroke: '#595959',
            //     lineDash: [ 0, 0 ]
            // },

            /**
             * 网格填充颜色
             * 当网格类型 type 为 polygon/line 时
             * 使用 alternateColor 为网格设置交替的颜色，指定一个值则先渲染奇数层，两个值则交替渲染
             * 注意：采用有透明值的颜色（rgba/hexa）格式，否则坐标轴会遮挡
             */
            alternateColor: parseColorToString(alternateColor),

            /**
             * 是否隐藏 第一条/最后一条 网格线
             * 网格线会自动补足第一条和最后一条网格线，形成完整的网格。
             * 第一条和最后一条网格线，默认关闭。
             * TODO(功能):如果没有配置，坐标轴轴线开启则默认关闭，轴线关闭则默认开启
             */
            hideFirstLine: hideFirstLine !== undefined ? hideFirstLine : true,
            hideLastLine: hideLastLine,
        };
    }
}
