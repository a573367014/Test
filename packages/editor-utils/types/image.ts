import { IImageEffect } from './effect';
import { IElement } from './element';
import { IAggregatedColors } from './general';
import { IShadow } from './shadow';

/**
 * 图片元素
 */
export interface IImageElement extends IElement {
    type: 'image' | 'mask';

    /**
     * 图片地址信息
     */
    url: string;

    /**
     * 相对原图，计算clip裁剪后的图片宽度
     */
    originWidth: number;

    /**
     * 相对原图，计算clip裁剪后的图片高度
     */
    originHeight: number;

    /**
     * 存特效结果图的地址
     */
    effectedImage: string;

    /**
     * 加过图片特效后的宽度
     */
    effectedImageWidth: number;

    /**
     * 加过图片特效后的高度
     */
    effectedImageHeight: number;

    /**
     * 加过图片特效后的元素相对于layout的x偏移，存在描边阴影等行为时需要计算
     */
    effectedImageOffsetLeft: number;

    /**
     * 加过图片特效后的元素相对于layout的y偏移，存在描边阴影等行为时需要计算
     */
    effectedImageOffsetTop: number;

    /**
     * 图片特效属性
     */
    imageEffects: IImageEffect[];

    /**
     * 投影属性
     */
    shadows: IShadow[];

    /**
     * 图片变换
     */
    imageTransform: {
        a: number;
        b: number;
        c: number;
        d: number;
        tx: number;
        ty: number;
    };

    /**
     * 废弃: 图像宽度 目前根据 imageTransform.scale 与 naturalWidth 计算得出
     */
    // imageWidth: number;

    /**
     * 废弃: 图像高度 目前根据 imageTransform.scale 与 naturalWidth 计算得出
     */
    // imageHeight: number;

    /**
     * 图片原始宽度
     */
    naturalWidth: number;

    /**
     * 图片原始高度
     */
    naturalHeight: number;

    /**
     * 废弃: 裁切属性 目前使用 imageTransform 控制显示
     */
    // clip: {
    //     bottom: number;
    //     right: number;
    //     left: number;
    //     top: number;
    // };

    /**
     * 新版滤镜
     */
    filterInfo: {
        /**
         * 资源 id， -1 为无效状态
         */
        id: number;
        /**
         * 滤镜 2.0 zip 包地址
         */
        url: string;
        /**
         * 滤镜强度
         * @deprecated
         */
        strong: number;

        /**
         * 滤镜强度
         */
        intensity: number;
    };

    /**
     * 动画循环次数
     * 循环次数 0、1、2、3......
     * 0-无限循环 1-无循环 其他-循环次数
     */
    loop: number;

    /**
     * 截取开始时间(单位:ms) - gif 元素上会用到
     */
    startTime?: number;

    /**
     * 截取开始时间(单位:ms) - gif 元素上会用到
     */
    endTime?: number;

    // unknown
    aggregatedColors: IAggregatedColors;
    originUrl: string;
    format: string;
    orientation: string;
    $insideDropArea: boolean;
    /**
     * 是否需要渲染帧画面
     */
    $needRenderFrame: boolean;
    /**
     * ImageRenderer 开关 控制特效、滤镜的渲染流程
     */
    $enableImageRenderer: boolean;
}
