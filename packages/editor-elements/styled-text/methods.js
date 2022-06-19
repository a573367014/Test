/**
 * @class EditorStyledTextElementMixin
 * @description 元素的专属方法
 */

import { merge, assign, pick } from 'lodash';
import { serialize } from '@gaoding/editor-framework/src/utils/utils';
import editorDefaults from '@gaoding/editor-framework/src/base/editor-defaults';

export default {
    /**
     * 添加文字元素 {@link module:EditorDefaults.textElement|textElement}
     * @memberof EditorTextElementMixin
     * @param {String} text - 风格文字内容
     * @param {Object} options - 风格文字相关其他参数
     * @returns {element} 风格文字元素
     */
    addStyledText(text, options) {
        const data = assign(
            {
                type: 'styledText',
                fontSize: 16,
                fontFamily: 'HYChengXingJ', // TODO: change to default fontFamily
                content: text,
                resize: 5,
            },
            options,
        );

        const widthOffset = 10;
        const heightOffset = 10;

        // 预测宽高
        if (!data.width) {
            const panel = this.$el;
            const span = document.createElement('span');
            let cssText = 'position:absolute;left:0;top:-100px;';
            const { zoom } = this.global;

            cssText += 'white-space: nowrap;';
            cssText += `max-width:${this.width / zoom}px;`;
            cssText += `line-height:${data.lineHeight || 'normal'};`;
            cssText += `font-size:${data.fontSize / zoom}px;`;

            if (data.fontFamily) {
                cssText += 'font-family:' + data.fontFamily;
            }

            span.innerHTML = text;
            span.style.cssText = cssText;
            panel.appendChild(span);

            data.width = span.offsetWidth * zoom + widthOffset;
            data.height = span.offsetHeight * zoom + heightOffset;

            if (!data.lineHeight) {
                data.lineHeight = data.height / data.fontSize;
            }

            panel.removeChild(span);
        }

        return this.addElement(data);
    },
    /**
     * 变更单个文本元素富文本内容
     * @memberof EditorStyledTextElementMixin
     * @param  {object} props    多个属性对象
     * @param  {textElement} element 文本元素
     * @param  {boolean} makeSnapshot 保存快照
     */
    changeStyledTextContents(props, element, makeSnapshot) {
        element = this.getElement(element);

        const richText = this.currentRichText;

        if (element.type !== 'styledText') return;

        if (!element.$editing) {
            // 还未进入编辑状态时, 数据控制contents更新
            element.contents = serialize.injectStyleProps(element.contents, props);
            merge(element, props);
            makeSnapshot && this.makeSnapshot('change_text_contents');
        } else if (richText) {
            // 进入编辑状态时, 命令控制contents更新
            Object.keys(props).forEach((name) => richText.cmd.do(name, props[name]));
        }
    },
    /**
     * 3D文字元素转换为普通文字元素
     * @memberof EditorEffectTextElementMixin
     * @param  {element} element - 被转换变形文字元素
     * @param  {layout} layout  - 元素所在的布局
     * @return {element}        创建的普通文字元素
     */
    convertStyledTextToText(element, layout = this.currentLayout) {
        element = this.getElement(element);
        if (!element) {
            return;
        }

        const defaultElement = editorDefaults.element;
        const defaultTextElement = editorDefaults.textElement;
        const props = []
            .concat(Object.keys(defaultTextElement))
            .concat(Object.keys(defaultElement));

        const data = pick(element, props);
        data.type = 'text';
        data.version = editorDefaults.version;

        const newElement = this.replaceElement(element, data, layout);
        this.focusElement(newElement);
        return newElement;
    },
};
