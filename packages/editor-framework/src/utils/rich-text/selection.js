import $ from '@gaoding/editor-utils/zepto';
import EventEmitter from '@gaoding/editor-utils/event-emitter';

// 构造函数
export default class Selection extends EventEmitter {
    /**
     * @param {jquery selector} textElem 绑定contenteditable的可编辑元素
     */
    constructor(textElem) {
        super();
        this.$textElem = $(textElem);
        this._currentRange = null;
    }

    // 获取 range 对象
    getRange() {
        return this._currentRange;
    }

    // 保存选区
    saveRange(_range) {
        if (_range) {
            // 保存已有选区
            this._currentRange = _range;
            return;
        }

        // 获取当前的选区
        const $textElem = this.$textElem;
        const selection = window.getSelection();

        if (selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);

        // 判断选区内容是否在编辑内容之内
        const containerElem = this.getSelectionContainerElem(range);

        if (!containerElem) return;

        if ($.contains($textElem[0], containerElem) || $textElem[0] === containerElem) {
            // 是编辑内容之内的
            this._currentRange = range;
        }

        this._changed();
    }

    // 将选区变成光标
    // firefox必须有事件触发，直接使用无效
    collapse(toStart = false) {
        if (this._currentRange) {
            this._currentRange.collapse(toStart);
            this.restoreSelection();
        }
    }

    // 恢复选区
    restoreSelection() {
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(this._currentRange);
        this._changed();
    }

    // 选区是否为空
    isSelectionEmpty() {
        const range = this._currentRange;
        // return range.collapsed;
        return (
            range &&
            range.startContainer &&
            range.startContainer === range.endContainer &&
            range.startOffset === range.endOffset
        );
    }

    // 创建一个空白（即 &#8203 字符）选区
    createEmptyRange(cmd) {
        const range = this.getRange();

        if (!range || !this.isSelectionEmpty()) {
            // 当前无 range
            return;
        }

        try {
            const elem = $('<span>&#8203;</span>')[0];
            cmd.do('insertElem', elem);
            this.createRangeByElem(elem, true);
        } catch (e) {
            // 部分情况下会报错，兼容一下
            console.error(e);
        }
    }

    // 选区的开始元素
    getSelectionStartElem() {
        const range = this._currentRange;
        if (range) {
            const elem = range.startContainer;
            return elem.nodeType === 1 ? elem : elem.parentNode;
        }
    }

    // 选区元素的共同父级
    getSelectionContainerElem(range) {
        range = range || this._currentRange;
        if (range) {
            const elem = range.commonAncestorContainer;
            return elem.nodeType === 1 ? elem : elem.parentNode;
        }
    }

    // 克隆选区内容，返回文档片段
    cloneContents() {
        const range = this._currentRange;
        if (range) {
            const result = range.cloneContents();
            return result;
        }
    }

    /**
     * 根据 elem 设置选区
     * @param {htmlNode} elem 节点元素
     * @param {Boolean}  isContent 是否只是选中内容（false：选中元素本身）
     */
    createRangeByElem(elem, isContent) {
        elem = elem || this.$textElem[0];
        if (!elem) {
            return;
        }

        const range = document.createRange();

        if (isContent) {
            range.selectNodeContents(elem);
        } else {
            range.selectNode(elem);
        }

        // 存储 range
        this._currentRange = range;
        this.restoreSelection();
    }

    /**
     * 根据 前后节点 设置选区
     * @param {htmlNode} startElem 开始元素
     * @param {htmlNode} endElem 结束元素
     * @param {Number} startOffset 开始元素的开始位置
     * @param {Number} endOffset 结束元素的结束位置
     */
    createRangeByElems(startElem, endElem, startOffset = false, endOffset = false) {
        const range = document.createRange();

        if (!startElem || !endElem) throw new Error('startElem endElem is required');

        startOffset === false
            ? range.setStartBefore(startElem)
            : range.setStart(startElem, startOffset);
        endOffset === false ? range.setEndAfter(endElem) : range.setEnd(endElem, endOffset);

        // 存储 range
        this._currentRange = range;
        this.restoreSelection();
    }

    // 清除全部选取
    clearRange() {
        if (!this._currentRange) return;
        const selection = window.getSelection();
        selection.removeRange(this._currentRange);
        this._currentRange = null;
    }

    _changed() {
        clearTimeout(this._timer);
        this.timer = setTimeout(() => {
            const range = this._currentRange;

            const rangeInfo = [
                range.startContainer,
                range.endContainer,
                range.startOffset,
                range.endOffset,
                range.toString(),
            ];

            const diff = () => {
                return rangeInfo.some((item, i) => item !== this._prevRangeInfo[i]);
            };

            if (!this._prevRangeInfo || diff()) {
                this.emit('change', this._currentRange);
                this.emit('_change', this._currentRange);

                this._prevRangeInfo = rangeInfo;
            }
        }, 100);
    }
}
