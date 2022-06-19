import { IFillingImageContent } from './filling-image-content';
import { IGradient } from './gradient';

export type IEffectFillingType = 'color' | 'image' | 'gradient' | 0 | 1 | 2;

/**
 * 填充特效
 */
export interface IEffectFilling {
    /**
     * 是否开启填充特效
     */
    enable: boolean;

    /**
     * 填充方式
     * 在文字元素中，type 可能为 number，需要进行兼容
     * * color: 颜色填充
     * * image: 图片填充
     * * gradient: 渐变填充
     * * 0: 颜色填充
     * * 1: 图片填充
     * * 2: 渐变填充
     */
    type: IEffectFillingType;

    /**
     * 纯色填充时的填充颜色, 8 位 hex 格式, 含义为 'RRGGBBAA'
     */
    color?: string;

    /**
     * 填充图案
     */
    imageContent?: IFillingImageContent;

    /**
     * 渐变填充
     */
    gradient?: IGradient;
}
