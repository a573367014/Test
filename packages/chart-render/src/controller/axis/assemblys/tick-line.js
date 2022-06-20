import BaseAdapter from '../../base-dapter';
import { tickLineStyleAdapter } from '../../../helpers/adapters/line';

/**
 * @class TickLineAdapter
 */
export default class TickLineAdapter extends BaseAdapter {
    static adapterName = 'tickLine';
    /**
     * 默认值
     * @override
     */
    getDefaultCfg() {
        return {
            enable: false,
            // count: 5,
            color: '#5A5A5AFF',
            opacity: 1,
            lineHeight: 5,
            lineWidth: 1,
            lineDash: [0, 0],
        };
    }

    /**
     * 根据config生成G2配置对象
     * @override
     * @param {Object} cfg
     * @param {boolean} cfg.enable 开关
     * @param {number} cfg.count 刻度个数
     * @param {string} cfg.color 颜色
     * @param {number} cfg.opacity 透明值
     * @param {number} cfg.lineHeight 线长度，可以设置负值
     * @param {number} cfg.lineWidth 线宽
     * @param {array} cfg.lineDash 虚线配置
     * @returns {object}
     *
     */
    buildG2Config(cfg) {
        return {
            // stroke
            // strokeOpacity
            // lineWidth
            // length
            ...tickLineStyleAdapter(cfg),

            /**
             * 设为负值则显示为category数据类型特有的样式
             */
            alignWithLabel: true,
        };
    }
}
