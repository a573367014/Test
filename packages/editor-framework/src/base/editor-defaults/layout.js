/**
 * 布局元素
 * @memberof module:editorDefaults
 * @enum
 */
const layout = {
    /**
     * 唯一标识
     * @type {String}
     */
    uuid: null,

    /**
     * 布局元素内的元素{@link module:editorDefaults.element|element}数组
     * @type {Array<element>}
     */
    elements: [],

    /**
     * 布局标题
     * @type {String}
     */
    title: '',

    /**
     * 背景图片
     * @type {?String}
     */
    backgroundImage: null,

    /**
     * 加过特效后的背景图片地址
     * @type {?String}
     */
    backgroundEffectImage: null,

    /**
     * 背景色
     * @type {String}
     */
    backgroundColor: '#ffffffff',

    /**
     * 背景
     * struct {
            color: @type { String },
            gradient: @type { Gradient },
            image: @type { ImageEffect }
            backgroundWatermarkEnable: @type { Boolean },
        }
        存在新旧背景数据，默认将background字段为null以区分渲染数据选择
     */
    background: {
        color: '#ffffffff',
        watermarkEnable: false,
    },

    /**
     * 背景图片信息
     * @type {Object}
     * @prop {Number} opacity 透明度
     * @prop {Number} width 背景图原始宽度
     * @prop {Number} height 背景图原始高度
     * @prop {Object} transform 变化矩阵
     * @prop {String} resourceType 判断背景资源类型 譬如: image、video、gif、apng
     * @prop {Number} naturalDuration apng、gif 持续时间（单位ms)
     */
    backgroundImageInfo: {
        opacity: 1,
        width: 100,
        height: 100,
        transform: { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 },
        resourceType: 'image',
        naturalDuration: 0,
    },

    /**
     * 背景图片水印
     * @type {Boolean}
     */
    backgroundWatermarkEnable: false,

    /**
     * 背景平铺方式, 暂时只实现了 no-repeat
     * @type {String}
     */
    backgroundRepeat: 'no-repeat',

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
    backgroundGradient: null,

    /**
     * 压黑在背景上层, 与线框关联交互
     * @type {Object}
     */
    backgroundMask: {
        color: '#000000FF',
        opacity: 0.7,
    },

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
     * 马赛克
     * @type {?Object}
     * @prop {Boolean} enable 是否启用
     * @prop {Number} type 马赛克样式(-1纯色，0图片平铺，1像素化，2高斯模糊，3笔刷)
     * @prop {String} color 色值 type -1 时有用
     * @prop {String} url 背景颜色
     * @prop {String} imageUrl 最终效果图
     * @prop {Number} tileWidth 图案平铺或像素化格子的宽度
     * @prop {Number} tileHeight 图案平铺或像素化格子的高度
     * @prop {Number} blur 模糊半径 0 - 100 type 2 时有用
     * @prop {Array<Object>} paths svg 路径格式的蒙版
     * @example {
        "paths": [
            {
                "type": "mosaicBrush",
                "path": "M 116.5 116.5Q 116.5 116.5 116.5 116.5Q 116.5 116.5 167.5 120.5Q 217.5 124.5 268.5 130.5Q 318.5 136.5 361.5 147.5",
                "strokeWidth": 20,
                "transform": {"a": 1, "b": 0, "c": 0, "d": 1, "tx": 0, "ty": 0}
            }, {
                "type": "mosaicRect",
                "path": "M 0 0C 0 0 757.28 0 757.28 0C 757.28 0 757.28 454.37 757.28 454.37C 757.28 454.37 0 454.37 0 454.37C 0 454.37 0 0 0 0",
                "transform": {"a": 1, "b": 0, "c": 0, "d": 1, "tx": 0, "ty": 0}
            }, {
                "type": "mosaicEllipse",
                "path": "M 0 190.29C 0 295.32 130.51 380.58 291.26 380.58C 452.01 380.58 582.52 295.32 582.52 190.29C 582.52 85.27 452.01 0 291.26 0C 130.51 0 0 85.27 0 190.29C 0 190.29 0 190.29 0 190.29",
                "transform": {"a": 1, "b": 0, "c": 0, "d": 1, "tx": 0, "ty": 0}
            }
        ]
    }
    */
    mosaic: {
        enable: false,
        type: -1,
        color: '#000000ff',
        url: '',
        imageUrl: '',
        tileWidth: 0,
        tileHeight: 0,
        blur: 50,
        paths: [],
    },

    /**
     * 布局元素的{@link module:editorDefaults.border|边框}
     * @type {?Object}
     */
    border: null,
    // custome className
    className: null,

    /**
     * 重复布局 ID
     * @type {?String}
     */
    repeatId: null,
    /**
     * 重复布局组 ID
     * @type {?String}
     */
    repeatGroup: null,
    /**
     * 存放元数据，可用于备注、埋点、付费素材、业务信息储存 {@link module:editorDefaults.metaInfo|元信息}
     * @type { * }
     */
    metaInfo: null,
    /**
     * 布局元素是否打水印
     * @type {Boolean}
     */
    watermarkEnable: false,

    /**
     * 基础滤镜数据
     * @type {Object}
     * @prop {Number} contrast 对比度
     * @prop {Number} sharpness 清晰度
     * @prop {Number} hueRotate 色相
     * @prop {Number} saturate 饱和度
     * @prop {Number} brightness 亮度
     * @prop {Number} gaussianBlur 高斯模糊
     * @prop {Number} temperature 色温
     * @prop {Number} tint 色调
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
     * 高阶滤镜数据
     * @type {Object}
     * @prop {Number} id 滤镜数据ID
     * @prop {Sumber} url - zip数据源
     * @prop @deprecated {Number} strong 强度
     * @prop {Number} intensity - 强度
     */
    filterInfo: null,

    /**
     * 是否为用户添加模板
     * @type {Boolean}
     */
    userAdded: false,

    /**
     * 布局所有元素是否加载加载完成
     * @type {boolean}
     */
    $loaded: false,
    /**
     * 布局元素是否被拖拽过
     * @type {boolean}
     */
    $dragOver: false,
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

export function createDefaultTransform() {
    return { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
}

export default layout;
