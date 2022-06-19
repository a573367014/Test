import _pick from "lodash/pick";
import editorDefaults from "@gaoding/editor-framework/lib/base/editor-defaults";
export default {
  /**
   * 变形文字元素转换为普通文字元素
   * @memberof EditorEffectTextElementMixin
   * @param  {element} element - 被转换变形文字元素
   * @param  {layout} layout  - 元素所在的布局
   * @return {element}        创建的普通文字元素
   */
  convertEffectTextToText: function convertEffectTextToText(element, layout) {
    if (layout === void 0) {
      layout = this.currentLayout;
    }

    element = this.getElement(element);

    if (!element) {
      return;
    }

    var defaultElement = editorDefaults.element;
    var defaultTextElement = editorDefaults.textElement;
    var props = [].concat(Object.keys(defaultTextElement)).concat(Object.keys(defaultElement));

    var data = _pick(element, props);

    data.type = 'text';
    data.version = editorDefaults.version;
    data.resize = 5;
    data.width = element.typoWidthRatio * element.width;
    data.height = element.typoHeightRatio * element.height;
    data.left += (element.width - data.width) / 2;
    data.top += (element.height - data.height) / 2;
    var newElement = this.replaceElement(element, data, layout);
    this.focusElement(newElement);
    return newElement;
  }
};