import { pick } from 'lodash';
import editorDefaults from '@gaoding/editor-framework/src/base/editor-defaults';

export default {
    /**
     * 变形文字元素转换为普通文字元素
     * @memberof EditorEffectTextElementMixin
     * @param  {element} element - 被转换变形文字元素
     * @param  {layout} layout  - 元素所在的布局
     * @return {element}        创建的普通文字元素
     */
    convertEffectTextToText(element, layout = this.currentLayout) {
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
        data.resize = 5;
        data.width = element.typoWidthRatio * element.width;
        data.height = element.typoHeightRatio * element.height;
        data.left += (element.width - data.width) / 2;
        data.top += (element.height - data.height) / 2;
        const newElement = this.replaceElement(element, data, layout);

        this.focusElement(newElement);
        return newElement;
    },
};
