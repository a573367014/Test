import BaseAdapter from '../../base-dapter';
import { textStyleAdapter } from '../../../helpers/adapters/text';
import { FONT_FAMILY } from '../../../render/gd-theme';

/**
 * @class LabelAdapter
 */
export default class LabelAdapter extends BaseAdapter {
    static adapterName = 'label';
    /**
     * @override
     */
    getDefaultCfg() {
        return {
            enable: true,

            offsetX: 0,
            offsetY: 0,
            offset: 1.13, // 相对位置，根据fontSize设置的
            autoRotate: false, // 自动旋转
            autoHide: false, // 自动隐藏
            rotate: 0,
            // style
            autoLayout: false, // 自动对齐
            textBaseline: 'middle',
            textAlign: 'center',

            color: '#4b4b4b',
            fontSize: 22,
            fontWeight: 400,
            // formatter: null
            fontFamily: FONT_FAMILY,
        };
    }

    /**
     * 根据配置转换生成G2的配置
     * @override
     * @param {Object} cfg title配置对象
     * @param {boolean} cfg.enable 开关
     * @param {number} cfg.offset 距离坐标轴线的距离
     * @param {Boolean} cfg.autoLayout 自动布局
     * @param {string} cfg.text 文本
     * @param {string} cfg.color 文本的颜色
     * @param {number} cfg.fontSize 文本的大小
     * @param {string} cfg.textAlign 文本的水平对齐
     * @param {number} cfg.fontWeight 文本的加粗
     * @param {boolean} cfg.textBaseline  文本垂直方向的基线
     * @returns {object} G2 坐标轴标题的配置
     */
    buildG2Config(cfg) {
        let { offsetX, offset, offsetY, rotate, fontSize, autoRotate, autoHide } = cfg;
        /**
         * 不同的坐标系下，label会有不一样的表现形式。
         */
        const textStyle = textStyleAdapter(cfg);
        if (cfg.autoLayout) {
            delete textStyle.textAlign;
            delete textStyle.textBaseline;
        }

        if (autoRotate) {
            rotate = null;
        }

        const resetOffset = (o) => Math.round(Number(o) * fontSize, 0);
        offset = resetOffset(offset);
        offsetX = resetOffset(offsetX);
        offsetY = resetOffset(offsetY);

        return {
            // autoRotate: {boolean}, // 文本是否需要自动旋转，默认为 true
            autoRotate: autoRotate, // 自动旋转
            // autoHide: {boolean}, // 自动隐藏label
            autoHide: autoHide,

            /**
             * 旋转角度
             */
            rotate: Number(rotate),

            // offsetX: {number}, // 在 offset 的基础上 x 方向的偏移量
            // offsetY: {number}, // 在 offset 的基础上 y 方向的偏移量
            /**
             * 设置坐标轴文本 label 距离坐标轴线的距离
             */
            offset: offset,
            offsetX: offsetX,
            offsetY: offsetY,

            // 设置文本的显示样式，还可以是个回调函数，回调函数的参数为该坐标轴对应字段的数值
            // textStyle: {
            //   textAlign: 'center', // 文本对齐方向，可取值为： start center end
            //   fill: '#404040', // 文本的颜色
            //   fontSize: '12', // 文本大小
            //   fontWeight: 'bold', // 文本粗细
            //   textBaseline: 'top' // 文本基准线，可取 top middle bottom，默认为middle
            // } | (text) => {
            //   // text: 坐标轴对应字段的数值
            // },
            textStyle,

            // TODO
            // /**
            //  * 用于格式化坐标轴上显示的文本信息的回调函数
            //  * @param  {string} text  文本值
            //  * @param  {object} item  该文本值对应的原始数据记录
            //  * @param  {number} index 索引值
            //  * @return {string}       返回格式化后的文本值
            //  */
            // formatter(text, item, index) {},
            // TODO: 暂时开发，后期规划
            formatter: cfg.formatter,

            // /**
            //  * 使用 html 渲染文本
            //  * @param  {string} text  文本值
            //  * @param  {object} item  该文本值对应的原始数据记录
            //  * @param  {number} index 索引值
            //  * @return {string}       返回 html 字符串
            //  */
            // htmlTemplate(text, item, index) {}
        };
    }
}
