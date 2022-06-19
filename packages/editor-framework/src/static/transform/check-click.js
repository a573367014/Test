const dblclickDelay = 256;

export default {
    data() {
        return {
            clickLocked: false,
        };
    },
    methods: {
        // utils - checkClickAlive

        checkClickAlive(e) {
            const rSelfClass = /(?:^|\s)editor-transform(?:$|\s)/;
            const rImageTransformClass = /editor-image-transform/;
            const rVideoCtlr = /(?:^|\s)editor-video-controls__inner(?:$|\s)/;
            const rSubModelClass = /editor-transform-submodel-wrap/;
            const model = this.model;

            let alive = true;
            if (
                // 阻止已被锁定的元素
                model.lock ||
                // 阻止拖拽后的 click
                this.dragLocked ||
                // 特殊元素交由组件自身处理
                model.type.indexOf('$') === 0 ||
                // 阻止非元素本身触发的事件
                (!rSelfClass.test(e.target.className) &&
                    !rImageTransformClass.test(e.target.className) &&
                    !rVideoCtlr.test(e.target.className) &&
                    !rSubModelClass)
            ) {
                alive = false;
            }

            return alive;
        },

        // lock editor click
        // prevent default click event
        lockEditorClick() {
            this.clickLocked = true;

            clearTimeout(this._lockEditorClickTimer);
            this._lockEditorClickTimer = setTimeout(() => {
                this.clickLocked = false;
            }, 160);
        },

        // 模拟单次触发 click & dblclick
        checkClickAdp(e) {
            // 检查 click 是否可用
            if (!this.checkClickAlive(e)) {
                return;
            }

            // prevent default click event
            this.lockEditorClick();

            this.clickCount = (this.clickCount || 0) + 1;

            clearTimeout(this.checkClickAdpTimer);

            if (this.clickCount === 1) {
                this.onClick && this.onClick(e);
            }

            this.checkClickAdpTimer = setTimeout(() => {
                const { clickCount } = this;

                if (clickCount >= 2) {
                    this.onDblClick && this.onDblClick(e);
                }

                // reset
                this.clickCount = 0;
            }, dblclickDelay);
        },
    },
};
