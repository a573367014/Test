import $ from '@gaoding/editor-utils/zepto';
import EventEmitter from '@gaoding/editor-utils/event-emitter';
import { isFox } from '@gaoding/editor-utils/ua';

import Command from './command';
import Selection from './selection';
import serialize from './utils/serialize';
import { getPasteText } from './utils/paste';

const MutationObserver =
    window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;

export default class RichText extends EventEmitter {
    /**
     * @param {jquery selector} textElem 绑定contenteditable的可编辑元素
     */
    constructor(textElem, { options, editorOptions, model }) {
        super();

        this.model = model;
        this.editorOptions = editorOptions;
        this.$textElem = $(textElem);
        this.setConfig(options);
        this._init();
    }

    _init() {
        this.selection = new Selection(this.$textElem);
        this.cmd = new Command(this.selection);

        this.clear();
        this._bindSaveRange();
        this._bindPaste();
        this._changed();
        this._bindClear();
    }

    // 绑定自动保存选区事件相关
    _bindSaveRange() {
        const $textElem = this.$textElem;
        const selection = this.selection;

        // 保存当前的选区
        const saveRange = () => selection.saveRange();

        // 实时保存选取,按键后保存
        $textElem.on('keyup.richText', saveRange);
        $textElem.on('mousedown.richText', () => {
            // mousedown 状态下，鼠标滑动到编辑区域外面，也需要保存选区
            $textElem.on('mouseleave.richText', saveRange);
        });

        $textElem.on('mouseup.richText', () => {
            // 需要延迟，否则点击的时候saveRange会先于"系统选区更新"触发,这时保存的将是旧range
            setTimeout(saveRange, 50);
            // 在编辑器区域之内完成点击，取消鼠标滑动到编辑区外面的事件
            $textElem.off('mouseleave.richText', saveRange);
        });
    }

    // 绑定粘贴事件相关
    _bindPaste() {
        const selection = this.selection;
        const cmd = this.cmd;
        const $textElem = this.$textElem;

        // 粘贴过滤
        $textElem
            .on('paste.richText', (e) => {
                if ($textElem.prop('contenteditable') !== 'true') return;
                // fix: 复制黏贴文字到全选内容的富文本，文字追加在已有内容后面，而不是覆盖
                // 粘贴前先更新选区
                this.selection.saveRange();

                const pasteText = getPasteText(e);
                const $selectionElem = selection.getSelectionContainerElem();
                if ($selectionElem) {
                    cmd.do('insertHTML', pasteText);
                    this._createPlaceholderDOM();
                }

                e.stopPropagation();
                e.preventDefault();
            })
            .on('copy.richText cut.richText', (e) => {
                if ($textElem.prop('contenteditable') !== 'true') return;

                e.stopPropagation();
            });
    }

    _createPlaceholderDOM(isFirst) {
        const $textElem = this.$textElem;
        const children = $textElem.children().not('br');
        const text = $textElem.text().replace(/\u200b/g, '');

        if (!children.length || !text) {
            this._insertWrap(text, isFirst);
        }
    }

    _insertWrap(html = '', isFirst = false) {
        // const $textElem = this.$textElem;
        const { defaultStyle, listStyle } = this.config;
        const { $textElem, selection } = this;

        // 插入零宽字符&#8203;占位，否则火狐光标不会显示
        let defaultDOM = `<span style='${defaultStyle}'>${
            html || (isFox() ? '&#8203;' : '<br>')
        }</span>`;

        if (listStyle) {
            defaultDOM = `<ul><li>${defaultDOM}</li></ul>`;
        } else {
            defaultDOM = `<div>${defaultDOM}</div>`;
        }

        $textElem.html('');

        if (isFirst === false) {
            $textElem.focus();
            // 用cmd插入undo不会紊乱
            this.cmd.do('insertHTML', defaultDOM);
        } else {
            defaultDOM = $(defaultDOM)[0];
            $textElem.append(defaultDOM);
            selection.createRangeByElem(defaultDOM, true);
        }

        // 解决 firefox 光标无法显示
        selection.collapse(false);
    }

    // 绑定空内容处理
    _bindClear() {
        const $textElem = this.$textElem;
        let isKeyDown = false;

        $textElem
            .on('keydown', () => {
                isKeyDown = true;
            })
            // 讯飞输入法在 360 浏览器 keyup 事件触发后输入法异常
            // 用 input 处理, 命令插入也会执行 input，这只判断键盘操作
            .on('input', () => {
                setTimeout(() => {
                    isKeyDown && this._createPlaceholderDOM();
                    isKeyDown = false;
                });
            });

        this._createPlaceholderDOM(true);
    }

    // 观察DOM变动
    _changed() {
        let timer = null;
        const target = this.$textElem[0];
        const config = {
            attributes: true,
            childList: true,
            subtree: true,
            characterData: true,
        };

        const observer = (target.__richeTextObserver__ = new MutationObserver(() => {
            this.emit('changeImmediate', this.$textElem[0]);
            this.emit('_changeImmediate', this.$textElem[0]);

            clearTimeout(timer);

            timer = setTimeout(() => {
                const curHtml = this.$textElem.html();
                if (curHtml !== this._prevHtml) {
                    this.emit('change', this.$textElem[0]);
                    this.emit('_change', this.$textElem[0]);
                    this._prevHtml = curHtml;
                }
            }, 100);
        }));

        observer.observe(target, config);
    }

    setConfig(options) {
        if (!options) return;
        const config = this.config || {
            defaultStyle: '',
            listStyle: '',
        };

        Object.assign(config, options);

        const { defaultStyle } = config;

        config.defaultStyle =
            typeof defaultStyle === 'string'
                ? defaultStyle
                : serialize._getStyleString(defaultStyle);

        this.config = config;
    }

    // model反序列化
    fromJSON(html, ...rest) {
        html = html || this.$textElem.html();
        const result = serialize.fromJSON(html, ...rest);
        return result;
    }

    // model 序列化
    fromHTML(...rest) {
        return serialize.fromHTML(...rest);
    }

    // 清理事件
    clear() {
        const $textElem = this.$textElem;
        $textElem[0].__richeTextObserver__ && $textElem[0].__richeTextObserver__.disconnect();
        $textElem.off('keyup.richText');
        $textElem.off('mousedown.richText');
        $textElem.off('mouseleave.richText');
        $textElem.off('mouseup.richText');
        $textElem.off('paste.richText');
        $textElem.off('copy.richText');
        $textElem.off('cut.richText');
    }
}

// 注入静态方法
Object.keys(serialize).forEach((key) => {
    const fn = serialize[key];
    RichText[key] = fn;
});
