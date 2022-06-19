import $ from '@gaoding/editor-utils/zepto';
import template from './template.html';
import utils from '../../utils/utils';

export default {
    props: ['currentElement', 'layout', 'global', 'options'],
    name: 'hover',
    template,
    data() {
        return {
            borderWidth: 1,
            layoutTop: 0,
            model: null,
        };
    },
    computed: {
        editor() {
            return this.$parent;
        },
        cssStyle() {
            const {
                model,
                borderWidth,
                layoutTop,
                global: { zoom },
            } = this;
            if (!model) return {};

            // 包围盒最小可视高度为6px
            let top = (model.top + layoutTop) * zoom - borderWidth;
            let height = model.height * zoom + borderWidth * 2;
            const minHeight = 6 + borderWidth * 2;
            if (height < minHeight) {
                top -= (minHeight - height) / 2;
                height = minHeight;
            }

            return {
                height: height + 'px',
                width: model.width * zoom + borderWidth * 2 + 'px',
                transform: model.transform.toString(),
                left: model.left * zoom - borderWidth + 'px',
                top: top + 'px',
            };
        },
    },
    watch: {
        model(value) {
            this.editor.currentHoverElement = value;
        },
    },
    events: {
        'base.mousemove'(e) {
            if (
                !this.options.showHover ||
                this._locked ||
                (this.editor.selector && this.editor.selector.maskActived) ||
                $.contains(this.$el, e.target)
            )
                return;

            const ignoreElements = [
                '.editor-mask-editor',
                '.editor-rotator-three',
                '.editor-transform-wrap',
                '.editor-toolbar-wrap',
                '.editor-background-editor',
                '.editor-image-croper',
                '.editor-contextmenu',
            ].join(',');

            const isValid = $(e.target).closest(ignoreElements).length > 0;

            // hover输入框清除选中态
            if (isValid || utils.isEditable(e.target)) {
                this.model = null;
                return;
            }

            const point = this.editor.pointFromEvent(e);
            // flow模式不允许穿透
            if (this.options.mode === 'flow') {
                const point = this.editor.pointFromEvent(e);
                const pointLayout = this.editor.getLayoutByPoint(point);
                const element = this.editor.getElementByPoint(point.x, point.y, pointLayout);

                this.layoutTop = pointLayout.top || 0;
                this.model = element && !element.$editing ? element : null;
            } else {
                const layer = this.editor.$picker.pick(point.x, point.y);

                this.layoutTop = 0;
                this.model =
                    layer && layer.$element && !layer.$element.$editing ? layer.$element : null;
            }
        },
        'base.mouseleave'() {
            clearTimeout(this._leaveTimer);
            // 保证在 mousevoe 之后触发
            this._leaveTimer = setTimeout(() => {
                this.model = null;
            }, 101);
        },
        'base.dragStart'(model) {
            this._locked = true;

            if (model !== this.model) {
                this.model = null;
            }
        },
        'base.dragEnd'() {
            this._locked = false;
        },
        'element.transformStart'() {
            this._locked = true;
        },
        'element.transformEnd'() {
            this._locked = false;
        },
        'tempGroup.dragStart'() {
            this._locked = true;
        },
        'tempGroup.dragEnd'() {
            this._locked = false;
        },
    },
    mounted() {
        const $el = $(this.$el);
        this.borderWidth = Math.round(parseInt($el.css('border-width'))) || 1;

        // 避免currentElement被删后，hover任然显示
        this.$watch('currentElement', (a, b) => {
            if (
                a === null &&
                (b === this.model || (b.elements && b.elements.includes(this.model)))
            ) {
                this.model = null;
            }
        });
    },
};
