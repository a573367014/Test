import { IImageElement } from './image';
import { ITextElement } from './text';
import { IVideoElement } from './video';
import { IGroupElement } from './group';
import { ITransition } from './transition';

export interface LayerAnimationsKeyframes {
    time: number;
    value: number[] | number;
    easing?: string;
}

export interface LayerAnimationsEffect {
    key: string;
    keyframes: LayerAnimationsKeyframes[];
}

export enum LayerAnimationStage {
    enter = 'enter',
    show = 'show',
    leave = 'leave',
    custom = 'custom',
}

export interface LayerAnimations {
    delay: number; // 延时播放
    duration: number; // 持续时长，暂时用不到
    repeatCount: number; // 重复次数
    unitDuration: number; // 单次动画时长
    stage: LayerAnimationStage; // 阶段，暂时用不到
    effects: LayerAnimationsEffect[];
}

/**
 * 动画的出入场展示类型
 */
export type AnimationMoveTypeStrings = 'enter' | 'show' | 'leave' | 'custom';

export interface materialAnimationInfo {
    name: String;
    id: Number;
    preview: String;
    type: String;
    stage: AnimationMoveTypeStrings;
    animations: LayerAnimations[];
}

/**
 * 模板大小单位
 */
export type ITemplateUnit = 'px' | 'in' | 'cm' | 'mm';

export interface IFont {
    name: string;
    family: string;
}

/**
 * 渐变背景
 */
export interface IGradient {
    type: string;
    stops: { color: string; offset: number }[];
    angle: number;
}

/**
 * 点9图背景
 */
export interface INinePatch {
    url: string;
    imageSlice: {
        left: number;
        right: number;
        top: number;
        bottom: number;
    };
    originWidth: number;
    originHeight: number;
    effectScale: number;
}

/**
 * 滤镜背景
 */
export interface IFilter {
    linkIds: string[];
}

/**
 * 背景特效
 */
export interface IBackgroundEffect {
    type: 'image' | 'gradient' | 'ninePatch' | 'filter';
    enable: boolean;
    opacity: number;
    image?: {
        url: string;
        resourceType: string;
        naturalWidth: number;
        naturalHeight: number;
        repeat: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y';
        naturalDuration: number;
        transform: {
            a: number;
            b: number;
            c: number;
            d: number;
            tx: number;
            ty: number;
        };
    } | null;
    gradient?: IGradient | null;
    ninePatch?: INinePatch | null;
    filter?: IFilter | null;
}

export interface IBackground {
    watermarkEnable: boolean;
    color: string | null;
    image: {
        url: string;
        left: number;
        top: number;
        width: number;
        height: number;
        opacity: number;
        resourceType: string;
        naturalWidth: number;
        naturalHeight: number;
        repeat: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y';
        naturalDuration: number;
        transform: {
            a: number;
            b: number;
            c: number;
            d: number;
            tx: number;
            ty: number;
        };
        imageTransform: {
            a: number;
            b: number;
            c: number;
            d: number;
            tx: number;
            ty: number;
        };
        filterInfo?: { intensity: number };
        elementRefIds?: string[];
    } | null;

    gradient: IGradient | null;

    ninePatch: INinePatch | null;
}

export interface ILayout {
    /**
     * 编辑器是否已加载完成该模板
     * VPE 内使用，不会保存到模板数据中
     */
    $loaded?: boolean;

    $id: string;
    uuid: string;

    /**
     * 标题
     */
    title: string;

    /**
     * 模板高度
     */
    height: number;

    /**
     * 模板宽度
     */
    width: number;

    /**
     * 模板背景图
     * @deprecated
     */
    backgroundImage: null | string;

    /**
     * 背景面板选中背景色Id
     */
    backgroundId?: number;

    /**
     * 背景图片拉伸后的宽高
     */
    backgroundSize: null | [number, number];

    /**
     * 背景是否有水印
     * @deprecated
     */
    backgroundWatermarkEnable: boolean;

    /**
     * 模板背景色
     * @deprecated
     */
    backgroundColor: string;

    /**
     * 背景图片位置
     * 关键词 left, top, right, bottom, center
     * @example
     * backgroundPosition: 'left'   // 等同于 'left center'
     * backgroundPosition: 'center' // 等同于 'center center'
     * backgroundPosition: 'left top'
     */
    backgroundPosition?: string;

    /**
     * 背景图片信息
     * @deprecated
     */
    backgroundImageInfo: {
        /**
         * 背景图片宽度
         */
        width: number;

        /**
         * 背景图片高度
         */
        height: number;

        /**
         * 背景图片透明度
         * 取值 0 - 1
         */
        opacity: number;

        /**
         * 裁切
         */
        clip?: {
            left: number;
            top: number;
            bottom: number;
            right: number;
        };

        /**
         * 变换矩阵
         */
        transform: {
            a: number;
            b: number;
            c: number;
            d: number;
            tx: number;
            ty: number;
            scale?: {
                x: number;
                y: number;
            };
        };

        resourceType: string;
        naturalDuration: number;
    } | null;

    /**
     * 新背景特效
     * @deprecated
     */
    backgroundEffect?: IBackgroundEffect;

    /**
     * 背景渐变
     * @deprecated
     */
    backgroundGradient?: IGradient;

    /**
     * 背景
     */
    background: IBackground;

    /**
     * 背景遮罩
     */
    backgroundMask: {
        /**
         * 背景遮罩颜色
         */
        color: string;

        /**
         * 背景遮罩透明度
         * 取值 0 - 1
         */
        opacity: number;
    } | null;

    /**
     * 背景是否重复
     */
    backgroundRepeat: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y';

    /**
     * 画布内的元素
     */
    elements: LayoutElements;

    /**
     * 视频/图片元素之间的过渡效果
     * @deprecated
     */
    // transition: {
    //     [id: string]: ITransition;
    // };

    /**
     * 轨道顺序, 改为 tracks 字段
     * @deprecated
     */
    trackerOrder: string[];

    /**
     * 轨道顺序
     */
    tracks: string[];

    // unknown
    className: null;
    repeatId: null | string;
    repeatGroup: null | string;
    metaInfo: null;
    watermarkEnable: boolean;
}

export type LayoutElements = (
    | IElement
    | ITextElement
    | IImageElement
    | IVideoElement
    | IGroupElement
)[];

/**
 * 元素类型
 */
export type ElementType =
    | 'video'
    | 'image'
    | 'text'
    | 'group'
    | 'audio'
    | 'mask'
    | 'svg'
    | 'arrow'
    | '$croper'
    | '$masker'
    | 'ninePatch'
    | 'placeholder'
    | 'watermark'
    | 'effectText'
    | 'flex';

export type ITransitionType = 'turn-black';

// export interface ITransition {
//     /**
//      * 转场名称
//      */
//     name: ITransitionType;

//     /**
//      * 持续时间
//      */
//     duration: number;

//     /**
//      * 叠加时间
//      */
//     overlayDuration: number;
// }

/**
 * 模板数据
 */
export interface ITemplate {
    /**
     * 版本号
     */
    version: string;

    /**
     * 模板类别
     */
    type: string;

    global: {
        /**
         * 投稿来源
         */
        source?: string;

        /**
         * 枚举值 px, in, cm, mm
         */
        unit: ITemplateUnit;

        /**
         * 用于换算模板实际尺寸的 DPI 参考值
         */
        dpi: number;

        /**
         * 缩放比例，仅保留最后一次渲染数据，对数据本身无影响
         */
        zoom: number;

        /**
         * 模板水印是否显示
         */
        showWatermark: boolean;
    };

    layouts: ILayout[];
}

/**
 * 元素通用字段
 */
export interface IElement {
    /**
     * 模板加载后用于标识该元素的唯一 id
     * 不会保存到模板数据中
     */
    $id?: string;

    /**
     * 元素唯一标识(新增)
     */
    uuid: string;

    /**
     * 编辑器是否已加载完成该模板
     * VPE 内使用，不会保存到模板数据中
     */
    $loaded?: boolean;

    /**
     * 元素是否拖拽中
     */
    $draging: boolean;

    /**
     * 资源类型
     */
    resourceType?: string;

    /**
     * 轨道区预览图的偏移
     */
    $previewOffset?: number;

    /**
     * 元素编辑状态
     */
    $editing: boolean;

    /**
     * 是否是录音的临时元素
     */
    $recording?: boolean;

    $currentElement?: null | IElement;

    /**
     * 时间轴的元素拖拽时遇到到达了限制点
     */
    $meetLimited?: 'left' | 'right' | '';
    /**
     * 旋转角度
     */
    rotate: number;
    /**
     * 元素版本
     */
    version: string;

    /**
     * 元素类型
     */
    type: ElementType;

    /**
     * 存放元数据
     * 可用于备注、埋点、付费素材信息储存
     */
    metaInfo: null | any;

    /**
     * 链接ID，关联两个元素的操作，比如 画中画
     */
    linkId: number;

    /**
     * 阴影
     */
    boxShadow: null | {
        /**
         * 水平偏移
         */
        offsetX: number;

        /**
         * 垂直偏移
         */
        offsetY: number;

        /**
         * 模糊程度
         */
        blurRadius: number;

        /**
         * 扩展半径
         */
        spreadRadius: number;

        /**
         * 颜色
         */
        color: string;
    };

    /**
     * PPT 下的页面分类
     */
    category: string;

    /**
     * 内边距（分别对应上右下左）
     */
    padding: [number, number, number, number];

    /**
     * 是否启用水印
     */
    watermarkEnable: boolean;

    /**
     * 特效相对初始值的缩放比例
     */
    effectScale: number;

    /**
     * 轨道 ID
     * @deprecated
     */
    trackerId: string;

    /**
     * 轨道 ID
     */
    trackId: string;

    /**
     * 离画布上边缘距离
     */
    top: number;

    /**
     * 离画布左边缘距离
     */
    left: number;

    /**
     * 元素高度
     */
    height: number;

    /**
     * 元素宽度
     */
    width: number;

    /**
     * 元素透明度
     */
    opacity: number;

    /**
     * 是否禁用（不可编辑，不可拖动）
     */
    frozen: boolean;

    /**
     * 是否固定位置（可编辑，不可拖动）
     */
    lock: boolean;

    /**
     * 是否可编辑
     */
    editable: boolean;

    /**
     * 元素的 border radius
     * @deprecated 使用 mask 代替
     */
    borderRadius: number;

    /**
     * 是否隐藏
     */
    hidden: boolean;

    /**
     * 操作点取值区间: [0, 7] 0: 无控制点, 1: 0b001 对角线方向, 2: 0b010 垂直方向, 4: 0b100 水平方向, 其他为组合值）
     */
    resize: number;

    /**
     * 是否可拖动
     */
    dragable: boolean;

    /**
     * 是否可旋转
     */
    rotatable: boolean;

    /**
     * 变形（矩阵）
     */
    transform: {
        a: number;
        b: number;
        c: number;
        d: number;
        tx: number;
        ty: number;
    };

    animations: LayerAnimations[];

    /**
     * 元素的动画, 迁移到 timeRange 字段
     * @deprecated
     */
    animation: {
        /**
         * 动画特效数组
         */
        animationEffects: IAnimationEffect[];

        /**
         * 进入元素时的特效
         * @deprecated
         */
        enterTransition?: string;

        /**
         * 离开元素时的特效
         * @deprecated
         */
        leaveTransition?: string;
    };

    /**
     * 图层动画信息
     * @deprecated
     */
    layerAnimations: ILayerAnimation[];

    /**
     * 元素时间信息
     */
    timeRange: {
        delay: number;
        duration: number;
    };

    transitionIn?: ITransition;
    transitionOut?: ITransition;

    /**
     * 描边下载地址
     */
    contour: string;

    /**
     * 滤镜
     */
    filter?: {
        contrast: number;
        sharpness: number;
        hueRotate: number;
        saturate: number;
        brightness: number;
        gaussianBlur: number;
    };
    /**
     * 裁剪(已废弃)
     */
    clip?: {
        left: number;
        top: number;
        right: number;
        bottom: number;
    };

    $parentId?: string;

    hasEffects: boolean;

    /**
     * 存放 element 提供给 player 的出图结果
     */
    $playerCanvas: HTMLCanvasElement | null;

    /**
     * 存在 element 在 player 中的 zOrder
     */
    $zOrder: number;
    /**
     * 记录元素开始时间与结束时间的偏移量，用于修正特效带来的时间偏移
     */
    $delayOffset?: number;
    $durationOffset?: number;

    duration?: number;
    naturalWidth?: number;
    naturalHeight?: number;
    naturalDuration?: number;
    volume?: number;
    muted?: boolean;
    clone(): IElement;

    elements?: IElement[];

    imageUrl?: string;

    relationalInfo?: IRelationalInfo | null;

    /**
     * 元素选然后 imageUrl 的相关信息
     */
    effectedResult: {
        /**
         * 添加特效后的实际画布宽度
         * @description [[float]]
         **/
        width: number;

        /**
         * 添加特效后的实际画布的高度
         * @description [[float]]
         **/
        height: number;

        /**
         * 添加特效后的实际画布相对于 layout 的 x 偏移，存在描边阴影等行为时需要计算
         * @description [[float]]
         **/
        left: number;

        /**
         * 添加特效后的实际画布相对于 layout 的 y 偏移，存在描边阴影等行为时需要计算
         * @description [[float]]
         **/
        top: number;
    };

    /**
     * 参与聚合调节的特效颜色组
     */
    aggregatedColors: string[];
}

export interface IRelationalInfo {
    /**
     * 关联对象id，用于自动字幕时为视频id
     */
    relationId: string;
    /**
     * 相对于主轴元素时间线开始时间的偏移 ms
     */
    timeOffset: number;
    /**
     * 截取开始时间(单位:毫秒）
     */
    startTime: number;
    /**
     * 截取结束时间(单位:毫秒）
     */
    endTime: number;
    /**
     * 文件时长（单位:毫秒）
     */
    naturalDuration: number;
}

/**
 * 图层动画信息
 */
export interface ILayerAnimation {
    /**
     * 动画类型, 目前仅为 'layerAnimation'
     */
    type: string;
    /**
     * 动画zip下载路径
     */
    url: string;
    /**
     * 图层动画类型
     */
    option: string;
    /**
     * 动画的开始时间，单位为毫秒
     */
    delay: number;
    /**
     * 动画时长，单位为毫秒
     */
    duration: number;
    /**
     * 循环次数 0、1、2、3等，0-无限循环 1-无循环 其他-循环次数
     */
    animationRepeat: number;
    /**
     * 单次动画时长, 单位为毫秒
     */
    animationDuration: number;
    /**
     * 动画连续播放停顿间隔时间, 单位为毫秒
     */
    animationInterval: number;
}

/**
 * 可以使用动画变换的属性
 */
export type AnimatableProperty = 'left' | 'top' | 'transform' | 'opacity' | 'width' | 'height';

/**
 * 动画的缓动函数
 */
export type AnimationTimingFunction = 'Linear';

export type EasingType = 'Linear';

/**
 * 动画特效参数
 * @deprecated
 */
export interface IAnimationEffect {
    options: {
        /**
         * 动画开始播放的延迟时间
         */
        delay: number;

        /**
         * 动画持续时间
         */
        duration: number;

        /**
         * 动画播放的缓动函数
         */
        easing: EasingType;

        /**
         * 动画循环次数
         * 循环次数 0、1、2、3......
         * 0-无限循环 1-无循环 其他-循环次数
         */
        loop: number;

        /**
         * 动画正放还是倒放
         */
        direction: 'forward' | 'backward';
    };

    /**
     * 属性的动画配置
     */
    timeline: {
        [key in AnimatableProperty]?: {
            /**
             * 该属性动画的开始时间，取值为 0 - 1
             * start * options.duration
             */
            start: number;

            /**
             * 动画停止时的最终值
             */
            value: number;

            /**
             * 缓动函数
             */
            easing: AnimationTimingFunction;
        };
    };
}
