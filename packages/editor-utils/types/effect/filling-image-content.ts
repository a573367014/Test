/**
 * 图案填充方式
 * - fill 充满图框
 * - fit 适应图框
 * - crop 贴合图框
 * - tiled 平铺图案
 */
export type IFillingImageContentType = 'fill' | 'fit' | 'crop' | 'tiled';

/**
 * 图片填充效果
 */
export interface IFillingImageContent {
    /**
     * 填充图案平铺方式，文字特效中的 repeat 是数值类型
     * 后续迁移迁移到 [[IEffectFillingImageContent.tileMode]]
     */
    repeat: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y';

    /**
     * 图案填充方式
     */
    type: IFillingImageContentType;

    /**
     * x 轴缩放比例, [0,1] 对应 0%~100% 范围
     */
    scaleX: number;

    /**
     * y 轴缩放比例, [0,1]  对应 0%~100% 范围
     */
    scaleY: number;

    /**
     *  图片尺寸，单位像素
     */
    width: number;

    /**
     * 图片尺寸，单位像素
     */
    height: number;

    /**
     * 填充图案地址或者画布
     */
    image: string | HTMLCanvasElement;
}
