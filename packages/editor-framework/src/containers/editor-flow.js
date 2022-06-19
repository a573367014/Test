import EditorFlowTpl from './editor-flow.html';

export default {
    template: EditorFlowTpl,
    props: ['options', 'global', 'layouts', 'currentLayout'],

    computed: {
        editor() {
            return this.$parent;
        },

        flowStyle() {
            if (!this.editor) return {};
            const { width, height } = this.editor;

            return {
                overflow: this.options.canvasOverflowHidden ? 'hidden' : 'visible',
                // backgroundColor: this.canvasBackgroundColor,
                width: width * this.global.zoom + 'px',
                height: height * this.global.zoom + 'px',
            };
        },
    },

    methods: {
        setLayoutTop() {
            // Calculate layout top.
            this.layouts.reduce((prev, next) => {
                next.top = prev;
                return prev + next.height;
            }, 0);
        },
    },

    watch: {
        'editor.height'() {
            this.setLayoutTop();
        },

        layouts() {
            this.setLayoutTop();
        },
    },

    created() {
        this.setLayoutTop();
    },

    beforeDestroy() {
        // Reset layouts top value to 0.
        this.layouts.forEach((layout) => {
            layout.top = 0;
        });
    },
};
