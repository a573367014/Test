export const mapPropsMixin = {
    props: {
        mapPresets: {
            type: Array,
            default: () => []
        },
        map: {
            type: Object,
            default: () => ({})
        },
        rangeFormat: {
            type: Function,
            default: () => {}
        },
        ossResizeUrl: {
            type: Boolean,
            default: false
        },
        designMode: {
            type: Boolean,
            default: true
        },
        threeMode: {
            type: Boolean,
            default: false
        }
    }
};
