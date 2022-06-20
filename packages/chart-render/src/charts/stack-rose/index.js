import Rose from '../rose/index';
/**
 * 堆叠玫瑰图
 * @class StackRose
 */
export default class StackRose extends Rose {
    getDefaultModel() {
        return {
            settings: {
                coordInnerRadius: 0,
            },
        };
    }

    /**
     * 调整stack
     * @override
     */
    _initGeom() {
        super._initGeom();
        this.geom.adjust({
            type: 'stack',
        });
    }
}
