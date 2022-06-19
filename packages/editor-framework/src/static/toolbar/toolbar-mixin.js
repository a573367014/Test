export default {
    props: ['options', 'global', 'model', 'subModel', 'disableLayerEdit', 'template', 'config'],

    computed: {
        editor() {
            return this.$parent.editor;
        },
    },
    methods: {
        set(name, val, element) {
            let props = {};

            if (typeof name === 'object') {
                props = name;
                element = val;
            } else {
                props = { [name]: val };
            }

            element = element || this.model;

            for (const k in props) {
                if (element[k] === props[k]) {
                    delete props[k];
                }
            }

            Object.keys(props).length && this.editor.changeElement(props, element);
        },
        remove() {
            this.editor.removeElement(null, null, true);
        },
        clone() {
            this.editor.cloneElement();
        },
        lock() {
            this.editor.lockElement();
        },
        unlock() {
            this.editor.unlockElement();
        },
        setToTop() {
            this.editor.setElementToTop();
        },
        setToBottom() {
            this.editor.setElementToBottom();
        },
        flip(dir) {
            this.editor.flipElement(dir, this.model);
        },
        setOpacity(opacity) {
            this.set('opacity', opacity);
        },

        // image & mask
        replaceImage(url, width, height) {
            this.editor.replaceImage(
                url,
                {
                    width: width,
                    height: height,
                },
                this.model,
            );
        },

        showLoadingTip() {
            this.model.$loaded = false;
        },

        // edit
        showEditor() {
            const model = this.model;
            this.editor.showElementEditor(model);
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
