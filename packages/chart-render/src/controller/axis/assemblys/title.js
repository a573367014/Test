import BaseAdapter from '../../base-dapter';
import { textStyleAdapter } from '../../../helpers/adapters/text';

/**
 * @class TitleAdapter
 */
export default class TitleAdapter extends BaseAdapter {
    static adapterName = 'title';
    get enable() {
        const config = this.config;
        return config && config.enable && String(config.text).length > 0;
    }

    /**
     * 默认值
     * @override
     */
    getDefaultCfg() {
        return {
            enable: false,
            text: '坐标轴名称',
            offset: 0.67,
            position: 'center', // start | center | end 相对于轴线
            autoRotate: true,
            autoLayout: true, // 自动对齐
            rotate: 0,
            // text style
            color: '#333333',
            fontSize: 24,
            fontWeight: 400,
            textAlign: 'center',
            textBaseline: 'middle',
            relative: 'label', // label or line
        };
    }

    /**
     * 根据config生成G2配置对象
     * @override
     * @param {Object} cfg title配置对象
     * @param {boolean} [cfg.enable=false] 开关
     * @param {number} [cfg.offset=20] 距离坐标轴线的距离
     * @param {String<start|center|end>} [cfg.position='center'] 距离坐标轴线的距离
     * @param {string} cfg.text 文本
     * @param {string} [cfg.color='#ccccccff'] 文本的颜色
     * @param {number} [cfg.fontSize=14] 文本的大小
     * @param {string<left|center|right>} [cfg.textAlign=center] 文本的水平对齐
     * @param {number} [cfg.fontWeight=400] 文本的加粗
     * @param {string<top|middle|bottom>} [cfg.textBaseline='middle']  文本垂直方向的基线
     * @returns {object} G2 坐标轴标题的配置
     */
    buildG2Config(cfg) {
        let { text, offset, position, autoRotate, rotate } = cfg;

        if (autoRotate) {
            rotate = null;
        }

        const textStyle = textStyleAdapter(cfg);

        return {
            // position: 'start' | 'center' | 'end'
            // 标题的显示位置（相对于坐标轴线），可取值为 start center end
            position,
            // 是否需要自动旋转，默认为 true
            autoRotate,
            // 文本
            text,

            // offset: {number}, // 数值，设置坐标轴标题距离坐标轴线的距离
            // offset: isNaN(offset) ? 0 : Number(offset),
            offset: Math.round(offset * cfg.fontSize, 0),

            // 设置标题的文本样式
            // textStyle: {
            //     textAlign: 'center', // 文本对齐方向，可取值为： start middle end
            //     fill: '#404040', // 文本的颜色
            //     fontSize: '12', // 文本大小
            //     fontWeight: 'bold', // 文本粗细
            //     textBaseline: 'top' // 文本基准线，可取 top middle bottom，默认为middle
            //     rotate: 30, // 文本旋转角度，以角度为单位，仅当 autoRotate 为 false 时生效
            // },
            textStyle: {
                ...textStyle,
                // 旋转角度
                rotate,
            },
        };
    }
}
