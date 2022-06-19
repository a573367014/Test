const defaultColors = ['#000000', '#FFFFFF', '#FF0000', '#FFDE00', '#105EF5'];

export const colorPropsMixin = {
    props: {
        format: {
            type: String,
            default: 'hex',
        },
        enableColor: {
            type: Boolean,
            default: true
        },
        enableAlpha: {
            type: Boolean,
            default: false
        },
        enableInput: {
            type: Boolean,
            default: true
        },
        enableSwatch: {
            type: Boolean,
            default: true
        },
        swatches: {
            type: Array,
            default() {
                return defaultColors;
            }
        },
        swatchesHistoryMax: {
            type: Number,
            default: 5
        },
        autoSwatchesHistory: {
            type: Boolean,
            default: true
        },
        cmykMode: {
            type: Boolean,
            default: false
        },
        showStraw: {
            type: Boolean,
            default: false
        },
        strawActivated: {
            type: Boolean,
            default: false
        }
    }
};
