import { IAdvancedShadow } from './advanced-shadow';

/**
 * 基础投影
 */
export interface IBaseShadow extends IAdvancedShadow {
    /**
     * 特效开关
     */
    enable: boolean;

    /**
     * 阴影类型
     * - `'base'` - 基础阴影
     * - `'shadow'` - 阴影（已废弃）
     * - `'glow'` - 外发光（已废弃）
     *
     */
    type: 'base' | 'shadow' | 'glow';

    /**
     * 投影颜色，8 位 hex 格式, 例如 '#000000ff'
     */
    color: string;

    /**
     * 阴影横向偏移，当偏移量为（0，0）时，则显示出来的就是外发光的效果
     * @default 0
     */
    offsetX: number;

    /**
     * 阴影纵向偏移，当偏移量为（0，0）时，则显示出来的就是外发光的效果
     * @default 0
     */
    offsetY: number;

    /**
     * 不透明度
     */
    opacity: number;

    /**
     * 模糊半径（>=0）
     */
    blur: number;

    /**
     * 是否启用内阴影
     * @deprecated 内外阴影字段已分离，不需要这个字段了
     */
    inset?: boolean;
}
