import { compatibleEvent } from '../../utils/dom-event';
import mixin from './toolbar-mixin';
import template from './toolbar-watermark.html';
import throttle from 'lodash/throttle';
import { i18n } from '../../i18n';

export default {
    name: 'toolbar-watermark',
    props: ['$events'],
    mixins: [mixin],
    template,
    data() {
        return {
            canReset: false,
            maxScale: 3,
            minScale: 0.2,
            barWidth: 150,
            upperBound: 3,
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

            const baseNum = this.minScale;
            return Math.max(
                0,
                ((this.scale - baseNum) / (this.upperBound - baseNum)) * this.barWidth,
            );
        },
        scalePercentage() {
            if (!this.scale) {
                return 0;
            }

            if (this.scale >= this.maxScale) {
                return i18n.$tsl('已达最大值');
            }

            if (this.scale <= this.minScale) {
                return i18n.$tsl('已达最小值');
            }

            return (this.scale * 100).toFixed(0) + '%';
        },
        cursorStyle() {
            return !this.canReset ? 'notAllowed' : 'pointer';
        },
    },
    watch: {
        'model.scale': {
            handler() {
                this.checkCanReset(this.model);
            },
        },
    },
    created() {
        this.onElementLoaded();
        this.checkCanReset = throttle((model) => {
            if (model && model.$canReset) {
                this.canReset = model.$canReset();
                this.onElementLoaded();
            }
        }, 100);
    },
    mounted() {
        this.barWidth = this.$refs.bar.offsetWidth;

        setTimeout(() => {
            this.updateLineOffset();
        }, 100);
    },
    methods: {
        $tsl: i18n.$tsl,
        beginScale(e) {
            const baseX = compatibleEvent(e).pageX;
            const baseWidth = this.scaleOffset;
            this.isDragging = true;

            const { currentElement } = this.editor;
            const { x, y } = currentElement.template.transform.scale;

            const moveHandler = (e) => {
                if (!x || !y) {
                    return;
                }
                const { pageX } = compatibleEvent(e);
                const offset = Math.min(Math.max(0, pageX - baseX + baseWidth), this.barWidth);

                this.scale = Math.max(this.minScale, this.getScaleByOffsetX(offset));
                this.$events.$emit('watermarkEditor.scale', this.scale);
            };

            const upHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.isDragging = false;
                setTimeout(() => {
                    this.$events.$emit('watermarkEditor.scaleEnd', this.scale);
                });
                window.removeEventListener('mousemove', moveHandler);
                window.removeEventListener('touchmove', moveHandler);
                window.removeEventListener('mouseup', upHandler);
                window.removeEventListener('touchend', upHandler);
            };

            window.addEventListener('mousemove', moveHandler);
            window.addEventListener('touchmove', moveHandler);
            window.addEventListener('mouseup', upHandler);
            window.addEventListener('touchend', upHandler);
        },
        seek(e) {
            this.scale = this.getScaleByOffsetX(e.offsetX);
            this.$events.$emit('watermarkEditor.scale', this.scale);
        },
        getScaleByOffsetX(offsetX) {
            const baseNum = this.minScale;
            return (offsetX / this.barWidth) * (this.upperBound - baseNum) + baseNum;
        },
        updateLineOffset() {
            const baseNum = 1;
            this.initialScaleOffset = ((1 - baseNum) / (this.upperBound - baseNum)) * this.barWidth;
        },
        onElementLoaded() {
            const { currentElement } = this.editor;
            const { scale } = currentElement.template.transform;

            const newScale = Math.min(scale.x, scale.y);
            this.upperBound = Math.max(newScale, this.maxScale);
            this.scale = newScale;
            this.elementLoaded = true;
        },
        editApply() {
            this.$events.$emit('element.editApply', this.model);
        },
        editCancel() {
            this.$events.$emit('element.editCancel', this.model);
        },
        editReset() {
            this.$events.$emit('element.editReset', this.model);
        },
    },
};
