import { IElement } from './element';

export interface IMediaElement extends IElement {
    /**
     * 媒体资源地址
     */
    url: string;

    /**
     * 截取开始时间，毫秒单位
     */
    startTime: number;

    /**
     * 截取结束时间，毫秒单位
     */
    endTime: number;

    /**
     * 废弃: 用 naturalDuration 代替
     * 总时长，秒为单位
     */
    duration?: number;

    /**
     * 总时长, 单位(ms)
     */
    naturalDuration: number;
    /**
     * 资源播放速度
     */
    speed: number;

    /**
     * 是否倒放
     */
    invertPlay: boolean;

    /**
     * 播放次数
     * 0 - 无限循环
     * 1 - 播放一次
     * 2 - 循环两次
     * ...
     */
    loop: number;
}
