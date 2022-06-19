<style lang="less">
    .eui-v2-popup-base {
        position: fixed;
        z-index: 11;
    }
</style>

<script>
export default {
    props: {
        options: {
            type: Object,
            required: true
        },
    },
    data() {
        return {
            elWidth: 0,
            elHeight: 0
        };
    },
    computed: {
        innerClass() {
            let { classes } = this.options;
            if(!Array.isArray(classes)) {
                classes = [classes];
            }
            return ['eui-v2-popup-base', ...(classes || [])];
        },
        style() {
            const { left, top, right, bottom, forceWidth, content, height, width, disabled } = this.options;
            return {
                left: typeof left === 'number' ? `${left}px` : '',
                top: typeof top === 'number' ? `${top}px` : '',
                right: typeof right === 'number' ? `${right}px` : '',
                bottom: typeof bottom === 'number' ? `${bottom}px` : '',
                width: typeof forceWidth === 'number' ? `${forceWidth}px` : width > 0 ? `${width}px` : '',
                display: !disabled && content && content.length > 0 ? 'block' : 'none',
                height: height > 0 ? `${height}px` : ''
            };
        },
        popupId() {
            return this.options.id;
        }
    },
    methods: {
        onUpdate() {
            this.$nextTick(() => {
                this.$nextTick(() => {
                    const el = this.$el;
                    if(el && el.getBoundingClientRect) {
                        const { width, height } = el.getBoundingClientRect();
                        if(this.elWidth !== width || this.elHeight !== height) {
                            this.elWidth = width;
                            this.elHeight = height;
                            this.options.updateFunc();
                        }
                    }
                });
            });
        }
    },
    render(h) {
        const { style, innerClass } = this;
        const { content, tag } = this.options;
        return h(tag || 'div', {
            class: innerClass,
            style: style,
        }, content);
    }
};
</script>
