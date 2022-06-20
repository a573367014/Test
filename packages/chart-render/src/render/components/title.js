import { merge } from '@antv/g2/lib/util';
import { combine } from '../../helpers/index';
import { textStyleAdapter } from '../../helpers/adapters/text';
import { FONT_FAMILY } from '../gd-theme';

function parsePosition(position) {
    let posArray = [];
    if (position.indexOf('-') === -1) {
        posArray = [position, 'center'];
    } else {
        posArray = position.split('-');
    }

    // 校验
    posArray[0] = ['top', 'bottom'].includes(posArray[0]) ? posArray[0] : 'top';
    posArray[1] = ['left', 'center', 'right'].includes(posArray[1]) ? posArray[1] : 'center';

    return posArray;
}

/**
 * 为字符串添加换行符
 * @param source - 字符串数组 ['a', 'b', 'c']
 * @param breaks - 要添加换行的index
 *
 * @example
 * ```js
 * breakText(['a','b','c'], [1])
 *
 * // a\nbc
 * ```
 */
function breakText(source, breaks) {
    const result = [...source];
    breaks.forEach((pos, index) => {
        result.splice(pos + index, 0, '\n');
    });
    return result.join('');
}

/**
 * 计算分行
 * @param {string} text - 计算元素文本
 * @param {number} maxWidth - 最大宽度
 * @param {string} font - 字体
 */
function computedLine(textContent, maxWidth, font) {
    const canvasDom = document.createElement('canvas');
    const ctx = canvasDom.getContext('2d');
    ctx.font = font;

    const textArr = textContent.split('\n');
    const wrappedTextArr = textArr.map((wrappedText) => {
        const chars = wrappedText.split('');
        const breakIndex = [];
        let text = '';
        for (let i = 0; i < chars.length; i++) {
            const item = chars[i];
            text += item;
            const currentWidth = Math.floor(ctx.measureText(text).width);
            if (currentWidth > maxWidth) {
                if (i === 0) {
                    break;
                }
                breakIndex.push(--i);
                text = '';
            }
        }

        return breakText(chars, breakIndex);
    });

    return wrappedTextArr.join('\n');
}

/**
 * 根据style获取canvas font的设置
 * @param {Object} style
 */
function getFontByStyle(style) {
    const { fontSize, fontStyle, fontWeight, fontVariant, fontFamily } = style;

    return [fontStyle, fontVariant, fontWeight, fontSize + 'px', fontFamily].join(' ');
}

/**
 * 图表标题
 * @ChartTitle
 */
export default class ChartTitle {
    /**
     * 获取默认配置
     * 针对model
     */
    defaultCfg() {
        return {
            // text: '默认标题',
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

    /**
     * 获取是否开启
     */
    get enable() {
        return this.config.enable && String(this.config.text).length > 0;
    }

    /**
     * @param {Object} cfg
     * @param {Objetc} options
     */
    constructor(cfg, options) {
        this.config = combine(cfg, this.defaultCfg()); // merge(this.defaultCfg(), cfg);
        merge(this, options);

        this.shape = null;
        this.style = textStyleAdapter(this.config);
        this._init();
    }

    /**
     * 获取标题宽度，不包括offset
     */
    getBBox() {
        if (this.shape) {
            return this.shape.getBBox();
        }
        return null;
    }

    /**
     * 清除
     */
    clear() {
        if (this.shape) {
            this.shape.attr('text', '');
        }
    }

    /**
     * 销毁
     */
    destroy() {
        if (this.shape) {
            this.shape.remove();
            this.shape = null;
        }
    }

    /**
     * 初始化
     */
    _init() {
        // 如果没有开启，就不渲染
        if (!this.enable) return;
        const { wrapperWidth, wrapperHeight, style, config } = this;
        const { position } = config;

        /**
         * 文字长度大于容器宽度，要自动分行
         */
        const content = (this.content = this._textWrapper(wrapperWidth, style));

        const [layout, align] = parsePosition(position);

        /**
         * 计算位置
         */
        const y = this._getYAlignVertical(layout, wrapperHeight, content);
        const [x, textAlign] = this._getXAlignVertical(align, wrapperWidth);

        /**
         * 用g来渲染文字
         */
        this.shape = this.group.addShape('text', {
            attrs: {
                x,
                y,
                text: content,
                ...style,
                textAlign,
            },
        });
    }

    /**
     * 获取垂直方向的位置
     */
    _getYAlignVertical(layout, height) {
        let y = height / 2;
        const adjustLineHeight = this.getBoxHeight() / 2;
        const offset = this.getOffset();

        y = layout === 'top' ? 0 + adjustLineHeight : height - adjustLineHeight;

        // offset 小于0的时候。
        // 只进行位置调整。
        // offset 大于0的时候，要增加相对应的offset
        if (offset < 0) {
            y = layout === 'bottom' ? y + offset : y - offset;
        }

        return y;
    }

    /**
     * 获取水平方向的位置
     */
    _getXAlignVertical(align, width) {
        if (align === 'left') {
            return [0, align];
        } else if (align === 'right') {
            return [width, align];
        } else {
            return [width / 2, 'center'];
        }
    }

    /**
     * 获取title的pandding
     */
    getTitleBoxPaddings() {
        const [layout] = parsePosition(this.config.position);
        const height = this.getHeight();
        return [layout === 'top' ? height : 0, 0, layout === 'bottom' ? height : 0, 0];
    }

    getBoxHeight() {
        const textArr = this.content.split('\n');
        return textArr.length * this.style.lineHeight;
    }

    /**
     * 获取title的整体高度，包括offset
     */
    getHeight() {
        if (this.config.offset < 0) {
            return 0;
        }
        return this.getBBox().height + this.getOffset();
    }

    getOffset() {
        return Math.round(this.style.fontSize * this.config.offset, 0);
    }

    /**
     * 当text过长时，默认换行
     * 1. 注意初始text带换行符的场景
     */
    _textWrapper(width, style) {
        return computedLine(this.config.text, width, getFontByStyle(style));
    }
}
