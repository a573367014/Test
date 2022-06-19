import ColorSelector from './editor-color-selector';

const colorSelectorHandler = {
    colorSelector: null,
    mode: '',
    getSelector: function (editor, options) {
        if (!this.colorSelector || editor.mode !== this.mode) {
            this.mode = editor.mode;
            this.colorSelector = new ColorSelector(
                editor,
                Object.assign(
                    {
                        container: document.querySelector('.design-editor-page'),
                        editArea: document.querySelector('.design-editor'),
                    },
                    options,
                ),
            );
        }
        return this.colorSelector;
    },
};

export default {
    inject: {
        euiConfig: {
            default: () => ({}),
        },
    },
    watch: {
        strawActivated(v) {
            this.$emit('strawActivatedChange', v);
        },
    },
    data() {
        return {
            strawActivated: false,
        };
    },
    created() {
        this.initColorSelector();
        this.editor.$on('templetLoaded', this.onTempletLoaded);
    },
    methods: {
        onTempletLoaded() {
            this.initColorSelector();
        },
        clickStraw(colorPicker) {
            this.strawActivated = !this.strawActivated;

            if (this.strawActivated) {
                this.colorSelector.options.callback = (opt) => {
                    const { status, color } = opt;
                    if (status === 'getColor') return;
                    if (status === 'end') {
                        this.strawActivated = false;
                        // 直接调用组件内部的方法
                        colorPicker.selectColor({
                            hex: '#' + color,
                            source: 'hex',
                        });
                        this.colorSelector.end();
                    }
                    if (status === 'cancel') {
                        this.strawActivated = false;
                        this.colorSelector.end();
                        colorPicker.selectColor();
                    }
                };
                this.colorSelector.start();
            } else {
                this.colorSelector.end();
            }
        },
        initColorSelector() {
            this.colorSelector = colorSelectorHandler.getSelector(
                this.editor,
                this.euiConfig.colorSelectorOptions,
            );
            this.colorSelector.setPickEndEvent(() => {
                this.strawActivated = false;
            });
        },
    },
    beforeDestroy() {
        this.editor.$off('templetLoaded', this.onTempletLoaded);
    },
};
