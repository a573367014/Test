import $ from '@gaoding/editor-utils/zepto';
import template from './template.html';
import { pixelToAbsoluteLength } from '@gaoding/editor-utils/pixel-helper';
import { i18n } from '../../i18n';

export default {
    props: ['currentElement', 'layout', 'global', 'options'],
    name: 'tips',
    template,
    data() {
        return {
            text: '',
        };
    },
    watch: {
        currentElement(v) {
            if (!v) {
                this.text = '';
            }
        },
    },
    computed: {
        editor() {
            return this.$parent;
        },
        dpi() {
            return this.global.dpi;
        },
        unit() {
            return this.global.unit === 'px' ? '' : this.global.unit;
        },
    },
    methods: {
        setPosition(e, _left, _top) {
            const editor = this.editor;
            const point = editor.pointFromEvent(e);

            const editorShellRect = editor.shellRect;
            const editorContainerRect = editor.containerRect;

            const maxLeft = editorContainerRect.width - editorShellRect.left - this.$el.offsetWidth;
            const maxTop = editorContainerRect.height - editorShellRect.top - this.$el.offsetHeight;
            const minLeft = -editorShellRect.left;
            const minTop = -editorShellRect.top;

            let left = _left !== undefined ? _left : point.x * this.global.zoom + 30;
            left = Math.max(minLeft, Math.min(left, maxLeft));

            let top = _top !== undefined ? _top : point.y * this.global.zoom;
            top = Math.max(minTop, Math.min(top, maxTop));

            $(this.$el).css({
                left: left + 1 + 'px',
                top: top + 'px',
            });
        },
    },
    events: {
        'element.transformResize'(drag, element, e) {
            if (this._lock || !this.options.tipsOptions.resizeable) {
                this.text = '';
                return;
            }
            let width = Math.round(element.width);
            let height = Math.round(element.height);

            width = this.unit ? pixelToAbsoluteLength(element.width, this.dpi, this.unit) : width;
            height = this.unit
                ? pixelToAbsoluteLength(element.height, this.dpi, this.unit)
                : height;

            const editor = this.editor;
            const maxWidth = editor.options.elementMaxWidth || editor.currentLayout.width * 2;
            const maxHeight = editor.options.elementMaxHeight || editor.currentLayout.height * 2;

            if (
                Math.round(editor.currentElement.width) >= Math.round(maxWidth) ||
                Math.round(editor.currentElement.height) >= Math.round(maxHeight)
            ) {
                this.text = i18n.$tsl('已达最大值');
            } else {
                this.text = `${width}${this.unit} x ${height}${this.unit}`;
            }
            this.setPosition(e);
        },

        'element.transformEnd'() {
            this.text = '';
        },

        'element.dragMove'(drag, element, e) {
            if (
                this._lock ||
                !this.options.tipsOptions.dragable ||
                element === this.editor.currentSubElement ||
                element.$customDragMove
            ) {
                this.text = '';
                return;
            }
            if (element && (element.type === '$selector' || element.type.indexOf('$') === -1)) {
                let left = Math.round(element.left);
                let top = Math.round(element.top);

                left = this.unit ? pixelToAbsoluteLength(element.left, this.dpi, this.unit) : left;
                top = this.unit ? pixelToAbsoluteLength(element.top, this.dpi, this.unit) : top;

                // 会遮挡等边距参考线
                const isMarginGuiderActive = element.$guider && element.$guider.marginActive;
                this.text = isMarginGuiderActive
                    ? ''
                    : `x:${Math.round(left)}${this.unit} y:${Math.round(top)}${this.unit}`;

                const offsetTop = (this.$el.offsetHeight || 28) + 9;
                const scaleLeft = element.left * this.global.zoom;
                const scaleTop = element.top * this.global.zoom - offsetTop;
                const layoutTop = (this.editor.currentLayout.top || 0) * this.global.zoom;
                const layoutLeft = (this.editor.currentLayout.left || 0) * this.global.zoom;

                this.setPosition(e, scaleLeft + layoutLeft, scaleTop + layoutTop);
            }
        },

        'element.dragEnd'() {
            this.text = '';
        },

        // 被图框吸附后隐藏
        'element.imageInsideDropArea'() {
            this._lock = true;
            this.text = '';
        },
        'element.imageOutsideDropArea'() {
            this._lock = false;
        },
        'path.dragMove'(e) {
            const { start, x, y } = e;
            const width = Math.floor(Math.abs(x - start.x) / this.editor.zoom);
            const height = Math.floor(Math.abs(y - start.y) / this.editor.zoom);
            this.text = `${width} x ${height}`;
            const top = (this.editor.currentLayout?.top || 0) * this.editor.zoom;
            this.setPosition(e, x + 10, y + top);
        },
        'path.dragEnd'() {
            this.text = '';
        },
    },
};
