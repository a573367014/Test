/**
 * @module editorOptions
 * @description 参数配置
 */

export default {
    /**
     * 编辑模式（design=单画布编辑模式，mirror=截图镜像模式，preview=预览模式，flow=多画布依次排列）
     * @type {String}
     * @default design
     */
    mode: 'design',

    /**
     * 交互模式（mosaic=马赛克模式）
     * @type {?String}
     * @default null
     */
    operateMode: null,

    /**
     * 编辑器内边距
     * @type {Array<Number>}
     * @default [40, 40, 40, 40]
     */
    padding: [40, 40, 40, 40],

    /**
     * 元素溢出画布显示隐藏
     * @type {Boolean}
     * @default true
     */
    canvasOverflowHidden: true,

    /**
     * 根据屏幕自适应展示区域
     * @type {Boolean}
     * @default true
     */
    autoFitZoom: true,
    /**
     * 根据屏幕自适应展示的最大缩放值
     */
    autoFitMaxZoom: 1,
    mousewheelMinZoom: 0.15,
    mousewheelMaxZoom: 4,

    /**
     * hover 是否显示边框
     * @type {Boolean}
     * @default true
     */
    showHover: true,
    showToolbar: true, // 是否显示工具条
    showEditConfirmToolbar: true, // 是否显示 图片和蒙版裁剪状态的工具条

    /**
     * 移动参考线
     * @type {Boolean}
     * @default true
     */
    showGuider: true,
    /**
     * resize 参考线
     * @type {Boolean}
     * @default true
     */
    showResizeGuider: true,
    /**
     * 等边距参考线
     * @type {Object}
     * @prop {Boolean} enable - 是否启用，默认 true
     * @prop {Boolean} showValue - 像素值tips，默认 false
     */
    marginGuiderOptions: {
        enable: true,
        // 是否显示像素值提示
        showValue: false,
    },

    /**
     * 支持多选
     * @type {Boolean}
     * @default true
     */
    selector: true,

    /**
     * 剪贴板
     * @type {Object}
     * @prop {Function} get - 在 copyElement 时编辑器会尝试置入 clipboard.set 中获得的元素内容到内部剪贴板
     * @prop {Function} set - 在 pasteElement 时则对应尝试粘贴 clipboard.get 中返回的元素内容到模板中
     * @example { get: elements => { cache.set('elements', elements) }, set: elements => cache.get('elements') }
     */
    clipboard: {
        storageKey: 'template_clipboard',
        get() {},
        set() {},
    },

    /**
     * 文件拖拽操作回调
     * @func
     * @param {FileList} files FileList对象
     * @returns {FileList} FileList对象 (显式返回 false 时将阻止默认 drop 行为）
     */
    onDropFile(files) {
        return files;
    },
    /**
     * 系统粘贴操作回调
     * @func
     */
    onPasteFile() {},
    /**
     * 系统粘贴文本操作回调
     * @func
     */
    onPasteText() {},
    /**
     * 图片元素自定义双击事件
     */
    onDbClickImage: null,
    /**
     * 视频元素自定义双击事件
     */
    onDbClickVideo: null,
    // 资源相关
    resource: {
        // dataUrl / blobUrl
        blobUrlEnable: true,
        // 资源导出
        // (count, total, { layout, element, url, key } = {}) => {}
        uploadProgress: null,
        // (blob) => { return Promise.resolve('cdnUrl') }
        upload: null,
    },

    snapshotable: true,
    snapshotDisableSync: false,

    // image
    placeImage: 'https://st0.dancf.com/csc/213/configs/system/20201131-101949-cd09.png',

    /**
     * 调用图片选择器，是否拦截默认调用并发送 $emit('imagePicker.show') 事件
     * @type {Boolean}
     * @default false
     */
    hookImagePicker: false,

    watermarkImages: {
        enable: true,
        exportEnable: true,
        layoutRepeat:
            'https://st-gdx.dancf.com/gaodingx/213/configs/system/20200611-180327-3f35.svg',
        layoutNoRepeat:
            'https://st-gdx.dancf.com/gaodingx/213/configs/system/20200611-180327-3f35.svg',
        element: 'https://st-gdx.dancf.com/gaodingx/213/configs/system/20200611-180327-3f35.svg',
    },
    // 禁止从控制台删除水印
    watermarkSafeEnable: false,

    // 跨 layout 拖动元素，即元素从一个 layout 拖放到另一个 layout
    crossLayoutDrag: false,

    // 对图片等资源自适应跨域加载
    fitCrossOrigin: false,

    /**
     * 是否绑定快捷键，当为 true 或 false 时将覆盖默认的初始加载配置
     * @type {?Boolean}
     * @default null
     */
    bindHotkey: null,

    cropperOptions: {
        // 是否展示 Toolbar 裁剪按钮
        switchable: false,
        // 进入裁切状态时默认选中元素，可选 'inner' | 'outer'
        defaultTarget: 'inner',
        // 裁切背景图（外框）控制点
        outerResize: 0b000,
        imageTransformTypes: ['mask'],
    },

    tipsOptions: {
        // resize大小提示框显示
        resizeable: true,
        // 拖动元素位置提示框显示
        dragable: false,
        // 临时组常驻提示
        tempGroup: false,
    },

    /**
     * 是否支持前端导图
     * @type {Boolean}
     * @default true
     */
    exportable: true,

    /**
     * 加载字体子集
     * @type {Object}
     * @prop {?Function} getUrl 显式返回 promise 并且结果是字体子集的 url
     * @prop {Boolean} initialEnable 初始化模板时是否启用
     * @prop {Function} exportEnableCallback 前端导出时是否启用
     * @prop {Array<String>} supportTypes 支持的元素类型
     * @prop {defaultContent} exportEnableCallback 需默认加载的文本
     */
    fontSubset: {
        getUrl: null,
        exportEnableCallback: () => false,
        initialEnable: true,
        supportTypes: ['text', 'effectText', 'threeText'],
        defaultContent: '',
    },
    /**
     * 字体列表
     * @type {Array<Object>}
     * @default [
        { name: 'Microsoft Yahei', alias: '微软雅黑' },
        { name: 'Simsun', alias: '宋体' }
    ]
     */
    fontList: [
        { name: 'Microsoft Yahei', alias: '微软雅黑' },
        { name: 'Simsun', alias: '宋体' },
    ],
    fontSizeList: [6, 8, 9, 10, 11, 12, 14, 18, 24, 30, 36, 48, 60, 72, 84, 96, 108, 120],
    /**
     * 字体加载超时时长
     * @type {Number}
     * @default 10000
     */
    fontLoadTimeout: 10000,
    /**
     * 回退字体
     * @type {String}
     * @default SourceHanSansSC-Regular
     */
    defaultFont: 'SourceHanSansSC-Regular',
    minCellCount: 2, // 拼图最少格子数
    // 出血线
    bleedingLine: {
        show: false,
        width: [3, 3, 3, 3], // 出血线宽度，单位为 mm
    },
    // 支持链接的元素
    supportLinkElements: [
        { types: ['text', 'effectText', 'threeText'], propName: 'contents' },
        { types: ['image', 'mask'], propName: 'url' },
    ],
    // 点击穿透的画布大小，越小性能越好
    layerPickerDefaultSize: 1000,

    picaResizeEnable: false,
    picaResizeOptions: {
        alpha: true,
        timeout: 5000,
        scaleThreshold: 1,
    },

    // 拖拽外框，内部图片不变形 mask、image、video
    supportAdaptiveElements: ['video'],

    // 元素最大宽高为 0 默认为layout的宽高 * 2
    elementMaxWidth: 0,
    elementMaxHeight: 0,

    // 图片吸附至mask
    dragImageToMaskEnable: true,

    // 灰色区域是否响应事件,为false则灰色区域的pointerEvent为none
    scopePointerEventsEnable: true,

    // 右键菜单项
    contextmenu: true,

    // 属性修改后，修改对应 metaInfo 信息
    changeMetaInfoHook(options) {},

    // 协同编辑
    collabOptions: {
        enable: false,
        snapshotEnable: false,
        fontFallBackHook: null,
        async setTempletHook(templet) {
            return templet;
        },
    },
    // 移动端事件支持
    touchEnable: false,

    // 混合导出模式是否启用
    blendModeEnable: true,

    /**
     * 是否显示九宫格切线
     * @type {Boolean}
     * @default false
     */
    showCutGrid: false,

    // (error, msg) => {}
    captureErrorHook: () => {},
};
