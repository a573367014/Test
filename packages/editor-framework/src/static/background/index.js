import get from 'lodash/get';
import template from './index.html';
import tinycolor from 'tinycolor2';
import BackgroundImage from './image';

function getBackgroundGradientStyle(gradient) {
    const style = {};
    const result = [];

    // Gradient is not performance same as PS.
    result.push(90 - gradient.angle + 'deg');

    gradient.stops.forEach((item) => {
        result.push(`${item.color} ${item.offset * 100}%`);
    });

    const gradientString = result.join(',');

    style.backgroundImage = `linear-gradient(${gradientString})`;
    return style;
}

export default {
    props: ['layout', 'element', 'global', 'options', 'selected', 'mode'],
    name: 'background',
    template,
    components: {
        BackgroundImage,
    },

    data() {
        return {
            clickCount: 0,
        };
    },

    computed: {
        editor() {
            return this.$parent.editor || this.$parent.$parent;
        },

        isDesignMode() {
            return this.options.mode === 'design' || this.options.mode === 'flow';
        },

        model() {
            return this.layout;
        },

        background() {
            return this.model.background;
        },

        effectImage() {
            const image = get(this.background, 'image');
            if (!image || image.resourceType === 'mp4') return null;
            return { ...image, url: this.layout.backgroundEffectImage || image.url };
        },

        effectGradient() {
            return get(this.background, 'gradient');
        },

        backgroundColor() {
            const color = get(this.background, 'color', '#00000000');
            return color ? tinycolor(color).toString('rgb') : '';
        },

        backgroundGradientStyle() {
            if (this.effectGradient) {
                return getBackgroundGradientStyle(this.effectGradient);
            }
        },
    },

    methods: {
        checkClickAdp() {
            const dblclickDelay = 256;
            this.clickCount = (this.clickCount || 0) + 1;

            clearTimeout(this.checkClickAdpTimer);
            this.checkClickAdpTimer = setTimeout(() => {
                const { clickCount } = this;

                if (clickCount >= 2) {
                    this.onDblClick();
                }

                // reset
                this.clickCount = 0;
            }, dblclickDelay);
        },
        onDblClick() {
            this.editor.showBackgrounCroper(this.layout);
            this.editor.$events.$emit('background.dblClick');
        },
        onClick(e) {
            const tempGroup = this.editor.$refs.tempGroup;
            const tempGroupValid = tempGroup && tempGroup.currentTempGroupId;

            if (
                this._selectorLocked ||
                !this.editor.editable ||
                this.options.mode === 'preview' ||
                this.layout.$backgroundEditing
            )
                return;

            const { layout, editor } = this;
            const point = editor.pointFromEvent(e);

            this.$nextTick(() => {
                // Fix layout offset
                point.x -= layout.left || 0;
                point.y -= layout.top || 0;

                // 不在在容器内
                if (
                    point.x < 0 ||
                    point.y < 0 ||
                    point.x > layout.width ||
                    point.y > layout.height
                ) {
                    return;
                }

                // 选中元素
                if (!this.editor.currentElement && !tempGroupValid) {
                    this.layout.$backgroundSelected = true;
                    this.editor.focusLayoutBackground(this.layout);
                    this.checkClickAdp();
                } else {
                    this.layout.$backgroundSelected = false;
                }
            });
        },

        onLoadedChange(v) {
            this.layout.$backgroundLoaded = v;
            this.editor.$events.$emit('background.loaded');
        },
    },

    events: {
        // 多选选区操作时禁止背景选中
        'selector.active'() {
            this._selectorLocked = true;
        },
        'selector.inactive'() {
            this.layout.$backgroundSelected = false;
            setTimeout(() => {
                this._selectorLocked = false;
            });
        },
        'base.mouseDown'(e) {
            if (!this.editor.editable || this.options.mode === 'preview') return;

            const { layout, editor } = this;
            const point = editor.pointFromEvent(e);

            // Fix layout offset
            point.x -= layout.left || 0;
            point.y -= layout.top || 0;

            // 不在在容器内
            if (
                (point.x < 0 || point.y < 0 || point.x > layout.width || point.y > layout.height) &&
                !layout.$backgroundEditing
            ) {
                layout.$backgroundSelected = false;
            }
        },
        'base.click'(e) {
            this.onClick(e);
        },
    },
};
