export default class RendererManage {
    constructor(editor) {
        this.editor = editor;
        this.renderers = {};
    }

    get(id) {
        if (this.renderers[id]) {
            clearTimeout(this.renderers[id].timer);
        }

        return this.renderers[id] ? this.renderers[id].instance : null;
    }

    count(id) {
        if (this.renderers[id]) {
            this.renderers[id].count += 1;
        }
    }

    create(id, renderer) {
        this.renderers[id] = {
            instance: renderer,
            count: 1,
        };

        clearTimeout(this.renderers[id].timer);
        return this.renderers[id].instance;
    }

    destory(id) {
        if (!this.renderers[id]) {
            return;
        }

        this.renderers[id].count--;
        if (this.renderers[id].count < 1) {
            clearTimeout(this.renderers[id].timer);
            this.renderers[id].timer = setTimeout(() => {
                this.renderers[id].instance.destory && this.renderers[id].instance.destory();
                delete this.renderers[id];
            }, 100);
        }
    }
}
