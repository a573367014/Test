import BaseAdapter from '../../base-dapter';
import { lineStyleAdapter } from '../../../helpers/adapters/line';

/**
 *
 */
export default class LineAdapter extends BaseAdapter {
    static adapterName = 'line';
    /**
     * 默认值
     * @override
     */
    getDefaultCfg() {
        return {
            enable: true,
            color: '#5A5A5A', // 线的颜色
            opacity: 1, // 线的透明度
            lineWidth: 1, // 线宽
            lineDash: [0, 0], // 设置虚线的样式，如 [2, 3]第一个用来表示实线的像素，第二个用来表示空白的像素。如果提供了奇数个值，则这个值的数列重复一次，从而变成偶数个值
        };
    }

    /**
     * 根据config生成G2配置对象
     * @override
     * @param {Object} cfg
     * @param {object} cfg 坐标轴线配置对象
     * @param {boolean} cfg.enable 开关
     * @param {string} cfg.color 颜色
     * @param {number} cfg.opacity 透明值
     * @param {number} cfg.lineWidth 线宽
     * @param {array} cfg.lineDash 虚线配置 [2, 2]
     * @returns {object}
     */
    buildG2Config(cfg) {
        return lineStyleAdapter(cfg);
    }
}
