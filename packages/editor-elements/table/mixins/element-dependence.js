export default {
    computed: {
        element() {
            return {
                global: this.global,
                model: this.model,
                options: this.options,
                rect: this.rect,
            };
        },

        boxStyle() {
            const { rect } = this;
            const { padding } = rect;
            return {
                height: `${rect.height + padding[0] + padding[2]}px`,
                width: `${rect.width + padding[1] + padding[3]}px`,
                transform: this.transform.toString(),
                left: `${rect.left}px`,
                top: `${rect.top}px`,
                opacity: this.opacity,
                position: 'absolute',
            };
        },

        innerStyle() {
            const {
                model,
                global: { zoom = 1 },
            } = this;
            return {
                width: `${Math.round(model.width)}px`,
                height: `${Math.round(model.height)}px`,
                transform: `scale(${zoom})`,
            };
        },

        hide() {
            return (
                this.options.mode !== 'preview' &&
                this.editor.currentElement &&
                this.editor.currentElement.$id === this.model.$id &&
                !this.model.lock &&
                this.model.$editing
            );
        },
    },
};
