import $ from '@gaoding/editor-utils/zepto';
import tinycolor from 'tinycolor2';
import EventEmitter from '@gaoding/editor-utils/event-emitter';
import { isIE } from '@gaoding/editor-utils/ua';

import { commandAliasMap } from './config';

const allowEmptyRangeCommans = [
    'fontWeight',
    'fontFamily',
    'fontSize',
    'fontStyle',
    'color',
    'textDecoration',
];
allowEmptyRangeCommans.concat(
    allowEmptyRangeCommans
        .filter((name) => commandAliasMap[name])
        .map((name) => commandAliasMap[name]),
);

export default class Command extends EventEmitter {
    /**
     * @param {Selection} selection 选区实例
     */
    constructor(selection) {
        super();
        this.selection = selection;
        this._initMode();
    }

    _initMode() {
        document.execCommand('styleWithCSS', false, true);
    }

    /**
     * 自定义样式命令模板
     * @param {String} name   style属性
     * @param {String} value  style属性值
     */
    _customizeStyle(name, value) {
        const selection = this.selection;

        let $spans = selection.$textElem.find('span[style*=background]');

        $spans.css({
            'background-color': '',
            background: '',
        });

        this._execCommand('hiliteColor', 'rgba(255,255,255,0)');

        $spans = selection.$textElem.find('span[style*=background]');
        $spans.css(name, value).find('span').css(name, '');

        const startElem = $spans[0];
        const endElem = $spans[$spans.length - 1];
        startElem && selection.createRangeByElems(startElem, endElem, 0, endElem.childNodes.length);
    }

    // 自定义font-size
    _fontSize(size) {
        size = parseFloat(size) + 'px';
        this._customizeStyle('font-size', size);
    }

    _color(color) {
        if (isIE()) {
            color = color && tinycolor(color).toString('rgb');
            this._customizeStyle('color', color);
        } else {
            this._execCommand('color', color);
        }
    }

    // 自定义text-decoration
    _textDecoration(value) {
        const map = {
            underline: 'underline',
            'line-through': 'strikeThrough',
        };

        let underlineApply = this.queryCommandValue('underline');
        let strikeThroughApply = this.queryCommandValue('strikeThrough');

        // 使浏览器表现一致
        this._execCommand('underline');
        this._execCommand('underline');
        this._execCommand('strikeThrough');
        this._execCommand('strikeThrough');

        underlineApply = this.queryCommandValue('underline');
        strikeThroughApply = this.queryCommandValue('strikeThrough');

        // 互斥
        if (!map[value]) {
            if (underlineApply) this._execCommand('underline');
            if (strikeThroughApply) this._execCommand('strikeThrough');

            return;
        } else if (value === 'line-through' && underlineApply) {
            this._execCommand('underline');
        } else if (value === 'underline' && strikeThroughApply) {
            this._execCommand('strikeThrough');
        }

        this._execCommand(map[value]);
    }

    // 自定义 insertHTML 事件
    _insertHTML(html) {
        const range = this.selection.getRange();

        if (this.queryCommandSupported('insertHTML')) {
            // W3C
            this._execCommand('insertHTML', html);
        } else if (range.insertNode) {
            // IE
            range.deleteContents();
            range.insertNode($(html)[0]);
        } else if (range.pasteHTML) {
            // IE <= 10
            range.pasteHTML(html);
        }
    }

    // 插入 elem
    _insertElem(elem) {
        const range = this.selection.getRange();

        if (range.insertNode) {
            range.deleteContents();
            range.insertNode(elem);
        }
    }

    // 列表文字
    _insertList() {
        const $textElem = this.selection.$textElem;
        this.selection.createRangeByElem($textElem[0], true);

        this._execCommand('InsertOrderedList');
        this._execCommand('InsertUnorderedList');

        $textElem.children('span').each((i, el) => {
            const $elem = $(el);
            const text = $(el).text();

            if (!text) {
                $elem.remove();
            }
        });
    }

    // 封装 execCommand
    _execCommand(name, value) {
        this._initMode();
        name = commandAliasMap[name] || name;
        document.execCommand(name, false, value);
    }

    // 自定义命令 queryCommandValue
    _queryCommandValue(name) {
        if (name === 'textDecoration') {
            let textDecoration = 'none';
            if (this.queryCommandState('strikeThrough') === true) {
                textDecoration = 'line-through';
            } else if (this.queryCommandState('underline') === true) {
                textDecoration = 'underline';
            }
            return textDecoration;
        }

        const textElem = this.selection.$textElem[0];
        let startElem = this.selection.getSelectionStartElem();
        let result = $(startElem).css(name);

        if (name === 'font-size') {
            while (result === '0px') {
                startElem = $(startElem).children().get(0);
                if (!startElem) {
                    break;
                }
                result = $(startElem).css(name);
            }
        }

        // IE 原生 queryCommandValue('fontName')，返回不是字体名，单独处理
        if (['color', 'font-family'].includes(name) && startElem === textElem) {
            startElem = $(startElem).children().get(0);
            result = $(startElem).css(name);
        }

        return result;
    }

    // 执行命令
    do(name, value) {
        const selection = this.selection;

        // 如果无选区，忽略
        if (!selection.getRange()) return;

        const isCreateEmptyRange =
            allowEmptyRangeCommans.includes(name) && selection.isSelectionEmpty();

        if (isCreateEmptyRange) {
            selection.createEmptyRange(this);
        }

        // 恢复选取
        selection.restoreSelection();
        // 执行
        const _name = '_' + name;
        if (this[_name]) {
            // 有自定义事件
            this[_name](value);
        } else {
            // 默认 command
            this._execCommand(name, value);
        }

        this.emit('do', [name, value]);

        // 最后，恢复选取保证光标在原来的位置闪烁
        selection.saveRange();
        selection.restoreSelection();

        if (isCreateEmptyRange) {
            // 需要将选取折叠起来
            selection.collapse();
            selection.restoreSelection();
        }
    }

    // 封装 document.queryCommandValue
    queryCommandValue(name) {
        const redirectState = [
            'bold',
            'Bold',
            'italic',
            'Italic',
            'strikeThrough',
            'StrikeThrough',
            'underline',
            'Underline',
        ];
        const customizeMap = {
            fontSize: 'font-size',
            FontSize: 'font-size',
            textDecoration: 'textDecoration',
        };

        // IE 原生 queryCommandValue('fontName')，返回不是字体名，单独处理
        if (isIE()) {
            Object.assign(customizeMap, {
                fontName: 'font-family',
                foreColor: 'color',
            });
        }

        name = commandAliasMap[name] || name;

        if (customizeMap[name]) {
            return this._queryCommandValue(customizeMap[name]);
        } else if (redirectState.indexOf(name) !== -1) {
            return this.queryCommandState(name);
        } else {
            return document.queryCommandValue(name);
        }
    }

    queryCommandState(name) {
        return document.queryCommandState(name);
    }

    // 封装 document.queryCommandSupported
    queryCommandSupported(name) {
        return document.queryCommandSupported(name);
    }
}
