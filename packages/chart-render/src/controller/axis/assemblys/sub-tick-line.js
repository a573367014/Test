import BaseAdapter from '../../base-dapter';
import { tickLineStyleAdapter } from '../../../helpers/adapters/line';

/**
 * 子刻度线
 */
export default class SubTickLineAdapter extends BaseAdapter {
    static adapterName = 'subTickLine';
    /**
     * 默认值
     * @override
     */
    getDefaultCfg() {
        return {
            enable: false,
            count: 1, // 子刻度线数量
            color: '#5A5A5AFF', // 子刻度颜色
            opacity: 1,
            lineHeight: 2, // 子刻度长度
            lineWidth: 1, // 子刻度宽度
            lineDash: [0, 0],
        };
    }

    /**
     * 根据坐标轴主刻度线配置生成对应G2的配置
     * @param {object} cfg
     * @param {boolean} cfg.enable 开关
     * @param {number} cfg.count 子刻度线数量
     * @param {string} cfg.color 颜色
     * @param {number} cfg.opacity 透明值
     * @param {number} cfg.lineHeight 线长度，可以设置负值
     * @param {number} cfg.lineWidth 线宽
     * @param {array} cfg.lineDash 虚线配置
     * @returns {object}
     */
    buildG2Config(cfg) {
        return tickLineStyleAdapter(cfg);
    }
}
