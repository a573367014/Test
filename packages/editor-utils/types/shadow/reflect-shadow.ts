import { IAdvancedShadow } from './advanced-shadow';

/**
 * 倒影
 */
export interface IReflectShadow extends IAdvancedShadow {
    type: 'reflect';

    /**
     * 倒影方向
     * - `'auto'` - 自动（智能）倒影
     * - `'left'` - 左侧对称倒影（关于物体左垂直线镜像对称）
     * - `'right'` - 右侧对称倒影（关于物体右垂直线镜像对称）
     * - `'bottom'` - 底部对称倒影（关于物体下水平线镜像对称）
     * @default 'auto'
     */
    direction: 'auto' | 'left' | 'right' | 'bottom';
}
