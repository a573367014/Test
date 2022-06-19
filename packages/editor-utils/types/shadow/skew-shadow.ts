import { IAdvancedShadow } from './advanced-shadow';

/**
 * 倾斜投影
 */
export interface ISkewShadow extends IAdvancedShadow {
    type: 'skew';

    /**
     * 投影颜色，8 位 hex 格式, 例如 '#000000ff'
     */
    color: string;

    /**
     * X轴缩放，用来调节阴影宽度，目前交互稿没有此参数
     */
    scaleX: number;

    /**
     * Y轴缩放，用来调节阴影长度，目前交互稿没有此参数
     */
    scaleY: number;

    /**
     * 斜影角度，用来模拟光从不同方向照射，默认数据为模拟光从左上方照射物体
     * @default -45
     */
    angle: number;

    /**
     * 底部重复程度
     * @default 0
     */
    overlap: number;
}
