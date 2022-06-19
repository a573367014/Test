import Promise from 'bluebird';

import utils from '../../utils/utils';
import template from './border.html';

export default {
    props: ['layout', 'element', 'global', 'options', 'mode'],
    name: 'border',
    template,

    data() {
        return {
            borderCache: null,
        };
    },

    computed: {
        editor() {
            return this.$parent.editor || this.$parent.$parent;
        },
        border() {
            return this.model.border;
        },
        model() {
            return this.element || this.layout;
        },
        cssStyle() {
            const { model, global, border } = this;
            const { zoom } = global;

            return {
                width: model.width * zoom + 'px',
                height: model.height * zoom + 'px',
                left: 0,
                top: 0,
                opacity: border.opacity,
            };
        },
        borderStyle() {
            const type = this.border.type;
            switch (type) {
                case 'image':
                    return this.getImageBorderStyle();
                case 'color':
                    return this.getColorBorderStyle();
                case 'gradient':
                    // TODO: 实现渐变色边框
                    break;
                default:
                    break;
            }
        },
        borderImage() {
            return this.border.image;
        },
        borderSlice() {
            const { imageSlice } = this.border;
            return imageSlice;
        },
        maxSliceWidth() {
            const { left, top, right, bottom } = this.borderSlice;
            return Math.max.apply(this, [left, top, right, bottom]);
        },
    },
    created() {
        this.checkLoad();
    },

    watch: {
        border() {
            this.checkLoad();
        },
        borderImage() {
            this.checkLoad();
        },
    },

    methods: {
        checkLoad() {
            const { options, border, borderImage } = this;
            const fitCrossOrigin = options.fitCrossOrigin;

            this.$set(border, '$loaded', false);
            return Promise.try(() => {
                // 如果是图片边框需要检查图片是否加载完成
                if (border.type === 'image') {
                    return utils.loadImage(borderImage, fitCrossOrigin);
                }
            }).finally(() => {
                this.$set(border, '$loaded', true);
                this.editor.$events.$emit('border.loaded');
            });
        },
        getColorBorderStyle() {
            const widths = [];
            const border = this.border;
            const { zoom } = this.global;
            if (!border.direction) return;

            border.direction.forEach((val) => {
                widths.push(val ? border.width : 0);
            });

            const style = {
                borderWidth: widths.map((width) => `${width * zoom}px`).join(' '),
                borderColor: border.color,
                borderStyle: 'solid',
            };
            this.borderStyleCache = style;
            return style;
        },
        getImageBorderStyle() {
            const { model, borderImage, borderSlice, maxSliceWidth } = this;
            const border = model.border;
            const { width, imageRepeat } = border;
            const { zoom } = this.global;
            const ratio = width / maxSliceWidth;
            const slice = [
                borderSlice.top,
                borderSlice.right,
                borderSlice.bottom,
                borderSlice.left,
            ];
            const style = {
                borderImageSource: `url(${borderImage})`,
                borderImageSlice: slice.join(' ') + ' fill',
                borderImageRepeat: imageRepeat,
                borderImageWidth: `${slice.map((v) => v * ratio * zoom + 'px').join(' ')}`,
                borderStyle: 'solid',
            };
            this.borderStyleCache = style;
            return style;
        },
    },
};
