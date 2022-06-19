import { version } from '../../../package.json';
import { isObject, isArray, forIn } from 'lodash';
import tinycolor from 'tinycolor2';
import options from './options';
import layout from './layout';
import element from './element';
import border from './border';
import backgroundEffect from './background-effect';
import backgroundGlobal from './background-global';

/**
 * @module editorDefaults
 */
const editorDefaults = {
    /**
     * 文件格式文档版本号
     * @memberof module: editorDefaults
     * @type { String }
     */
    version: process.env.VUE_APP_DOCUMENT_VERSION || version,

    // 编辑器配置
    options,

    /**
     * 元信息: 可用于备注、埋点、付费素材、业务信息储存
     * @memberof module:editorDefaults
     * @type { ?Object }
     * @prop { Number } batchId 元素批量ID，关联多个元素的操作（图片标记时有用）
     * @prop { Array<Object> } materials 元素付费时，素材ID信息
     * @prop { Object } thirdParty 第三方编辑能力缓存，消除笔，抠图等
     * @example {
            // 图片编辑器 - 批量编辑 uid
            batchId: 23432432432432,
            // 素材关联，检测付费内容
            materials: [{ id: 34422, type: 'image', fromUser: true }],
            thirdParty: {
                // 抠图
                matting: {
                    workId: 1111, // 抠图记录ID
                    url: '' // 原图地址
                },
                inpaint: {
                    url: '' // 结果图地址
                },
                // 美化图片(图片标记)
                imageEditor: {
                    workId: 1111 // 作图记录ID
                }
            },
            // 二维码组件
            qrcode: {
                "frontImage": "",
                "frontColor": "#ff2939FF",
                "backColor": "#ffffff00",
                "iconUrl": "https://st0.dancf.com/csc/213/configs/system/20200724-133551-0bde.png"
            },
            // 批量套版
            batchMark: {
                // 图片填充方式,
                fitType: 'fill/fit',
                // fitType 为 fit 时需记录原始位置
                height: 144,
                left: 42,
                top: 0,
                width: 170,

                // 标记顺序
                sort: 1,
            },
            // 关联列表组件
            linkListInfo: {
                mainId: 主模板ID (模板 content 为选中的元素),
                resourceId: 数据源模板ID (模板 content 为批量套版编辑页的产物),
                space: 关联列表子元素间距（缓存子元素间距，跟右侧面板控制条绑定）
            }
     * }
     */
    metaInfo: null,

    /**
     * 模板 global 数据
     * @memberof module:editorDefaults
     * @enum
     */
    global: {
        zoom: 1,
        /**
         * 该模板的 dpi
         * @type {Number}
         */
        dpi: 72,
        /**
         * 该模板的像素单位
         * @type {String}
         * @default px
         */
        unit: 'px',
        /**
         * 显示模板级的水印
         * @type {Boolean}
         */
        showWatermark: false,
        /**
         * 参考线
         * @type {Array<Object>}
         * @example [{
         *      id: number,
         *      type: 'horizontal' | 'vertical',
         *      top: number,
         *      left: number,
         *  }]
         *
         */
        referenceLines: [],
        /**
         * 全局背景属性
         * @type {Object}
         */
        layout: backgroundGlobal,
        /**
         * 存放元数据，可用于备注、埋点、付费素材、业务信息储存 {@link module:editorDefaults.metaInfo|元信息}
         * @type { * }
         */
        metaInfo: null,
        /**
         * 封面信息
         */
        cover: null,
    },

    globalExts: {
        $draging: false,
        $rendered: false,
        $loaded: false,
        $tempGroup: false,
        // 参考线是否拖动状态
        $referenceLineDraging: false,
    },

    // 布局元素属性
    layout,
    // 元素属性
    element,
    // 边框属性
    border,
    // 元素背景属性
    backgroundEffect,

    /**
     * 元素在 flex 中的属性
     * @memberof module:editorDefaults
     * @enum
     */
    flex: {
        /**
         * 元素在 flex 中横轴的对齐方式
         * @type { String } flex-start, flex-end, center, stretch, baseline
         */
        alignSelf: 'auto',

        /**
         * 元素在 flex 会占用多少的空间
         * @type { Number }
         */
        flexGrow: 0,

        /**
         * 元素在 flex 中的收缩系数
         * @type { Number }
         */
        flexShrink: 1,

        /**
         * 设置元素在 flex 中的初始大小, -1 表示为 ‘auto’
         * @type { Number }
         */
        flexBasis: -1,

        /**
         * 元素的外间距
         * @type { Array<Number> } [top, right, bottom, left]
         */
        margin: [0, 0, 0, 0],
    },

    // ext props
    elementExts: {
        $id: 0,
        $loaded: false,
        // 是否被选中，多用于多选、框选状态
        $selected: false,
        // 是否在编辑态
        $editing: false,
        // 是否在resize、drag
        $draging: false,
        // 是否展示闪烁动画
        $blinking: false,
        // 图片、图框元素是否正在处理快捷裁剪
        $imageDraging: false,

        // 参考线相关
        $guider: { show: true, snapTo: true, marginShow: true, resizeShow: true },

        // ext fns
        $getDragLimit: null,
        $getResizeLimit: null,
        $dragLimit: false,
        $resizeLimit: false,
        $autoFlatten: true,

        // 父 groupID
        $parentId: '',
        // 临时解组后缓存父 groupID
        $cacheParentId: '',
        // 关联临时组状态，唯一ID
        $tempGroupId: '',
        // render 后生成的唯一ID
        $renderId: '',
        // 临时禁用元素本身拖拽能力
        $dragable: true,
    },

    /**
     * 文字特效属性
     * @deprecated
     * @memberof module:editorDefaults
     * @enum
     */
    textEffect: {
        /**
         * 是否启用特效
         * @type { Boolean }
         */
        enable: true,

        /**
         * 参数调节时忽略的字段名，可选 'stroke' | 'shadow' | 'filling'
         * @type { Array<String> }
         */
        excludeScale: [],

        /**
         * 偏移量
         * @type { Object }
         * @prop { Number } x 偏移
         * @prop { Number } y 偏移
         */
        offset: {
            enable: false,
            x: 0,
            y: 0,
        },
        /**
         * 斜切
         * @type { Object }
         * @prop { Boolean } enable 是否启用
         * @prop { Number } x 度数
         * @prop { Number } y 度数
         */
        skew: {
            enable: false,
            x: 0,
            y: 0,
        },
        /**
         * 描边
         * @type { Object }
         * @prop { Boolean } enable 是否启用
         * @prop { String } type 描边类型 center(居中描边) | outer(外描边)
         * @prop { String } color 描边色值
         * @prop { Number } width 描边宽度
         */
        stroke: {
            enable: false,
            // center(居中描边)/outer(外描边)
            type: 'center',
            color: '#000000',
            width: 0,
        },
        /**
         * 填充
         * @type { Object }
         * @prop { Boolean } enable 是否启用
         * @prop { Number } type 填充类型 0: 纯色填充 1：图片填充 2：渐变填充
         * @prop { String } color 色值
         * @prop { Object } imageContent 图片填充属性
         * @prop { Object } gradient 渐变填充属性
         */
        filling: {
            enable: false,
            // 0: 纯色填充 1：图片填充 2：渐变填充
            type: 0,
            color: '#000000',
            imageContent: {
                // 填充方式
                // 约定 0: 不平铺 1: 水平平铺 2: 垂直平铺 3: 水平垂直平铺
                // 目前 APP 不支持单独水平平铺和单独垂直平铺
                repeat: 0,
                // 缩放比例
                // 0~1 对应 0%~100% 范围
                scaleX: 1,
                scaleY: 1,
                // 填充图片，为 null 时使用渐变填充
                image: null,
                width: null,
                height: null,
            },
            // 渐变填充
            gradient: {
                // 是否逐行渐变，默认值 0
                byLine: 0,
                // 渐变角度，默认值 0
                angle: 0,
                stops: [
                    // 渐进色，偏移值 0-1
                    { color: '#FFFFFF', offset: 0 },
                    { color: '#000000', offset: 1 },
                ],
            },
        },
    },

    /**
     * 图片特效属性
     * @deprecated
     * @memberof module:editorDefaults
     * @enum
     */
    imageEffect: {
        /**
         * 是否启用特效
         * @type { Boolean }
         */
        enable: true,
        collapse: false,
        /**
         * 参数调节时忽略的字段名，可选 'stroke' | 'shadow' | 'filling'
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
         */
        stroke: {
            enable: false,
            color: '#000000',
            width: 0,
        },
        /**
         * 扩边
         * @type { Object }
         * @prop { Boolean } enable 是否启用
         * @prop { Object } offset 扩边
         * @prop { Number } scale 用于调节大小
         */
        expand: {
            enable: false,
            offset: {
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
            },
            scale: 1,
        },
        /**
         * 填充
         * @type { Object }
         * @prop { Number } type 填充类型 color: 纯色填充 image：图片填充 gradient：渐变填充
         * @prop { String } color 色值
         * @prop { Object } imageContent 图片填充属性
         * @prop { Object } gradient 渐变填充属性
         */
        filling: {
            enable: false,
            type: 'color',
            color: '#000000',
            imageContent: {
                // 填充方式 no-repeat repeat repeat-x repeat-y
                repeat: 'no-repeat',
                // 缩放比例
                // 0~1 对应 0%~100% 范围
                scaleX: 1,
                scaleY: 1,
                // 填充图片
                image: null,
                width: null,
                height: null,
            },
            // 渐变填充
            gradient: {
                // 是否逐行渐变，默认值 0, 目前没用
                byLine: 0,
                // 渐变角度，默认值 0
                angle: 0,
                stops: [
                    // 渐进色，偏移值 0-1
                    { color: '#FFFFFF', offset: 0 },
                    { color: '#000000', offset: 1 },
                ],
                // 渐变类型，默认值为 linear
                type: 'linear',
            },
        },
        /**
         * 蒙版
         * @type { Object }
         * @prop { Boolean } enable 是否启用
         * @prop { String } type 自带图形 ellipse、rectRounded、rectRoundedTopLeftAndRightBottom、parallelogram、star、diamond, 自定义图形 image、 custom (和图片大小相同的矩形，目前主要用于圆角)
         * @prop { String } image mask 图片地址
         * @prop { String } height mask 高度
         * @prop { String } width mask 宽度
         * @prop { Number } radius 圆角，只对 type 为 custom 有效
         * @prop { String } repeat 填充方式 no-repeat repeat repeat-x repeat-y
         */
        mask: {
            type: 'ellipse',
            enable: false,
            image: null,
            height: null,
            width: null,
            radius: 0,
            repeat: 'no-repeat',
        },
    },

    /**
     * 特效属性
     * @memberof module:editorDefaults
     * @enum
     */
    effect: {
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
            enable: false,
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
            width: 4,
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
    },

    /**
     * 投影默认数据
     */
    shadow: {
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
            opacity: 1,
            blur: 4,
            blurType: 'base',
            advancedBlur: {
                blurs: [
                    { offset: 0, value: 0 },
                    { offset: 1, value: 1 },
                ],
                opacities: [
                    { offset: 0, value: 0 },
                    { offset: 1, value: 1 },
                ],
            },
            color: '#000000ff',
            scaleX: 1,
            scaleY: 1,
        },
        /** 倾斜投影 */
        skew: {
            enable: true,
            type: 'skew',
            mask: '',
            offsetX: 6,
            offsetY: 6,
            opacity: 1,
            blur: 4,
            blurType: 'base',
            advancedBlur: {
                blurs: [
                    { offset: 0, value: 0 },
                    { offset: 1, value: 1 },
                ],
                opacities: [
                    { offset: 0, value: 0 },
                    { offset: 1, value: 1 },
                ],
            },
            color: '#000000ff',
            scaleX: 0.7,
            scaleY: 0.7,
            angle: 1,
            overlap: 0,
        },
        /** 接触投影 */
        contact: {
            enable: true,
            type: 'contact',
            mask: '',
            offsetX: 6,
            offsetY: 6,
            opacity: 1,
            blur: 4,
            blurType: 'base',
            advancedBlur: {
                blurs: [
                    { offset: 0, value: 0 },
                    { offset: 1, value: 1 },
                ],
                opacities: [
                    { offset: 0, value: 0 },
                    { offset: 1, value: 1 },
                ],
            },
            color: '#000000ff',
        },
        /** 倒影 */
        reflect: {
            enable: true,
            type: 'reflect',
            mask: '',
            offsetX: 6,
            offsetY: 6,
            opacity: 1,
            blur: 4,
            blurType: 'base',
            advancedBlur: {
                blurs: [
                    { offset: 0, value: 0 },
                    { offset: 1, value: 1 },
                ],
                opacities: [
                    { offset: 0, value: 0 },
                    { offset: 1, value: 1 },
                ],
            },
            direction: 'bottom',
        },
    },
    /**
     * 图片元素属性
     * @memberof module:editorDefaults
     * @enum
     */
    imageElement: {
        /**
         * 原始图片地址
         * @type {String}
         */
        url: '',

        /**
         * 加过图片特效后的地址
         * @type {String}
         */
        imageUrl: '',

        /**
         * 图片特效引用后 imageUrl 的相关信息
         * @type { Object }
         * @prop { Number } width 加过图片特效后的宽度
         * @prop { Number } height 加过图片特效后的高度
         * @prop { Number } image 加过图片特效后，相对于元素本身位置的x偏移
         * @prop { Number } height 加过图片特效后，相对于元素本身位置的y偏移
         */
        effectedResult: {
            width: 0,
            height: 0,
            left: 0,
            right: 0,
        },

        /**
         * 图片特效数组[{@link module:editorDefaults.imageEffect|图片特效}]
         * @type {Array}
         */
        imageEffects: [],

        /**
         * 投影
         * @type {Array}
         */
        shadows: [],

        /**
         * 参与聚合调节的特效颜色组
         * @type {Array}
         */
        aggregatedColors: [],

        /**
         * 特效主色
         * @type {String}
         */
        mainColor: null,

        /**
         * 特效相对初始值的缩放比例
         * @type {Number}
         */
        effectScale: 1,

        /**
         * 图像裁剪变形
         * @type {Object}
         */
        imageTransform: { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 },

        /**
         * 滤镜数据
         * @type { { id: number, url: string, strong: number, intensity: number } }
         */
        filterInfo: null,
        /**
         * url 图片原始宽度
         * @type {String}
         */
        naturalWidth: 0,

        /**
         * url 图片原始高度
         * @type {String}
         */
        naturalHeight: 0,

        /**
         * 判断资源类型 譬如: image、video、gif、apng
         * @type {String}
         */
        resourceType: 'image',

        /**
         * apng、gif 持续时间（单位ms)
         * @type {Number}
         */
        naturalDuration: 0,

        /**
         * mask 开关 默认图片可以被 mask
         * @type {Boolean}
         */
        enableDragToMask: true,

        /**
         * 混合模式
         * @type {String}
         */
        blendMode: 'blendNormal',

        /**
         * 循环次数，目前只支持无限循环与不循环，0 代表无限循环
         * @type {Number}
         */
        loop: 0,

        /**
         * 播放状态
         * @type {Boolean}
         */
        $playing: false,

        /**
         * 帧列表
         * @type { Array<Frame> }
         */
        $frames: [],

        /**
         * 当前播放时间
         * @type {Number}
         */
        $currentTime: 0,

        /**
         * ImageRenderer 开关 控制特效、滤镜的渲染流程
         * @type {Boolean}
         */
        $enableImageRenderer: true,

        /**
         * 变速
         */
        speed: 1,
    },

    /**
     * 视频元素属性
     * @memberof module:editorDefaults
     * @enum
     */
    videoElement: {
        /**
         * 原始视频地址
         * @type {String}
         */
        url: '',

        /**
         * 蒙版图像 url 地址
         * @type {String}
         */
        mask: '',

        /**
         * 视频原始宽度，主要应用于视频尺寸变更
         * @type {Number}
         */
        naturalWidth: 0,

        /**
         * 视频原始高度，主要应用于视频尺寸变更
         * @type {Number}
         */
        naturalHeight: 0,

        /**
         * 图像宽度
         * @type {Number}
         */
        imageWidth: 0,

        /**
         * 图像高度
         * @type {Number}
         */
        imageHeight: 0,

        /**
         * 特效主色
         * @type {String}
         */
        // mainColor: null,

        /**
         * 图片特效引用后 imageUrl 的相关信息
         * @type { Object }
         * @prop { Number } width 加过图片特效后的宽度
         * @prop { Number } height 加过图片特效后的高度
         * @prop { Number } image 加过图片特效后，相对于元素本身位置的x偏移
         * @prop { Number } height 加过图片特效后，相对于元素本身位置的y偏移
         */
        effectedResult: {
            width: 0,
            height: 0,
            left: 0,
            right: 0,
        },

        /**
         * 图像裁剪变形
         * @type {Object}
         */
        imageTransform: { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 },

        /**
         * 视频裁剪 - 截取开始时间(单位:ms)
         * @type {Number}
         */
        startTime: 0,

        /**
         * 视频裁剪 - 截取结束时间(单位:ms)
         * @type {Number}
         */
        endTime: 0,

        /**
         * 视频总时长（单位ms)
         * @type {Number}
         */
        naturalDuration: 0,

        /**
         * 预览图地址
         * @type {String}
         */
        previewImageUrl: '',

        /**
         * 废弃: 用 naturalDuration 代替
         * 视频总时长(单位:s)
         * @type {Number}
         */
        duration: 0,

        /**
         * 帧率
         * @type {Number}
         */
        fps: 30,

        /**
         * 音量 0 - 1
         * @type {Number}
         */
        volume: 1,

        /**
         * 播放速度 0 - 3
         * @type {Number}
         */
        speed: 1,

        /**
         * 声音特效
         * @type {string}
         */
        voxType: 'default',

        /**
         * 视频当前播放帧
         * @type {Number}
         */
        currentFrame: 0,

        /**
         * 循环次数，目前只支持无限循环与不循环，0 代表无限循环
         * @type {Number}
         */
        loop: 1,

        /**
         * 是否静音
         * @type {Boolean}
         */
        muted: false,

        /**
         * 是否倒放, 暂不支持
         * @type {Boolean}
         */
        invertPlay: false,

        /**
         * @type { Boolean } 是否播放
         */
        $playing: false,

        /**
         * 视频当前播放时间(单位:ms)
         * @type {Number}
         */
        $currentTime: 0,
    },

    /**
     * 音频元素属性
     * @memberof module:editorDefaults
     * @enum
     */
    audioElement: {
        /**
         * 原始音频地址
         * @type {String}
         */
        url: '',

        /**
         * 音频裁剪 - 截取开始时间(单位:毫秒)
         * @type {Number}
         */
        startTime: 0,

        /**
         * 音频裁剪 - 截取结束时间(单位:毫秒)
         * @type {Number}
         */
        endTime: 0,

        /**
         * 音频总时长（单位ms)
         * @type {Number}
         */
        naturalDuration: 0,

        /**
         * 废弃: 用 naturalDuration 代替
         * 视频总时长(单位:s)
         * @type {Number}
         */
        duration: 0,

        /**
         * 音量 0 - 1
         * @type {Number}
         */
        volume: 1,

        /**
         * 播放速度 0 - 3
         * @type {Number}
         */
        speed: 1,

        /**
         * 声音特效
         * @type {String}
         */
        voxType: 'default',

        /**
         * 音频当前播放时间(单位:秒)
         * @type {Number}
         */
        $currentTime: 0,

        /**
         * 循环次数，目前只支持无限循环与不循环，0 代表无限循环
         * @type {Number}
         */
        loop: 1,

        /**
         * 是否静音
         * @type {Boolean}
         */
        muted: false,

        /**
         * 是否倒放
         * @type {Boolean}
         */
        invertPlay: false,

        /**
         * 音乐文件标题
         */
        title: '',

        hidden: true,
        frozen: true,
        width: 0,
        height: 0,
        padding: [0, 0, 0, 0],
    },

    /**
     * 文字元素属性
     * @memberof module:editorDefaults
     * @enum
     */
    textElement: {
        /**
         * 文字颜色
         * @type {String}
         */
        color: '#000000',

        /**
         * 内边距
         * @type {Array}
         */
        padding: [0, 0, 0, 0],

        /**
         * 字体名称
         * @type {String}
         */
        fontFamily: 'Simsun',

        /**
         * 文字风格
         * @type {String}
         */
        fontStyle: 'normal',

        /**
         * 字体粗细
         * @type {Number}
         */
        fontWeight: 400,

        /**
         * 字号大小
         * @type {Number}
         */
        fontSize: 20,

        /**
         * 行高
         * @type {Number}
         */
        lineHeight: 1.2,

        /**
         * 字间距
         * @type {Number}
         */
        letterSpacing: 0,

        /**
         * 文字装饰
         * @type {String}
         */
        textDecoration: 'none',

        /**
         * 文字书写方向：横、竖
         * @type {String}
         */
        writingMode: 'horizontal-tb', // [horizontal-tb, vertical-rl]

        /**
         * 水平对齐 left、right、center、justify
         * @type {String}
         */
        textAlign: 'left',

        /**
         * 垂直对齐
         * @type {String}
         */
        verticalAlign: 'top',

        /**
         * 文本内容
         * @type {String}
         */
        content: '',
        /**
         * 富文本序列化内容, 旧版为content
         * @type {Array}
         * @example [{ fontSize: 12, fontFamily: '黑体', fontWeight: 700, fontStyle: 'nomarl', textDecoration: 'none', content: '123' }]
         */
        contents: [],
        /**
         * 特效相对初始值的缩放比例
         * @type {Number}
         */
        effectScale: 1,

        /**
         * 阴影 {color: '#00FF00FF', offsetX: 2, offsetY: 4, blurRadius: 5}
         * @type {Object}
         */
        textShadow: null,

        /**
         * 缩放控制柄，默认为 5 对应的六点模式
         * @type {Number}
         */
        resize: 5,

        /**
         * resize 时是否自动缩放字号
         * @type {Number}
         */
        autoScale: true,

        /**
         * 文字特效数组[{@link module:editorDefaults.textEffect|文字特效}]
         * @type {Array}
         */
        textEffects: [],

        /**
         * 投影
         * @type {Array}
         */
        shadows: [],

        /**
         * 参与聚合调节的特效颜色组
         * @type {Array}
         */
        aggregatedColors: [],

        /**
         * 特效主色
         * @type {String}
         */
        mainColor: null,

        /**
         * 列表样式
         * @type {String}
         */
        listStyle: '',

        /**
         * 宽、高是否自增
         * 0b00不自增、0b01高度自增、0b10宽度自增、0b11宽高同时自增
         * @type {Number}
         */
        autoAdaptive: 0b01,

        /**
         * 字号是否自动缩小，autoAdaptive 为宽高固定时有效（web 暂不支持）
         * @type {Boolean}
         */
        adjustsFontSize: false,
    },

    /**
     * SVG 元素属性
     * @memberof module:editorDefaults
     * @enum
     */
    svgElement: {
        /**
         * SVG 外部 url 地址，与 `content` 二选一
         * @type {String}
         */
        url: '',

        /**
         * SVG 文本 xml 内容，与 `url` 二选一，优先级高于 `url`
         * @type {String}
         */
        content: '',

        /**
         * 颜色数组
         * @type {Array.<String>}
         */
        colors: null,

        /**
         * 缩放控制柄
         * @type {Number}
         */
        resize: 0b111,

        /**
         * 文本容器子元素变换状态
         * @type {Object}
         */
        containerTransform: null,
        /* 结构形如
        {
            scale: 1,
            nw: { sx: 1, sy: 1, tx: 0, ty: 0 },
            n: { sx: 1, sy: 1, tx: 0, ty: 0 },
            ne: { sx: 1, sy: 1, tx: 0, ty: 0 },
            w: { sx: 1, sy: 1, tx: 0, ty: 0 },
            c: { sx: 1, sy: 1, tx: 0, ty: 0 },
            e: { sx: 1, sy: 1, tx: 0, ty: 0 },
            sw: { sx: 1, sy: 1, tx: 0, ty: 0 },
            s: { sx: 1, sy: 1, tx: 0, ty: 0 },
            se: { sx: 1, sy: 1, tx: 0, ty: 0 }
        }
        */
    },

    /**
     * 蒙版元素属性
     * @memberof module:editorDefaults
     * @enum
     */
    maskElement: {
        /**
         * 缩放控制柄，默认为 1 对应的4点模式
         * @type {Number}
         */
        resize: 1,

        /**
         * 应用蒙版图像前的 **原始图片** 地址
         * @type {String}
         */
        url: '',

        /**
         * 蒙版图像url地址
         * @type {String}
         */
        mask: '',

        /**
         * 蒙版元素应用后图像地址，最终 **显示图像** 的地址
         * @type {String}
         */
        imageUrl: '',

        /**
         * 图像裁剪变形
         * @type {Object}
         */
        imageTransform: { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 },

        /**
         * 图片特效引用后 imageUrl 的相关信息
         * @type { Object }
         * @prop { Number } width 加过图片特效后的宽度
         * @prop { Number } height 加过图片特效后的高度
         * @prop { Number } image 加过图片特效后，相对于元素本身位置的x偏移
         * @prop { Number } height 加过图片特效后，相对于元素本身位置的y偏移
         */
        effectedResult: {
            width: 0,
            height: 0,
            left: 0,
            right: 0,
        },

        /**
         * 参与聚合调节的特效颜色组
         * @type {Array}
         */
        aggregatedColors: [],

        /**
         * 特效主色
         * @type {String}
         */
        mainColor: null,

        /**
         * 特效相对初始值的缩放比例
         * @type {Number}
         */
        effectScale: 1,

        /**
         * 图片特效数组[{@link module:editorDefaults.imageEffect|图片特效}]
         * @type {Array}
         */
        imageEffects: [],

        /**
         * 投影
         * @type {Array}
         */
        shadows: [],

        /**
         * 滤镜数据
         * @type { { id: number, url: string, strong: number, intensity: number } }
         */
        filterInfo: null,

        /**
         * url 图片原始宽度
         * @type {String}
         */
        naturalWidth: 0,

        /**
         * url 图片原始高度
         * @type {String}
         */
        naturalHeight: 0,

        /**
         * 判断资源类型 譬如: image、video、gif、apng
         * @type {String}
         */
        resourceType: 'image',

        /**
         * 帧列表
         * @type { Array<Frame> }
         */
        $frames: [],

        /**
         * 当前播放时间
         * @type {Number}
         */
        $currentTime: 0,

        /**
         * ImageRenderer 开关 控制特效、滤镜的渲染流程
         * @type {Boolean}
         */
        $enableImageRenderer: true,

        /**
         * apng、gif 持续时间（单位ms)
         * @type {Number}
         */
        naturalDuration: 0,

        /**
         * 混合模式
         * @type {String}
         */
        blendMode: 'blendNormal',

        /**
         * 循环次数，目前只支持无限循环与不循环，0 代表无限循环
         * @type {Number}
         */
        loop: 0,
    },

    /**
     * 组元素属性
     * @memberof module:editorDefaults
     * @enum
     */
    groupElement: {
        /**
         * 组元素内的元素{@link module:editorDefaults.element|element}数组
         * @type {Array<element>}
         */
        elements: [],

        /**
         * 组合是否对用户可拆分
         * @type {Boolean}
         */
        splitenable: true,

        /**
         * 显示缩放控制柄，默认 1，四个角控制柄
         * @type {Number}
         */
        resize: 1,

        /**
         * 判断是由 点九图、文字 组成的组元素
         * 组内文本元素尺寸变更时其他元素是否自适应
         * @type {Boolean}
         */
        autoGrow: false,
    },

    /**
     * 点九元素属性
     * @memberof module:editorDefaults
     * @enum
     */
    ninePatchElement: {
        /**
         * 原始图片地址
         * @type {String}
         */
        url: '',

        /**
         * 拉伸后的图片地址
         * @type {String}
         */
        imageUrl: '',

        /**
         * 图片用于拉伸的位置
         * @type {Object}
         */
        imageSlice: {
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
        },

        /**
         * 图片原始宽度
         * @type {Number}
         */
        originWidth: 0,

        /**
         * 图片原始高度
         * @type {Number}
         */
        originHeight: 0,

        /**
         * 记录 imageSlice、originWidth、originHeight 的缩放比例
         * @type {Number}
         */
        effectScale: 1,
    },

    /**
     * 水印元素属性
     * @memberof module:editorDefaults
     * @enum
     */
    watermarkElement: {
        /**
         * 缩放控制柄，默认为 1 对应的4点模式
         * @type {Number}
         */
        resize: 1,
        /**
         * 是否可分组
         * @type {Boolean}
         */
        groupable: false,
        /**
         * @type { Number } 水印类型，0: 普通水印，1:全屏水印
         */
        waterType: 0,

        /**
         * @type { Boolean } 是否自定义水印
         */
        isCustom: false,

        /**
         * @type { Number } 水印元素的渲染结果图
         */
        imageUrl: '',
        /**
         * @type { Number } 水印元素的渲染结果宽度
         */
        imageWidth: 0,
        /**
         * @type { Number } 水印元素的渲染结果图高度
         */
        imageHeight: 0,

        /**
         * @type { Number } 水印单元的 x 位置
         */
        cellLeft: 0,

        /**
         * @type { Number } 水印单元的 y 位置
         */
        cellTop: 0,

        /**
         * @type { Number } 水印单元的 transform
         */
        cellTransform: { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 },

        /**
         * @type { Object } 全屏水印配置，为 null 则不允许设置全屏水印
         */
        fullScreenInfo: {
            left: 0,
            top: 0,
            // 左缩进距离
            leftIndent: 0,
            // 行内水印单元的间距
            colGap: 0,
            // 与上一行的间距
            rowGap: 0,

            // 废弃, 提至外部，transform 用 template.transform 替代
            repeat: [
                {
                    // 左缩进距离
                    leftIndent: 0,
                    // 行内水印单元的间距
                    colGap: 0,
                    // 与上一行的间距
                    rowGap: 0,
                    // 该行水印的变形，主要用于旋转与缩放
                    transform: { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 },
                },
            ],
        },
        /**
         * @type { Array<Object> } 水印模板配置
         */
        template: {
            // 该行水印的变形，主要用于旋转与缩放
            transform: { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 },
        },

        logo: {
            /**
             * @type { Boolean } 是否显示 logo
             */
            enable: true,
            /**
             * @type { String } logo 图片地址
             */
            url: '',

            /**
             * @type { String }默认图片地址
             */
            defaultUrl: '',

            /**
             * @type { String } 提示语
             */
            placeholder: '',
        },

        $logoModel: null,
        $infoModels: [],
        $titleModel: null,
        $backgroundModel: null,
    },
    /**
     * 矩形线框元素属性
     * @memberof module:editorDefaults
     * @enum
     */
    rectElement: {
        /**
         * 圆角半径
         * @type {Number}
         */
        radius: 0,

        /**
         * 填充颜色
         * @type {String}
         */
        fill: null,

        /**
         * 描边颜色
         * @type {String}
         */
        stroke: '#000000FF',

        /**
         * 描边宽度
         * @type {Number}
         */
        strokeWidth: 1,

        /**
         * 描边线条样式 solid / dotted / dashed;
         * dashed 默认 strokeDasharray = [2, 1]
         * dotted 默认 strokeDasharray = [1, 1]
         * @type {String}
         */
        strokeLineStyle: 'solid',

        /**
         * 自定义虚线长度、间距
         * strokeLineStyle = dotted / dashed 时有用
         * https://www.cnblogs.com/daisygogogo/p/11044353.html
         * [1, 0.5, ...] = [1 * strokeWidth, 0.5 * strokeWidth, ...]
         * @type {Array}
         */
        strokeDasharray: [],

        /**
         * 是否开启压黑 layout.backgroundMask
         * @type {Number}
         */
        maskEnable: false,
    },

    /**
     * 圆、椭圆线框元素属性
     * @memberof module:editorDefaults
     * @enum
     */
    ellipseElement: {
        /**
         * 填充颜色
         * @type {String}
         */
        fill: null,

        /**
         * 描边颜色
         * @type {String}
         */
        stroke: '#000000FF',

        /**
         * 描边宽度
         * @type {Number}
         */
        strokeWidth: 1,

        /**
         * 描边线条样式 solid / dotted / dashed;
         * dashed 默认 strokeDasharray = [2, 1]
         * dotted 默认 strokeDasharray = [1, 1]
         * @type {String}
         */
        strokeLineStyle: 'solid',

        /**
         * 自定义虚线长度、间距
         * strokeLineStyle = dotted / dashed 时有用
         * https://www.cnblogs.com/daisygogogo/p/11044353.html
         * [1, 0.5, ...] = [1 * strokeWidth, 0.5 * strokeWidth, ...]
         * @type {Array}
         */
        strokeDasharray: [],

        /**
         * 是否开启压黑 layout.backgroundMask
         * @type {Number}
         */
        maskEnable: false,
    },

    /**
     * 线条元素属性
     * @memberof module:editorDefaults
     * @enum
     */
    lineElement: {
        /**
         * 描边颜色
         * @type {String}
         */
        stroke: '#000000FF',

        /**
         * 描边宽度
         * @type {Number}
         */
        strokeWidth: 1,

        /**
         * 描边线条样式 solid / dotted / dashed;
         * dashed 默认 strokeDasharray = [2, 1]
         * dotted 默认 strokeDasharray = [1, 1]
         * @type {String}
         */
        strokeLineStyle: 'solid',

        /**
         * 自定义虚线长度、间距
         * strokeLineStyle = dotted / dashed 时有用
         * https://www.cnblogs.com/daisygogogo/p/11044353.html
         * [1, 0.5, ...] = [1 * strokeWidth, 0.5 * strokeWidth, ...]
         * @type {Array}
         */
        strokeDasharray: [],

        /**
         * 只需左右两个拖拽点
         * @type {Number}
         */
        resize: 4,
    },

    /**
     * 箭头元素属性
     * @memberof module:editorDefaults
     * @enum
     */
    arrowElement: {
        /**
         * 箭头颜色
         * @type {String}
         */
        color: '#000000FF',

        /**
         * 箭头位置大小信息
         * @type {Object}
         */
        head: {
            svg: '',
            // 当 svg 为地址时，$svg = 地址的 xml 内容
            $svg: '',
            left: 0,
            top: 0,
            width: 0,
            height: 0,
        },

        /**
         * 箭尾位置大小信息
         * @type {Object}
         */
        tail: {
            svg: '',
            // 当 svg 为地址时，$svg = 地址的 xml 内容
            $svg: '',
            left: 0,
            top: 0,
            width: 0,
            height: 0,
        },

        /**
         * 箭身位置大小信息
         * @type {Object}
         */
        trunk: {
            top: 0,
            left: 0,
            width: 0,
            height: 0,
            // 贴近尾部的高度
            leftHeight: 0,
            // 贴近头部的高度
            rightHeight: 0,
        },

        /**
         * 只需左右两个拖拽点
         * @type {Number}
         */
        resize: 4,

        /**
         * 宽度小于该值时元素整体缩放
         * @type {Number}
         */
        minWidth: 150,

        $originalScale: null,

        /**
         * 达最小尺寸时整体缩放
         * width 小于 minWidth 时有用
         * @type {Number}
         */
        $minScale: 1,
    },

    /**
     * 笔刷元素属性
     * @memberof module:editorDefaults
     * @enum
     */
    brushElement: {
        /**
         * SVG 路径
         * @type String
         * @example M0 0 Q100 100 100 100
         */
        path: '',

        /**
         * 笔刷颜色
         * @type {String}
         */
        stroke: '#000000FF',

        /**
         * 描边宽度
         * @type {Number}
         */
        strokeWidth: 1,

        /**
         * 描边线条样式 solid / dotted / dashed;
         * dashed 默认 strokeDasharray = [2, 1]
         * dotted 默认 strokeDasharray = [1, 1]
         * @type {String}
         */
        strokeLineStyle: 'solid',

        /**
         * 自定义虚线长度、间距
         * strokeLineStyle = dotted / dashed 时有用
         * https://www.cnblogs.com/daisygogogo/p/11044353.html
         * [1, 0.5, ...] = [1 * strokeWidth, 0.5 * strokeWidth, ...]
         * @type {Arrar<Number>}
         */
        strokeDasharray: [],
    },

    /**
     * 特效文字元素属性
     * @memberof module:editorDefaults
     * @enum
     */
    effectTextElement: {
        $miniFontSize: 12,
        /**
         * 用来文字排版的宽高
         * @type {String}
         */
        typoWidthRatio: 1,
        typoHeightRatio: 1,

        /**
         * 文字颜色
         * @type {String}
         */
        color: '#000000',

        /**
         * 内边距
         * @type {Array}
         */
        padding: [0, 0, 0, 0],

        /**
         * 字体名称
         * @type {String}
         */
        fontFamily: 'Simsun',

        /**
         * 文字风格
         * @type {String}
         */
        fontStyle: 'normal',

        /**
         * 字体粗细
         * @type {Number}
         */
        fontWeight: 400,

        /**
         * 字号大小
         * @type {Number}
         */
        fontSize: 20,

        /**
         * 行高
         * @type {Number}
         */
        lineHeight: 1.2,

        /**
         * 字间距
         * @type {Number}
         */
        letterSpacing: 0,

        /**
         * 文字装饰
         * @type {String}
         */
        textDecoration: 'none',

        /**
         * 文字书写方向：横、竖
         * @type {String}
         */
        writingMode: 'horizontal-tb', // [horizontal-tb, vertical-rl]

        /**
         * 水平对齐
         * @type {String}
         */
        textAlign: 'left',

        /**
         * 垂直对齐
         * @type {String}
         */
        verticalAlign: 'top',

        /**
         * 富文本序列化内容, 旧版为content
         * @type {Array}
         * @example [{ fontSize: 12, fontFamily: '黑体', fontWeight: 700, fontStyle: 'nomarl', textDecoration: 'none', content: '123' }]
         */
        contents: [],

        /**
         * 特效相对初始值的缩放比例
         * @type {Number}
         */
        effectScale: 1,

        /**
         * 缩放控制柄，默认为 1 对应的4点模式
         * @type {Number}
         */
        resize: 1,

        /**
         * 文字特效数组[{@link module:editorDefaults.textEffect|文字特效}]
         * @type {Array}
         */
        textEffects: [],

        /**
         * 投影
         * @type {Array}
         */
        shadows: [],

        /**
         * 变形
         * @type {Object}
         */
        deformation: {
            enable: false,
            type: 'archCurve', // 变形类型 -byWord 结尾的是逐字排版
            intensitys: [50], // 用来控制变形强度，不同变形控制参数个数不同
            isFollowTangent: true, // 逐字排版文字方向是否跟随曲线发现
            randNum: 0, // 用来确定随机状态的随机数
        },

        /**
         * 参与聚合调节的特效颜色组
         * @type {Array}
         */
        aggregatedColors: [],

        /**
         * 特效主色
         * @type {String}
         */
        mainColor: null,

        /**
         * 记录渲染用的画布大小和位置
         * @type {String}
         */
        image: {
            offset: {
                x: 0,
                y: 0,
            },
            width: 400,
            height: 200,
        },

        autoAdaptive: 0b11,
    },

    threeTextElement: {
        /**
         * 显示缩放控制柄，默认 1，八个角控制柄
         * @type {Number}
         */
        resize: 1,

        /**
         * 3D旋转
         * @type {Array}
         */
        rotate3d: [0.4400000000000002, -0.5800000000000001, 0],

        /**
         * 字体名称
         * @type {String}
         */
        fontFamily: 'Reeji - CloudYuanCu - GB - Regular',

        /**
         * 材质数据
         * @type {Array}
         */
        layers: [
            {
                /**
                 * 正面材质
                 * @type {Object}
                 */
                frontMaterials: {
                    metalRoughness: '#00ffff',
                    normal: '#807fff',
                    albedo: {
                        type: 1,
                        image: 'https://st0.dancf.com/csc/147/material-three-textures/0/20190606-150053-46e8.jpg',
                        color: '#ace030ff',
                        gradient: {
                            angle: 0,
                            stops: [
                                {
                                    color: '#ffffffff',
                                    offset: 0,
                                },
                                {
                                    color: '#000000ff',
                                    offset: 1,
                                },
                            ],
                            direction: [1, 0, 0],
                            type: 0,
                            face: 0,
                        },
                        texRotateAngle: 0,
                        texTranslate: [0, 0],
                    },
                    metalStrength: 0.4252873563218391,
                    roughnessStrength: 0.25287356321839083,
                    albedoStrength: 1,
                    normalStrength: 0,
                    normalDisable: false,
                    scale: 1,
                },
                /**
                 * 侧面材质
                 * @type {Object}
                 */
                sideMaterials: {
                    enable: false,
                    metalRoughness: '#00ffff',
                    normal: '#807fff',
                    albedo: {
                        type: 0,
                        image: '',
                        color: '#0008ffff',
                        gradient: {
                            angle: 0,
                            stops: [
                                {
                                    color: '#ffffffff',
                                    offset: 0,
                                },
                                {
                                    color: '#000000ff',
                                    offset: 1,
                                },
                            ],
                            direction: [1, 0, 0],
                            type: 0,
                            face: 0,
                        },
                        texRotateAngle: 0,
                        texTranslate: [0, 0],
                    },
                    metalStrength: 1,
                    roughnessStrength: 1,
                    albedoStrength: 1,
                    normalStrength: 0,
                    normalDisable: false,
                    scale: 1,
                },
                /**
                 * 倒角材质
                 * @type {Object}
                 */
                bevelMaterials: {
                    enable: false,
                    metalRoughness: '#00ffff',
                    normal: '#807fff',
                    albedo: {
                        type: 0,
                        image: '',
                        color: '#ff00ffff',
                        gradient: {
                            angle: 0,
                            stops: [
                                {
                                    color: '#ffffffff',
                                    offset: 0,
                                },
                                {
                                    color: '#000000ff',
                                    offset: 1,
                                },
                            ],
                            direction: [1, 0, 0],
                            type: 0,
                            face: 0,
                        },
                        texRotateAngle: 0,
                        texTranslate: [0, 0],
                    },
                    metalStrength: 1,
                    roughnessStrength: 0,
                    albedoStrength: 1,
                    normalStrength: 2,
                    normalDisable: false,
                    scale: 1,
                },
                /**
                 * 倒角大小
                 * @type {Number}}
                 */
                bevelSize: 80,
                /**
                 * 倒角厚度
                 * @type {Number}
                 */
                bevelThickness: 10,
                /**
                 * 倒角取样数
                 * @type {Number}}
                 */
                bevelSegments: 4,
                /**
                 * 倒角类型
                 * @type {Number}}
                 */
                bevelType: 'quadEllipse',
                /**
                 * 倒角取样数
                 * @type {Number}}
                 */
                curveSegments: 1,
                /**
                 * 挤出厚度
                 * @type {Number}}
                 */
                extrudeDepth: 40,
                /**
                 * 挤出X偏移
                 * @type {Number}}
                 */
                extrudeOffsetX: 0,
                /**
                 * 挤出Y偏移
                 * @type {Number}}
                 */
                extrudeOffsetY: 0,
                /**
                 * 挤出X缩放
                 * @type {Number}}
                 */
                extrudeScaleX: 0,
                /**
                 * 挤出Y缩放
                 * @type {Number}}
                 */
                extrudeScaleY: 0,
            },
        ],
        /**
         * 点光源控制数据
         * @type {Array}
         */
        pointLights: [],

        /**
         * 透视角度
         * @type {Number}
         */
        viewAngle: 30,

        /**
         * 环境光控制数据
         * @type {Object}
         */
        environment: {
            enable: true,
            maps: ['https://st-gdx.dancf.com/gaodingx/17/design/three/20190530-210836-623d.jpg'],
            strength: 1.031914893617021,
            rotate3d: [0, 0, 0],
        },

        fontSize: 200,
        content: 'a',
        /**
         * 富文本序列化内容, 旧版为content
         * @type {Array}
         * @example [{ fontSize: 12, fontFamily: '黑体', fontWeight: 700, fontStyle: 'nomarl', textDecoration: 'none', content: '123' }]
         */
        contents: [],

        /**
         * 行高
         * @type {Number}
         */
        lineHeight: 1,

        /**
         * 字间距
         * @type {Number}
         */
        letterSpacing: 0,
        /**
         * 水平对齐 left、right、center、justify
         * @type {String}
         */
        textAlign: 'center',

        /**
         * 文字书写方向：横、竖
         * @type {String}
         */
        writingMode: 'horizontal-tb',

        /**
         * 是否开启正交投影
         * @type {Boolean}}
         */
        isOrtho: false,

        /**
         * 3D文字阴影控制数据
         * @type {Object}}
         */
        shadow: {
            enable: false,
            type: 'projection-2d', // 2d 普通投影
            blur: 10,
            color: '#000000ff',
            offset: 0,
            opacity: 1, // 暂时没用
            angle: 0,
            isBindRotate: false,
            offsetRatio: 1,
        },

        /**
         * ffd 变形控制数据
         * @type {Object}}
         */
        deformation: {
            type: 'none',
            intensity: 0,
            intensity1: 0,
            extrudeScaleX: 0, // 挤出面 x 方向缩放
            extrudeScaleY: 0, // 挤出面 y 方向缩放
        },

        /**
         * 逐字偏移控制数据
         * @type {Object}}
         */
        warpByWord: {
            enable: false,
            intensity: 0,
            intensity1: 0,
            randNum: 1000,
            pattern: '1',
            offsetX: 0,
        },

        /**
         * bbox 数据，用来描述3D文字在 canvas 的位置
         * @type {Array}}
         */
        modelCube: [
            -0.7524567801774561, 0.7734723016721756, -0.9387875937860526, 0.7611583178067339,
        ],

        /**
         * 中心水平方向偏移比
         * @type {Number}}
         */
        centerRatioX: -0.5,

        /**
         * 中心垂直方向偏移比
         * @type {Number}}
         */

        centerRatioY: -0.5,
        /**
         * 加过图片特效后的地址
         * @type {String}
         */
        imageUrl: '',

        /**
         * 是否为网格模式
         * @type {Boolean}
         */

        isMesh: false,
        /**
         * 半球光
         * @type {Object}
         */
        hemiLight: {
            enable: false,
            color: '#ffffff',
            dir: [0, 0, 1],
            strength: 1,
        },

        /**
         * 灯光总开关
         * @type {Boolean}
         */
        isFloodLightOff: false,
    },

    /**
     * flex 布局元素属性
     * @memberof module:editorDefaults
     * @enum
     */
    flexElement: {
        /**
         * flex 元素内的元素{@link module:editorDefaults.element|element}数组
         * @type {Array<element>}
         */
        elements: [],

        /**
         * 宽、高是否自增
         * 0b00不自增、0b01高度自增、0b10宽度自增、0b11宽高同时自增
         * @type {Number}
         * disc
         */
        autoAdaptive: 0,

        /**
         * flex 是否对用户可拆分
         * @type {Boolean}
         */
        splitenable: true,

        /**
         * 显示缩放控制柄，默认 7，八个角控制柄
         * @type {Number}
         */
        resize: 7,

        /**
         * 子元素布局方向
         * @type { String } row, column, row-reverse, column-reverse
         */
        flexDirection: 'row',

        /**
         * 子元素在主轴线上的对齐方式
         * @type { String } flex-start, flex-end, center, space-between, space-around, space-eventy
         */
        justifyContent: 'flex-start',

        /**
         * 子元素在横轴上的对齐方式
         * @type { String } flex-start, flex-end, center, stretch, baseline
         */
        alignItems: 'flex-start',

        /**
         * 设置子元素组在横轴上的分布方式
         * @type { String } flex-start, flex-end, center, space-between, space-around, space-eventy
         */
        alignContent: 'flex-start',

        /**
         * 设置子元素在 flex 中的换行方式
         * @type { String } nowrap, wrap, wrap-reverse
         */
        flexWrap: 'nowrap',
    },
};

const changeColor = (obj) => {
    if (!isObject(obj) && !isArray(obj)) return;
    forIn(obj, (value, key) => {
        if (key === 'aggregatedColors') {
            obj[key] = obj[key].map((color) => tinycolor(color).toString('rgb'));
        } else if (key === 'color' || key === 'backgroundColor') {
            obj[key] = value ? tinycolor(value).toString('rgb') : value;
        } else {
            changeColor(value);
        }
    });
};
changeColor(editorDefaults);

export default editorDefaults;
