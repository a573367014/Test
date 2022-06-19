<template>
    <div class="eui-v2-bleeding-line" :style="planeStyle" v-show="canShow">
        <div class="eui-v2-bleeding-line__guider eui-v2-bleeding-line__guider--horizontal" :style="guiderStyle('left', 'top')"/>
        <div class="eui-v2-bleeding-line__guider eui-v2-bleeding-line__guider--horizontal" :style="guiderStyle('left', 'bottom')"/>
        <div class="eui-v2-bleeding-line__guider eui-v2-bleeding-line__guider--vertical" :style="guiderStyle('top', 'left')"/>
        <div class="eui-v2-bleeding-line__guider eui-v2-bleeding-line__guider--vertical" :style="guiderStyle('top', 'right')"/>
        <div class="eui-v2-bleeding-line__guider eui-v2-bleeding-line__guider--horizontal" :style="guiderStyle('right', 'top')"/>
        <div class="eui-v2-bleeding-line__guider eui-v2-bleeding-line__guider--horizontal" :style="guiderStyle('right', 'bottom')"/>
        <div class="eui-v2-bleeding-line__guider eui-v2-bleeding-line__guider--vertical" :style="guiderStyle('bottom', 'left')"/>
        <div class="eui-v2-bleeding-line__guider eui-v2-bleeding-line__guider--vertical" :style="guiderStyle('bottom', 'right')"/>
    </div>
</template>

<script>
import { absoluteLengthToPixel } from '@gaoding/editor-utils/pixel-helper';

export default {
    props: {
        editor: {
            type: Object,
            required: true,
        },
        bleedingWidth: {
            type: Number,
            default: 2,
        }
    },

    data() {
        return {
            canShow: false,
            bleedingUnit: 'mm',
            left: 0,
            top: 0,
            dx: 0,
            dy: 0
        };
    },
    computed: {
        dpi() {
            return this.editor.global.dpi || 72;
        },
        unit() {
            return this.editor.global.unit || 'mm';
        },
        borderWidth() {
            const { bleedingWidth, bleedingUnit, dpi } = this;
            const { zoom } = this.editor;
            return absoluteLengthToPixel(bleedingWidth, dpi, bleedingUnit) * zoom;
        },

        planeStyle() {
            const { editor, borderWidth } = this;

            const { width, height } = editor.shellRect;
            const { left, top, dx, dy } = this;

            return {
                borderWidth: `${borderWidth}px`,
                left: `${left - dx}px`,
                top: `${top - dy}px`,
                width: `${Math.max(width - 2 * borderWidth, 0)}px`,
                height: `${Math.max(height - 2 * borderWidth, 0)}px`
            };
        },

        guiderStyle() {
            const guiderSize = 15;
            const { borderWidth } = this;
            return (dir, borderDir) => {
                const margin = -(borderWidth + 3 + guiderSize);
                return {
                    [dir]: `${margin}px`,
                    [borderDir]: 0
                };
            };
        }
    },
    watch: {
        'editor'(newValue, oldValue) {
            if(oldValue) {
                oldValue.$el.removeEventListener('scoll', this.onEditorScroll, false);
            }
            if(newValue) {
                newValue.$el.addEventListener('scroll', this.onEditorScroll, false);
            }
        },
        'editor.shellRect.left': {
            immediate: true,
            handler(left) {
                this.left = left;
                this.dx = 0;
                this.scrollLeft = this.editor.$el.scrollLeft;
            }
        },
        'editor.shellRect.top': {
            immediate: true,
            handler(top) {
                this.top = top;
                this.dy = 0;
                this.scrollTop = this.editor.$el.scrollTop;
            }
        },
        'editor.shellRect.width': {
            immediate: true,
            handler(v) {
                clearTimeout(this._canShowTimer);
                if(!this.canShow && v !== 0) {
                    this._canShowTimer = setTimeout(() => {
                        this.canShow = true;
                    }, 100);
                }
            }
        }
    },
    created() {
        const { editor } = this;
        editor.$el.addEventListener('scroll', this.onEditorScroll, false);
    },
    beforeDestroy() {
        const { editor } = this;
        editor.$el.removeEventListener('scoll', this.onEditorScroll, false);
    },
    methods: {
        onEditorScroll() {
            const { scrollLeft, scrollTop } = this.editor.$el;
            this.dx = scrollLeft - this.scrollLeft;
            this.dy = scrollTop - this.scrollTop;
        }
    }
};
</script>

<style lang="less">


    @guider-border: 1px solid @normal-color;
    @guider-size: 15px;
    @guider-margin: -3px;
    @guider-padding: 5px;

    .eui-v2-bleeding-line {
        will-change: left, top;
        position: absolute;
        border-color: rgba(255, 255, 255, 0.5);
        border-style: solid;
        pointer-events: none;
        background: none;
        z-index: 1;
        box-sizing: content-box;
        &::before {
            position: absolute;
            content: '';
            left: 0;
            top: 0;
            border: 1px dashed @border-color;
            width: 100%;
            height: 100%;
            box-sizing: border-box;
        }

        &__guider {
            position: absolute;

            &--horizontal {
                width: @guider-size;
                height: 0;
                border-top: @guider-border;
            }

            &--vertical {
                height: @guider-size;
                width: 0;
                border-left: @guider-border;
            }
        }
    }
</style>
