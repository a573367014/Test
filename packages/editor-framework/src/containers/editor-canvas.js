import EditorCanvasTpl from './editor-canvas.html';

export default {
    template: EditorCanvasTpl,
    props: ['options', 'global', 'layouts', 'currentLayout'],

    computed: {
        editor() {
            return this.$parent;
        },
    },
};
