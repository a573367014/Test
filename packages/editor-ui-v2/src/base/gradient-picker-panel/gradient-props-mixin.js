import presets from './presets.js';
import { i18n } from '../../i18n';

export const gradientPropsMixin = {
    props: {
        gradient: {
            type: Object,
            default: () => ({
                angle: 90,
                stops: [
                    { color: '#fff', offset: 0 },
                    { color: '#000', offset: 1 },
                ],
            }),
        },
        gradientPresets: {
            type: Array,
            default: () => presets,
        },
        gradientMaxStop: {
            type: Number,
            default: Infinity,
        },
        gradientStopDraggable: {
            type: Boolean,
            default: true,
        },
        formatAngle: {
            type: Function,
            default: Math.round,
        },
        gradientTypes: {
            type: Array,
            default: () => [
                { name: i18n.$tsl('正面渐变'), value: 0 },
                { name: i18n.$tsl('侧面渐变'), value: 1 },
            ],
        },
        threeMode: {
            type: Boolean,
            default: false,
        },
        enableAlpha: {
            type: Boolean,
            default: false,
        },
        format: {
            type: String,
            default: 'hex',
        },
        cmykMode: {
            type: Boolean,
            default: false,
        },
        showStraw: {
            type: Boolean,
            default: false,
        },
        strawActivated: {
            type: Boolean,
            default: false,
        },
    },
};
