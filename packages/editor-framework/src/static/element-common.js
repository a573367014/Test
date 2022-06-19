import Vue from 'vue';
import createComponent from '../base/create-component';
import background from './background/element';
import watermark from './watermark';
import border from './border';
import tinycolor from 'tinycolor2';
import template from './element-common.html';

export default createComponent(Vue, {
    name: 'element-common',
    template,
    components: {
        background: createComponent(Vue, background),
        watermark: createComponent(Vue, watermark),
        border: createComponent(Vue, border),
    },
    props: {
        editor: {
            type: Object,
            required: true,
        },
        options: {
            type: Object,
            required: true,
        },
        element: {
            type: Object,
            required: true,
        },
        layout: {
            type: Object,
            required: false,
        },
        global: {
            type: Object,
            required: true,
        },
        hideBlink: {
            type: Function,
            default: () => {},
        },
        isShowBlink: {
            type: Boolean,
            default: false,
        },
        bgNinePatch: {
            type: Object,
            default: null,
        },
    },

    computed: {
        backgroundVisible() {
            const element = this.element;
            const color = element.backgroundColor && tinycolor(element.backgroundColor).getAlpha();
            return color || (element?.backgroundEffect?.enable && element?.backgroundEffect?.type);
        },
    },
});
