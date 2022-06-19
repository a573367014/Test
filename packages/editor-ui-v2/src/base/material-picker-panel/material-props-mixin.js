export const materialPropsMixin = {
    props: {
        presets: {
            type: Array,
            default: () => [],
        },
        material: {
            type: Object,
            default: () => ({})
        },
        ossResizeUrl: {
            type: Boolean,
            default: false
        }
    }
};
