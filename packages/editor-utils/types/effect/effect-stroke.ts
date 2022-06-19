/**
 * 描边特效
 * @category Demo
 */
export interface IEffectStroke {
    /**
     * 特效开关
     */
    enable: boolean;

    /**
     * 描边类型, 图片暂时只支持外描边
     * * inner: 内描边
     * * center: 居中描边
     * * outer: 外描边
     */
    type: 'inner' | 'center' | 'outer';

    /**
     * 描边颜色, 8 位 hex 格式, 含义为 'RRGGBBAA'
     */
    color: string;

    /**
     * 描边宽度
     */
    width: number;

    /**
     * 描边连接处样式
     */
    join: 'miter' | 'round' | 'bevel';
}
