/**
 * @fileoverview video 元素数据模型
 * https://doc.huanleguang.com/pages/viewpage.action?pageId=67394327
 */

import { IMediaElement } from './media';

/**
 * 字幕信息
 */
export interface ISpeechInfo {
    /**
     * 开始时间
     */
    startTime: number;

    /**
     * 结束时间
     */
    endTime: number;

    /**
     * 字幕内容
     */
    content: string;

    /**
     * 分词数据
     */
    wordsList?: {
        startTime: number;
        endTime: number;
        content: string;
    }[];
}

/**
 * 视频元素
 */
export interface IVideoElement extends IMediaElement {
    type: 'video';

    /**
     * 视频是否被替换过，当前用于自动字幕识别
     */
    $videoReplaced: boolean;

    /**
     * 从视频中提取的音频，用来进行语音识别
     */
    $audioExtractorUrl: string;

    /**
     * 语音识别的结果
     */
    $recognitionResult: ISpeechInfo[];

    /**
     * 视频文件地址
     */
    url: string;

    /**
     * 遮罩地址
     */
    mask?: string;

    /**
     * 用于时间轴取桢低画质流畅的videoUrl
     */
    ldUrl?: string;

    /**
     * 预览图地址
     */
    previewImageUrl: string;

    // /**
    //  * 预览图地址兜底
    //  */
    // preview: {
    //     url: string;
    //     video: string;
    //     hex: string;
    //     partial_video: string;
    //     height: number;
    //     width: number;
    // };

    /**
     * 帧率
     */
    fps: number;

    /**
     * 音量
     */
    volume: number;

    /**
     * 是否静音
     */
    muted: boolean;

    /**
     * 图片遮罩
     */
    maskImageUrl: string;

    /**
     * 视频遮罩
     */
    maskVideoUrl: string;

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
     * 是否是倒放
     */
    invertPlay: boolean;

    /**
     * 当前停留帧
     */
    currentFrame: number;

    /**
     * 当前停留时间点
     */
    currentTime: number;

    /**
     * 是否循环播放
     */
    loop: number;

    /**
     * 原始视频的宽度
     */
    naturalWidth: number;

    /**
     * 原始视频的高度
     */
    naturalHeight: number;

    /**
     * 声音特效
     */
    voxType: number | string;
}
