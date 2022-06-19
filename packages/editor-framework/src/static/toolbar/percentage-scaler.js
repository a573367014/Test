import { compatibleEvent } from '../../utils/dom-event';
import template from './percentage-scaler.html';
import $ from '@gaoding/editor-utils/zepto';
import { i18n } from '../../i18n';

function onElementLoaded(element) {
    const { type } = element;
    const { editor, isBackgroundActive } = this;
    const { currentElement } = editor;

    const excludeTypes = ['image', 'video', 'mask'];
    if (!excludeTypes.includes(type) && !isBackgroundActive) {
        return;
    }

    if (element.naturalWidth || element.naturalHeight) {
        this.elementLoaded = true;
    }

    let currentWidth, baseWidth, baseHeight, currentHeight;

    if (isBackgroundActive) {
        baseWidth = element.width;
        baseHeight = element.height;
        currentWidth = element.$naturalImageWidth;
        currentHeight = element.$naturalImageHeight;
    } else if (currentElement && currentElement.type === '$croper') {
        baseWidth = editor.currentCropElement.width;
        baseHeight = editor.currentCropElement.height;
        currentWidth = editor.currentCropElement.$imageWidth;
        currentHeight = editor.currentCropElement.$imageHeight;
    } else {
        baseWidth = editor.currentEditMask.width;
        baseHeight = editor.currentEditMask.height;
        currentWidth = editor.currentEditMask.$imageWidth;
        currentHeight = editor.currentEditMask.$imageHeight;
    }

    const newScale = Math.min(currentWidth / baseWidth, currentHeight / baseHeight);
    this.upperBound = Math.max(newScale, this.maxScale);
    this.scale = newScale;
}

function onResizeEnd({ width, height }, { width: boxWidth, height: boxHeight }) {
    const newScale = Math.min(width / boxWidth, height / boxHeight);
    this.upperBound = Math.max(newScale, this.maxScale);
    this.scale = newScale;

    this.updateLineOffset();
}

export default {
    template,
    props: {
        $events: {
            type: Object,
            required: true,
        },
        maxScale: {
            type: Number,
            default: 3,
        },
        minScale: {
            type: Number,
            default: 0.5,
        },
        minImageSize: Number,
        // 只能放大不能缩小
        fromZero: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            barWidth: 150,
            upperBound: this.maxScale,
            isDragging: false,
            elementLoaded: false,
            initialScaleOffset: 0,
            scale: null,
        };
    },

    computed: {
        scaleOffset() {
            if (!this.scale) {
                return 0;
            }

            const baseNum = this.fromZero ? this.minScale : 0;
            return Math.max(
                0,
                ((this.scale - baseNum) / (this.upperBound - baseNum)) * this.barWidth,
            );
        },
        scalePercentage() {
            if (!this.scale) {
                return 0;
            }

            if (this.scale < 1) {
                return i18n.$tsl('小于图框');
            }

            if (this.scale >= this.maxScale) {
                return i18n.$tsl('已达最大值');
            }

            return (this.scale * 100).toFixed(0) + '%';
        },
        editor() {
            return this.$parent.editor;
        },
        hasCropButton() {
            return this.editor.options.cropperOptions.switchable;
        },
        isInnerActive() {
            if (!this.editor.currentElement) {
                return false;
            }
            return this.editor.currentElement.resize === 0b111;
        },
        isBackgroundActive() {
            return (
                this.editor.currentElement &&
                this.editor.currentElement.type === '$background-croper'
            );
        },
    },

    methods: {
        $tsl: i18n.$tsl,
        beginScale(e) {
            e.stopPropagation();

            const $win = $(document.documentElement);
            const baseX = compatibleEvent(e).pageX;
            const baseWidth = this.scaleOffset;
            this.isDragging = true;

            const { currentElement } = this.editor;
            const naturalWidth = currentElement.width;
            const naturalHeight = currentElement.height;

            const moveHandler = (e) => {
                e.stopPropagation();

                if (!naturalHeight || !naturalWidth) {
                    return;
                }

                const { pageX } = compatibleEvent(e);
                const offset = Math.min(Math.max(0, pageX - baseX + baseWidth), this.barWidth);

                this.scale = Math.max(this.minScale, this.getScaleByOffsetX(offset));
                this.$events.$emit('imageCroper.scale', this.scale);
            };

            const cancel = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.isDragging = false;
                setTimeout(() => {
                    this.$events.$emit('imageCroper.scaleEnd', this.scale);
                }, 0);
                $win.off('mousemove', moveHandler);
                $win[0].removeEventListener('touchmove', moveHandler, {
                    passive: false,
                    capture: true,
                });
                $win.off('touchend', cancel);
            };

            $win.on('mousemove', moveHandler);
            $win[0].addEventListener('touchmove', moveHandler, {
                passive: false,
                capture: true,
            });

            $win.one('mouseup', cancel);
            $win.one('touchend', cancel);
        },
        seek(e) {
            this.scale = this.getScaleByOffsetX(e.offsetX);
            this.$events.$emit('imageCroper.scale', this.scale, 'click');
        },
        scaleImage() {
            this.$events.$emit('imageCroper.scale', this.scale);
        },
        switchCropper(e) {
            e.preventDefault();
            e.stopPropagation();
            const name = this.isInnerActive ? 'imageCroper.activeOuter' : 'imageCroper.activeInner';
            this.$events.$emit(name);
        },
        getScaleByOffsetX(offsetX) {
            const baseNum = this.fromZero ? this.minScale : 0;
            return (offsetX / this.barWidth) * (this.upperBound - baseNum) + baseNum;
        },
        updateLineOffset() {
            const baseNum = this.fromZero ? 1 : 0;
            this.initialScaleOffset = ((1 - baseNum) / (this.upperBound - baseNum)) * this.barWidth;
        },
    },

    created() {
        this.onElementLoaded = onElementLoaded.bind(this);
        this.onResizeEnd = onResizeEnd.bind(this);

        if (!this.isBackgroundActive) {
            this.$events.$on('element.loaded', this.onElementLoaded);
        } else {
            this.onElementLoaded(this.editor.currentElement);
        }

        this.$events.$on('imageCroper.resizeEnd', this.onResizeEnd);
    },

    beforeDestroy() {
        this.$events.$off('element.loaded', this.onElementLoaded);
        this.$events.$off('imageCroper.resizeEnd', this.onResizeEnd);
    },

    mounted() {
        this.barWidth = this.$refs.bar.offsetWidth;

        setTimeout(() => {
            this.updateLineOffset();
        }, 100);
    },
};
