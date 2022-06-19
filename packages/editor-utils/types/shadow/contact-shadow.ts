import { IAdvancedShadow } from './advanced-shadow';

/**
 * 接触阴影
 */
export interface IContactShadow extends IAdvancedShadow {
    type: 'contact';

    /**
     * 投影颜色，8 位 hex 格式, 例如 '#000000ff'
     */
    color: string;

    /**
     * 扇形模糊的主方向，默认朝下，也就是 90 度
     * @default 90
     */
    angle: number;

    /**
     * 扇形模糊的张角（圆心角）
     */
    fieldAngle: number;
}
