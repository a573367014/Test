/**
 * 元素基础属性
 * @memberof module:editorDefaults
 * @enum
 */
const element = {
    /**
     * 唯一标识
     * @type {String}
     */
    uuid: null,

    /**
     * 元素类型
     * @type {String}
     */
    type: '',

    /**
     * 元素标题
     * @type {String}
     */
    title: '',

    /**
     * 分类，主要用于自定义数据保存在元素内
     * @type {String}
     */
    category: '',

    /**
     * 透明度
     * @type {Number}
     * @default 1
     */
    opacity: 1,

    /**
     * 元素内边距：[top, right, bottom, left]
     * @type {Array<Number>}
     */
    padding: [0, 0, 0, 0],

    /**
     * 元素尺寸：宽度
     * @type {Number}
     */
    width: 200,

    /**
     * 元素尺寸：高度
     * @type {Number}
     */
    height: 200,

    /**
     * 元素相对于{@link module:editorDefaults.layout|layout}的位置：水平方向位移
     * @type {Number}
     */
    left: 0,

    /**
     * 元素相对于{@link module:editorDefaults.layout|layout}的位置：垂直方向位移
     * @type {Number}
     */
    top: 0,

    /**
     * 元素变形：矩阵数据 Matrix { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 }
     * @type {Object}
     */
    transform: { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 },

    /**
     * 元素盒阴影 {color: '#00FF00FF', offsetX: 2, offsetY: 4, blurRadius: 5, spreadRadius: 0}
     * @type {Object}
     */
    boxShadow: null,

    /**
     * 元素缩放方向控制柄 成组出现二进制值
     * 0: 没有控制柄，
     * 1: 四个角控制柄，
     * 2: 上下两边控制柄，
     * 4: 左右两边控制柄
     * 7: 显示所有控制柄
     * @type {Number}
     */
    resize: 7,

    /**
     * 元素是否可以拖拽
     * @type {Boolean}
     */
    dragable: true,

    /**
     * 元素是否可以旋转
     * @type {Boolean}
     */
    rotatable: true,

    /**
     * 元素内容是否可变更
     * @type {Boolean}
     */
    editable: true,

    /**
     * 元素是否冻结，被冻结的元素将无法获取和接受鼠标事件
     * @type {Boolean}
     */
    frozen: false,

    /**
     * 元素是否隐藏
     * @type {Boolean}
     */
    hidden: false,

    /**
     * 元素是否锁定
     * @type {Boolean}
     */
    lock: false,

    /**
     * 元素圆角属性
     * 圆角百分比 percet: [0, 1)；
     * 圆角固定像素 pixel: [1, n];
     * @type {Number}
     */
    borderRadius: 0,

    /**
     * {@link module:editorDefaults.layout.filter|基础滤镜}
     * @type { Object }
     */
    filter: {
        contrast: 0,
        sharpness: 0,
        hueRotate: 0,
        saturate: 0,
        brightness: 0,
        gaussianBlur: 0,
        temperature: 0,
        tint: 0,
    },

    /**
     * 是否展示元素水印
     * @type {Boolean}
     */
    watermarkEnable: false,

    /**
     * 存放元数据，可用于备注、埋点、付费素材、业务信息储存 {@link module:editorDefaults.metaInfo|元信息}
     * @type { * }
     */
    metaInfo: null,

    /**
     * 元素链接的 uuid
     * @type { String }
     */
    linkId: '',

    /**
     * 是否允许成组
     * @type { Boolean }
     */
    groupable: true,

    /**
     * {@link module:editorDefaults.flex|flex 布局属性}，控制元素在 flex 布局元素中的布局表现
     * @type { ?Object }
     */
    flex: null,

    /** 背景色
     * @type { ?String }
     */
    backgroundColor: null,

    /**
     * {@link module:editorDefaults.backgroundEffect|元素背景}
     * @type { ?Object }
     */
    backgroundEffect: null,

    /**
     * {@link module:editorDefaults.border|元素边框}
     * @type { ?Object }
     */
    border: null,

    /**
     * 元素颜色混合模式，与 css blend-mode 一致
     * @type { String }
     */
    blendMode: null,
    /**
     * 启用蒙版（将元素本身置为蒙版）
     * @type { Boolean }
     * @prop { Boolean } enable   启用蒙版（将元素本身置为蒙版）
     * @prop { Boolean } showSelf 是否显示自身
     * @prop { String } imageUrl  元素最终状态结果图，受所有渲染属性影响（例如：mask 元素的 width、height、transform、opacity、url、mask、imageEffects、filterInfo。。。)
     * @prop { Object } effectedResult  imageUrl 相关属性
     * @prop { Number } effectedResult.width 宽
     * @prop { Number } effectedResult.height 高
     * @prop { Number } effectedResult.left 基于元素本身的左边距离
     * @prop { Number } effectedResult.top  基于元素本身的上边距离
     */
    maskInfo: {
        enable: false,
        showSelf: false,
        imageUrl: '',
        effectedResult: {
            width: 0,
            height: 0,
            left: 0,
            top: 0,
        },
    },

    /**
     * 进场效果
     */
    transitionIn: null,
    /**
     * 出场效果
     */
    transitionOut: null,
    /**
     * https://doc.huanleguang.com/pages/viewpage.action?pageId=135762471
     * GDLayerAnimation 为字段定义
     * @typedef LayerAnimations
     * @type {object}
     * @property {string} stage
     * @property {number} delay 延时播放
     * @property {number} duration 持续时长，暂时用不到
     * @property {number} repeatCount
     * @property {Array} effects
     * @property {number} unitDuration 单次动画时长
     */

    /**
     * @type {Array<LayerAnimations>}
     */
    animations: [],
};

// 与生成 imageUrl 不相干的属性
const irrelevantRenderProps = new Set([
    'uuid',
    'type',
    'title',
    'category',
    'opacity',
    'left',
    'top',
    'resize',
    'dragable',
    'rotatable',
    'editable',
    'frozen',
    'hidden',
    'lock',
    'watermarkEnable',
    'metaInfo',
    'linkId',
    'groupable',
    'flex',
    'blendMode',
    'maskInfo',
    'transitionIn',
    'transitionOut',
    'animations',
]);
export { irrelevantRenderProps };
export default element;
