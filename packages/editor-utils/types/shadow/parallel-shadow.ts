import { IAdvancedShadow } from './advanced-shadow';

/**
 * 平行投影
 */
export interface IParallelShadow extends IAdvancedShadow {
    type: 'parallel';

    /**
     * 投影颜色，8 位 hex 格式, 例如 '#000000ff'
     */
    color: string;

    /**
     * 投影 x 轴缩放
     */
    scaleX: number;

    /**
     * 投影 y 轴缩放
     */
    scaleY: number;
}
