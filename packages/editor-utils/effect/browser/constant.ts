export const DEFAULT_EFFECT = {
    /**
     * 是否启用特效
     * @type { Boolean }
     */
    enable: true,
    /**
     * 参数调节时忽略的字段名，可选 'stroke' | 'insetShadow' | 'filling'
     * @type { Array<String> }
     */
    excludeScale: [],
    /**
     * 偏移量
     * @type { Object }
     * @prop { Boolean } 是否启用
     * @prop { Number } x 偏移
     * @prop { Number } y 偏移
     */
    offset: {
        enable: true,
        x: 0,
        y: 0,
    },
    /**
     * 外描边
     * @type { Object }
     * @prop { Boolean } enable 是否启用
     * @prop { String } color 描边色值
     * @prop { Number } width 描边宽度
     * @prop { String } type 描边类型
     */
    stroke: {
        enable: false,
        color: '#000000ff',
        width: 1,
        type: 'outer',
    },
    /**
     * 填充
     * @type { Object }
     * @prop { Number } type 填充类型 color: 纯色填充 image：图片填充 gradient：渐变填充
     * @prop { String } color 色值
     */
    filling: {
        enable: false,
        type: 'color',
        color: '#000000ff',
    },
};

/**
 * 投影默认数据
 */
export const DEFAULT_SHADOW = {
    /**
     * 基础投影
     * @type { Object }
     * @prop { Boolean } enable 是否启用
     * @prop { String } type 投影类型
     * @prop { String } color 色值
     * @prop { Number } offsetX x轴偏移
     * @prop { Number } offsetY y轴偏移
     * @prop { Number } blur 模糊半径
     */
    base: {
        enable: true,
        type: 'base',
        color: '#00000080',
        offsetX: 6,
        offsetY: 6,
        blur: 4,
        opacity: 0.5,
    },

    /** 平行投影 */
    parallel: {
        enable: true,
        type: 'parallel',
        mask: '',
        offsetX: 6,
        offsetY: 6,
        opacity: 0.5,
        blurType: 'base',
        advancedBlur: {
            blurs: [
                { offset: 0, value: 4 },
                { offset: 1, value: 4 },
            ],
            opacities: [
                { offset: 0, value: 1 },
                { offset: 1, value: 1 },
            ],
        },
        color: '#00000080',
        scaleX: 1,
        scaleY: 1,
    },
    /** 倾斜投影 */
    skew: {
        enable: true,
        type: 'skew',
        mask: '',
        offsetX: 0,
        offsetY: 0,
        opacity: 0.5,
        blurType: 'advanced',
        advancedBlur: {
            blurs: [
                { offset: 0, value: 5 },
                { offset: 1, value: 25 },
            ],
            opacities: [
                { offset: 0, value: 1 },
                { offset: 1, value: 0.8 },
            ],
        },
        color: '#00000080',
        scaleX: 1,
        scaleY: 0.8,
        angle: 45,
        overlap: 0,
    },
    /** 接触投影 */
    contact: {
        enable: true,
        type: 'contact',
        mask: '',
        offsetX: 0,
        offsetY: 0,
        angle: -90,
        fieldAngle: 45,
        opacity: 0.8,
        blurType: 'advanced',
        advancedBlur: {
            blurs: [
                { offset: 0, value: 3 },
                { offset: 1, value: 0 },
            ],
            opacities: [
                { offset: 0, value: 1 },
                { offset: 0.1, value: 0 },
            ],
        },
        color: '#000000cc',
    },
    /** 倒影 */
    reflect: {
        enable: true,
        type: 'reflect',
        mask: '',
        offsetX: 0,
        offsetY: -5,
        opacity: 0.5,
        blurType: 'advanced',
        advancedBlur: {
            blurs: [
                { offset: 0, value: 3 },
                { offset: 1, value: 25 },
            ],
            opacities: [
                { offset: 0, value: 1 },
                { offset: 1, value: 0.8 },
            ],
        },
        direction: 'bottom',
    },
};
