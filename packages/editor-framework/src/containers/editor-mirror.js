/**
 * EditorMirror
 */

import EditorMirrorTpl from './editor-mirror.html';

export default {
    template: EditorMirrorTpl,
    props: ['options', 'global', 'layouts', 'currentLayout'],
    computed: {
        editor() {
            return this.$parent;
        },
        supportTypes() {
            return (this.editor && this.editor.supportTypes) || [];
        },
    },
    mounted() {
        // this.editor = this.$parent;
    },
    methods: {
        isGroup(element) {
            return this.editor.isGroup(element);
        },
    },
};
