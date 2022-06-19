import { isEditable } from './utils';

export const handleMap = {
    // backspace, delete 同时阻止回退键后退页面
    'delete, backspace'() {
        if (
            this.currentElement &&
            (this.currentElement.type !== 'mask' || !this.currentElement.url)
        ) {
            this.removeElement(null, null, true);
        } else if (this.currentElement) {
            // this.currentElement.url = '';
            // this.currentElement.imageUrl = '';
            this.changeElement(
                { url: '', imageUrl: '', resourceType: 'image', naturalDuration: 0 },
                this.currentElement,
            );
        }

        return false;
    },

    // left, top, right, bottom
    'left, right, up, down, shift+left, shift+right, shift+up, shift+down'(e) {
        const elements = this.getSelectedElements(true);

        // 未选中元素时方向键默认滚动
        if (!elements.length) {
            return;
        }

        // 对当前可编辑的元素，方向键为原生光标控制
        if (isEditable(e.target)) {
            return;
        }

        // 阻止浏览器滚动行为
        e.preventDefault();

        const code = e.keyCode;
        let offset = code <= 38 ? -1 : 1;
        const dir = Math.abs(code - 38) === 1 ? 'left' : 'top';

        if (e.shiftKey) {
            offset *= 10;
        }

        elements.forEach((element) => {
            const props = {};
            props[dir] = element[dir] + offset;
            this.changeElement(props, element);

            // Reset tooar position
            element.$draging = true;
            this.$nextTick(() => {
                element.$draging = false;
            });
        });

        // prevent default action
        return false;
    },

    // esc
    esc() {
        // Close contextmenu
        const contextmenu = this.contextmenu;
        if (contextmenu && contextmenu.isShow) {
            contextmenu.hide();
            return false;
        }

        const currentElement = this.currentElement;
        if (currentElement) {
            // Cancel editor
            if (currentElement.type === '$croper' || currentElement.type === '$masker') {
                this.$events.$emit('element.editCancel', currentElement);
                return false;
            }

            if (currentElement.$editing) {
                currentElement.$editing = false;
                return false;
            }

            // unselected elements
            this.currentElement = null;
            return false;
        }
        return false;
    },

    // enter
    enter() {
        const currentElement = this.currentElement;
        if (currentElement) {
            switch (currentElement.type) {
                case 'image':
                case 'mask':
                case 'text':
                    // Enter croper
                    this.showElementEditor(currentElement);
                    break;

                case '$croper':
                case '$masker':
                case '$watermarker':
                    // Apply editor
                    this.$events.$emit('element.editApply', currentElement);
                    break;

                case '$selector':
                    // Set to group
                    this.addGroupByElements();
                    break;

                case 'group':
                    // flat group
                    this.flatGroup();
                    break;
            }
            return false;
        }
    },

    // a, select all
    'ctrl+a, command+a'() {
        const elements = this._getOperateModeElements(this.currentLayout);
        elements.forEach((element) => {
            // Exclude frozen and undragable element
            if (!element.frozen && !element.lock && element.dragable) {
                this.selectElement(element);
            }
        });
        this.selectElements(elements);
        return false;
    },

    // a, select all
    'ctrl+shift+a, command+shift+a'() {
        this.currentElement = null;
        return false;
    },

    // copy
    'ctrl+c, command+c'() {
        // 配合 tabindex 解决粘贴文字时 getSelection 获取不正确问题
        this.container && this.container.focus();

        this.copyElement();
        // return false;
    },

    // x, cut
    'ctrl+x, command+x'() {
        // 配合 tabindex 解决粘贴文字时 getSelection 获取不正确问题
        this.container && this.container.focus();

        this.cutElement();
        // return false;
    },

    // v, paste
    'ctrl+v, command+v'() {
        // 兼容外部图片元素和内部元素的粘贴，使用paste事件监听实现粘贴
        // this.pasteElement();
        // return false;
    },

    // g, group
    'ctrl+g, command+g'() {
        !this.global.$tempGroup && this.addGroupByElements();
        return false;
    },

    // g, ungroup
    'ctrl+shift+g, command+shift+g'() {
        !this.global.$tempGroup && this.flatGroup();
        return false;
    },

    // z, undo
    'ctrl+z, command+z'() {
        if (this.hasUndo) {
            this.undo();
        }
        return false;
    },

    // z, redo
    'ctrl+shift+z, command+shift+z, ctrl+y, command+y'() {
        if (this.hasRedo) {
            this.redo();
        }
        return false;
    },

    // j, clone
    'ctrl+j, command+j, ctrl+d, command+d'() {
        this.cloneElement();
        return false;
    },

    // zoom
    'ctrl+0, command+0'() {
        this.fitZoom();
        return false;
    },

    'ctrl+1, command+1'() {
        this.zoomTo(1);
        return false;
    },

    'ctrl+2, command+2'() {
        this.zoomTo(2);
        return false;
    },

    'ctrl+-, command+-, ctrl+minus, command+minus'() {
        const zoom = this.zoom - 0.2;
        this.zoomTo(Math.max(0.2, zoom));
        return false;
    },

    'ctrl+=, command+=, ctrl+plus, command+plus'() {
        const zoom = this.zoom + 0.2;
        this.zoomTo(Math.min(4, zoom));
        return false;
    },

    // z-index
    'ctrl+[, command+[, ctrl+down, command+down'() {
        this.backwardElement();
        return false;
    },

    'ctrl+], command+], ctrl+up, command+up'() {
        this.forwardElement();
        return false;
    },

    'ctrl+shift+[, command+shift+[, ctrl+shift+down, command+shift+down'() {
        this.setElementToBottom();
        return false;
    },

    'ctrl+shift+], command+shift+], ctrl+shift+up, command+shift+up'() {
        this.setElementToTop();
        return false;
    },

    // toggle lock
    'ctrl+l, command+l'(e) {
        e.preventDefault();

        const elements = this.getSelectedElements(true);
        if (elements.length && elements[0].lock) {
            this.unlockElement(elements);
        } else {
            this.lockElement(elements);
        }
        return false;
    },

    // unlock
    'ctrl+shift+/, command+shift+/'() {
        const elements = this.getSelectedElements(true);
        this.unlockElement(elements);
        return false;
    },

    // toggle editor mode or flow mode
    'ctrl+\\, command+\\'() {
        this.mode = this.mode === 'flow' ? 'editor' : 'flow';
        return false;
    },

    // toggle video play
    space() {
        const elem = this.currentSubElement || this.currentElement;
        if (elem && elem.type === 'video') {
            elem.$playing = !elem.$playing;
        }
    },
};
