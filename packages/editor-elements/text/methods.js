/**
 * @class EditorTextElementMixin
 * @description 元素的专属方法
 */
import $ from '@gaoding/editor-utils/zepto';
import { assign, merge, isString, pick } from 'lodash';
import editorDefaults from '@gaoding/editor-framework/src/base/editor-defaults';
import { commandValueMap } from '@gaoding/editor-framework/src/utils/rich-text/config';
import { serialize } from '@gaoding/editor-framework/src/utils/utils';
import { isGroup } from '@gaoding/editor-utils/element';

// 四舍五入保留小数点后 2 位
function round(value) {
    return Math.round(value * 100) / 100;
}

export default {
    /**
     * 添加文字元素 {@link module:EditorDefaults.textElement|textElement}
     * @memberof EditorTextElementMixin
     * @param {String} text - 文字内容
     * @param {Object} options - 文字相关其他{@link module:EditorDefaults.textElement|参数}
     * @param {layout} [layout=currentLayout] 添加到的 layout
     * @returns {element} 文本元素
     */
    addText(text, options, layout) {
        const data = assign(
            {
                type: 'text',
                fontSize: 16,
                fontFamily: 'Simsun',
                content: text,
                lineHeight: 1.2,
            },
            options,
        );

        this.calculateBox(data);

        return this.addElement(data, layout);
    },

    /**
     * 预测文本元素宽高
     * @memberof EditorTextElementMixin
     * @param {Object} data - 创建文本元素所需的数据
     */
    calculateBox(data) {
        if (!data.width) {
            const widthOffset = 10;
            const heightOffset = 10;
            const panel = this.$el;
            const span = document.createElement('span');
            let cssText = 'position:absolute;left:0;top:-100px;';

            cssText += `max-width:${this.width}px;`;
            cssText += `line-height:${data.lineHeight || 'normal'};`;
            cssText += `font-size:${data.fontSize}px;`;
            cssText += `letter-spacing:${data.letterSpacing || 0}px;`;

            if (data.fontFamily) {
                cssText += 'font-family:' + data.fontFamily;
            }

            span.innerHTML = data.content;
            span.style.cssText = cssText;
            panel.appendChild(span);

            data.width = span.offsetWidth + widthOffset;
            data.height = span.offsetHeight + heightOffset;

            if (!data.lineHeight) {
                data.lineHeight = data.height / data.fontSize;
            }

            panel.removeChild(span);
        }
    },

    /**
     * 变更单个文本元素富文本内容
     * @memberof EditorTextElementMixin
     * @param  {object} props    多个属性对象
     * @param  {textElement} element 文本元素
     * @param  {boolean} 保存快照
     */
    changeTextContents(props, element, makeSnapshot = true) {
        element = this.getElement(element);

        const richText = this.currentRichText;

        if (!['text', 'effectText'].includes(element.type)) return;

        if (!element.$editing) {
            // 还未进入编辑状态时, 数据控制contents更新
            element.contents = serialize.injectStyleProps(element.contents, props);

            let newContents = [];
            if (isString(props.listStyle) && props.listStyle !== '') {
                element.contents.forEach((item) => {
                    const content = item.content.replace(/(\r?\n|\r)/gm, '__BR__');
                    const strs = content.split('__BR__');
                    delete item.beginParentTag;
                    delete item.closeParentTag;

                    newContents = newContents.concat(
                        strs
                            .filter((str) => !!str)
                            .map((str) => {
                                return {
                                    ...item,
                                    content: str,
                                    beginParentTag: 'li',
                                    closeParentTag: 'li',
                                };
                            }),
                    );
                });

                element.contents = serialize.mergeChild(newContents);
            } else if (isString(props.listStyle)) {
                newContents = element.contents.filter((item) => !!item.content);
                newContents = newContents.map((item, i) => {
                    const brakValid = /(\r?\n|\r)$/.test(item.content);

                    if (item.closeParentTag && i !== newContents.length - 1 && !brakValid) {
                        item.content += '\n';
                    }

                    delete item.beginParentTag;
                    delete item.closeParentTag;

                    return { ...item };
                });

                element.contents = serialize.mergeChild(newContents);
            }

            merge(element, props);

            const action = {
                tag: 'change_element',
                elements: [element],
                props: {
                    ...props,
                    contents: element.contents,
                },
            };
            makeSnapshot && this.makeSnapshot(action);
        } else if (richText) {
            // 进入编辑状态时, 命令控制contents更新
            const data = this.currentSelection;

            Object.keys(props).forEach((name) => {
                let value = props[name];
                const fontsMap = this.options.fontsMap;

                if (name === 'listStyle' && value) {
                    richText.cmd.do('insertList');
                }

                if (!data || (data[name] && data[name] !== value)) {
                    // name 若是包含 ”.“ 这种非法字符 document.execCommand 无法执行
                    // 此时需回退 family
                    if (
                        name === 'fontFamily' &&
                        value.includes('.') &&
                        fontsMap[value] &&
                        fontsMap[value].family
                    ) {
                        value = fontsMap[value].family;
                    }

                    richText.cmd.do(name, value);
                }
            });
        }
    },

    // rich text editor
    /**
     * 文字元素粗体切换
     * @memberof EditorTextElementMixin
     * @param {textElement} element - 文字元素
     */
    toggleBold(element = this.currentSubElement || this.currentElement) {
        const model = this.currentSelection || element;

        this.changeTextContents(
            {
                fontWeight: +model.fontWeight === 700 ? 400 : 700,
            },
            element,
        );
    },

    /**
     * 文字元素斜体切换
     * @memberof EditorTextElementMixin
     * @param {textElement} element - 文字元素
     */
    toggleItalic(element = this.currentSubElement || this.currentElement) {
        const model = this.currentSelection || element;

        this.changeTextContents(
            {
                fontStyle: model.fontStyle === 'italic' ? 'normal' : 'italic',
            },
            element,
        );
    },

    /**
     * 文字元素下划线切换
     * @memberof EditorTextElementMixin
     * @param {textElement} element - 文字元素
     */
    toggleUnderline(element = this.currentSubElement || this.currentElement) {
        const model = this.currentSelection || element;
        const value = model.textDecoration === 'underline' ? 'none' : 'underline';

        this.changeTextContents(
            {
                textDecoration: value,
            },
            element,
        );
    },

    /**
     * 文字元素删除线切换
     * @memberof EditorTextElementMixin
     * @param {textElement} element - 文字元素
     */
    toggleThrough(element = this.currentSubElement || this.currentElement) {
        const model = this.currentSelection || element;
        const value = model.textDecoration === 'line-through' ? 'none' : 'line-through';

        this.changeTextContents(
            {
                textDecoration: value,
            },
            element,
        );
    },

    /**
     * 设置文字元素字体
     * @memberof EditorTextElementMixin
     * @param {String} value - 字体名称
     * @param {textElement} element - 文字元素
     */
    setFontFamily(value, element = this.currentSubElement || this.currentElement) {
        this.changeTextContents(
            {
                fontFamily: value,
            },
            element,
        );
    },

    /**
     * 设置文字元素字号
     * @memberof EditorTextElementMixin
     * @param {String} value - 字号大小
     * @param {textElement} element - 文字元素
     */
    setFontSize(value, element = this.currentSubElement || this.currentElement) {
        this.changeTextContents(
            {
                fontSize: value,
            },
            element,
        );
    },

    /**
     * 设置文字元素颜色
     * @memberof EditorTextElementMixin
     * @param {String} value - 文字颜色
     * @param {textElement} element - 文字元素
     */
    setColor(value, element = this.currentSubElement || this.currentElement) {
        this.changeTextContents(
            {
                color: value,
            },
            element,
        );
    },

    updateCurrentSelection() {
        const textSelectionKeys = Object.keys(commandValueMap);

        // 这些值可能为null
        const textDefaultValue = {
            fontWeight: 400,
            fontStyle: 'normal',
            textDecoration: 'none',
        };

        // 设置text默认值
        const textSelection = {};
        textSelectionKeys.forEach((key) => {
            textSelection[key] = null;
        });

        // 判断是否混合多种属性
        textSelectionKeys.forEach((key) => {
            textSelection[key + 'Mixed'] = false;
        });

        let clearSelectionWatch = () => {};

        // 比较所有contents，判断是否混合
        const diffContentsProps = (elements) => {
            const result = {};
            let contents = [];

            elements.forEach((element) => {
                const child = element.contents
                    .filter((item) => {
                        const rBreakLine = /<br>|\r|\n/g;
                        if (!item.content || !item.content.replace(rBreakLine, '')) return false;
                        return true;
                    })
                    .map((item) => {
                        return {
                            ...item,
                            element,
                        };
                    });

                contents = contents.concat(child);
            });

            contents.length > 1 &&
                contents.reduce((a, b) => {
                    textSelectionKeys.forEach((key) => {
                        let aValue = a[key] || a.element[key] || textDefaultValue[key];
                        let bValue = b[key] || b.element[key] || textDefaultValue[key];

                        if (key === 'fontSize') {
                            aValue = round(aValue);
                            bValue = round(bValue);
                        }

                        if (aValue !== bValue && aValue && bValue) {
                            result[key + 'Mixed'] = true;
                        }
                    });

                    return b;
                });

            return result;
        };

        const getElementSelection = (element) => {
            const props = {};

            textSelectionKeys.forEach((key) => {
                props[key] = element[key] || textDefaultValue[key];
            });

            props.fontSize = round(props.fontSize);

            return props;
        };

        this.$watch(
            () => {
                let result = null;
                let { currentElement, currentSubElement, selectedElements } = this;
                let elements = selectedElements || [];
                currentElement = currentSubElement || currentElement;

                // 单选文本不是编辑状态
                if (
                    currentElement &&
                    /text/i.test(currentElement.type) &&
                    !currentElement.$editing
                ) {
                    result = {
                        ...diffContentsProps([currentElement]),
                        ...getElementSelection(currentElement),
                    };
                }

                // 单选组元素
                if (isGroup(currentElement)) {
                    elements = [];
                    this.walkTemplet(
                        (element) => {
                            elements.push(element);
                        },
                        true,
                        [currentElement],
                    );
                }
                // 多选取selector.elements为准
                else if (
                    elements.length > 1 &&
                    currentElement &&
                    currentElement.type === '$selector'
                ) {
                    elements = currentElement.elements || [];
                    elements = elements.reduce((a, b) => a.concat(b.elements || b), []);
                } else if (elements.length > 1) {
                    elements = [];
                }

                elements = elements.filter((element) => /text/i.test(element.type));

                if (elements.length) {
                    result = {
                        ...diffContentsProps(elements),
                        ...getElementSelection(elements[0]),
                    };
                }

                return {
                    result,
                    length: elements.length,
                    currentElement,
                };
            },
            ({ result, currentElement }) => {
                if (result) {
                    this.currentTextSelection = Object.assign({}, textSelection, result);
                } else if (!currentElement || !/text/i.test(currentElement.type)) {
                    this.currentTextSelection = null;
                }
            },
        );

        // 单选文本 && 编辑状态
        this.$watch('currentRichText', (richText) => {
            let { currentElement, currentSubElement } = this;
            currentElement = currentSubElement || currentElement;

            clearSelectionWatch();

            if (!currentElement || !richText) {
                return;
            }

            const callback = () => {
                let { currentElement, currentSubElement } = this;
                currentElement = currentSubElement || currentElement;

                if (!currentElement.$editing) return;

                const props = {};

                textSelectionKeys.forEach((key) => {
                    const val = richText.cmd.queryCommandValue(key);
                    props[key] = commandValueMap[key](val) || currentElement[key];
                });

                props.fontSize = round(props.fontSize);

                this.currentTextSelection = Object.assign({}, textSelection, props);

                // 选区是否混合状态
                const range = richText.selection._currentRange;
                if (!range) return;

                // 纯文本不存在混合状态
                const selectedNodes = $('<div></div>').append(range.cloneContents());
                if (!selectedNodes.children().length) return;

                const contents = serialize.fromJSON(selectedNodes.html());
                if (!contents || contents.length < 2) return;

                const result = diffContentsProps([{ ...currentElement, contents }]);
                Object.assign(this.currentTextSelection, result);
            };

            // 监听selection
            richText.on('change', callback);
            richText.selection.on('change', callback);

            // 缓存事件删除句柄
            clearSelectionWatch = () => {
                richText.off('change', callback);
                richText.selection.off('change', callback);
            };
        });
    },

    /**
     * 进入文字元素的编辑状态
     * @memberof EditorTextElementMixin
     * @param {element} element - 文字元素
     */
    showTextEditor(element) {
        element.$editing = true;
    },
};
