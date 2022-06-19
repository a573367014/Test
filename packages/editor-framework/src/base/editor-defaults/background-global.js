/**
 * 全局背景属性
 * @memberof module:editorDefaults
 * @enum
 */
const backgroundGlobal = {
    /**
     * 布局高度
     * @type {Number}
     */
    height: 480,
    /**
     * 布局宽度
     * @type {Number}
     */
    width: 640,

    /**
     * 背景图片
     * @type {?String}
     */
    backgroundImage: null,

    /**
     * 加过特效后的背景图片地址
     * @type {?String}
     */
    // backgroundEffectImage: null,

    /**
     * 背景色
     * @type {String}
     */
    backgroundColor: '#ffffff00',

    /**
     * 背景图片信息
     * @type {Object}
     * @prop {Number} opacity 透明度
     * @prop {Number} width 背景图原始宽度
     * @prop {Number} height 背景图原始高度
     * @prop {Object} transform 变化矩阵
     */
    backgroundImageInfo: {
        opacity: 1,
        width: 100,
        height: 100,
        transform: { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 },
    },

    /**
     * 背景平铺方式, 暂时只实现了 no-repeat
     * @type {String}
     */
    backgroundRepeat: 'no-repeat',

    /**
     * 背景尺寸
     * @type {Array}
     */
    backgroundSize: [0, 0],

    /**
    * 背景渐变, 与背景色互斥
    * @type {?Object}
    * @example {
       angle: 0,
       stops: [
           { color: '#ffffffff', offset: 0 },
           { color: '#000000ff', offset: 1 },
       ],
       type: 'linear',
   }
   */
    // backgroundGradient: null,

    /**
     * 是否展示元素水印
     * @type {Boolean}
     */
    watermarkEnable: false,

    /**
     * 背景是否加载完成
     * @type {boolean}
     */
    $backgroundLoaded: false,
    /**
     * 背景是否进入裁剪
     * @type {boolean}
     */
    $backgroundEditing: false,
    /**
     * 背景是否被选中
     * @type {boolean}
     */
    $backgroundSelected: false,
};

export default backgroundGlobal;
