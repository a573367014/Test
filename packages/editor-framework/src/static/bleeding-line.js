import template from './bleeding-line.html';
import { absoluteLengthToPixel } from '@gaoding/editor-utils/pixel-helper';

export default {
    template: template,
    props: ['layout', 'global', 'options'],
    name: 'bleeding-line',
    data() {
        return {
            guiderSize: 15,
            unit: 'mm',
        };
    },
    computed: {
        editor() {
            return this.$parent;
        },
        dpi() {
            return this.global.dpi || 72;
        },
        bleedingWidth() {
            const width = this.options.bleedingLine ? this.options.bleedingLine.width || 3 : 3;
            return [].concat(width);
        },
        borderWidth() {
            const { bleedingWidth, unit, dpi, editor } = this;
            const { zoom } = editor;

            return bleedingWidth.map((item) => absoluteLengthToPixel(item, dpi, unit) * zoom);
        },
        panelStyle() {
            const { borderWidth } = this;
            const widthCss = borderWidth
                .map((item) => {
                    return item + 'px';
                })
                .join(' ');

            return {
                borderWidth: widthCss,
            };
        },
    },
    methods: {
        guiderStyle(dir, borderDir) {
            const { borderWidth, guiderSize } = this;
            const width = {
                top: borderWidth[0],
                right: borderWidth[1] || borderWidth[0],
                bottom: borderWidth[2] || borderWidth[0],
                left: borderWidth[3] || borderWidth[0],
            };

            const margin = -(width[dir] + 3 + guiderSize);

            return {
                [dir]: `${margin}px`,
                [borderDir]: 0,
            };
        },
    },
};
