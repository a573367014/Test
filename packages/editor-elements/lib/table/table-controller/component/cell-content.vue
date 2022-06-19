<template>
    <div
        ref="cell"
        :contenteditable="!readonly"
        :col="col"
        :row="row"
        :readonly="readonly"
        :colspan="colspan"
        :rowspan="rowspan"
        :data-cursor="readonly ? '' : 'text'"
        @input="update"
        @blur="handleBlur"
        @focus="handleFocus"
        @keydown="handleKeyDown"
        @mousedown.stop="() => {}"
        @paste="handlePaste"
    />
</template>
<script>
import { getPasteText } from '@gaoding/editor-framework/src/utils/rich-text/utils/paste';

export default {
    name: 'table-cell-content',
    props: {
        value: {
            type: String,
            default: '',
        },
        row: {
            type: Number,
            default: 0,
        },
        col: {
            type: Number,
            default: 0,
        },
        colspan: {
            type: Number,
            default: 1,
        },
        rowspan: {
            type: Number,
            default: 1,
        },
        readonly: {
            type: Boolean,
            default: false,
        },
    },
    watch: {
        value(newval) {
            if (newval !== this.currentContent() || !newval) {
                this.updateContent(newval);
            }
        },
    },
    mounted() {
        this.updateContent(this.value);
    },
    methods: {
        updateContent(content) {
            if (this.$refs.cell) {
                this.$refs.cell.innerText = content || '';
            }
        },
        currentContent() {
            if (this.$refs.cell) {
                return this.$refs.cell.innerText;
            }
        },
        update() {
            const content = this.currentContent();
            if (content && this.value === content) return;
            this.$emit('update:value', content);
            this.$emit('change', content);
        },
        handleFocus(e) {
            if (this.readonly) return;
            this.$emit('focus', e);
        },
        handleBlur(e) {
            if (this.readonly) return;
            this.update();
            this.$emit('blur', e);
        },
        handleKeyDown(e) {
            if (this.readonly) return;
            if (e.key === 'Tab') {
                e.preventDefault();
            } else {
                e.stopPropagation();
            }
        },
        handlePaste(e) {
            if (this.readonly) return;
            e.preventDefault();
            const pasteText = getPasteText(e, (v) => v);
            if (pasteText) {
                e.target.innerText = pasteText;
            }
        },
    },
};
</script>
