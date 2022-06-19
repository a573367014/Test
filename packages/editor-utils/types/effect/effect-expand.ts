/**
 * 阔边特效
 */
export interface IEffectExpand {
    /**
     * 特效开关
     */
    enable: boolean;

    /**
     * 偏移
     */
    offset: {
        /**
         */
        left: number;
        /**
         */
        top: number;
        /**
         */
        right: number;
        /**
         */
        bottom: number;
    };

    /**
     * 用于调节大小
     */
    scale: number;
}
