import _pick from "lodash/pick";
import _assign from "lodash/assign";
import _merge from "lodash/merge";
import { serialize } from "@gaoding/editor-framework/lib/utils/utils";
import editorDefaults from "@gaoding/editor-framework/lib/base/editor-defaults";
export default {
  /**
   * 添加文字元素 {@link module:EditorDefaults.textElement|textElement}
   * @memberof EditorTextElementMixin
   * @param {String} text - 风格文字内容
   * @param {Object} options - 风格文字相关其他参数
   * @returns {element} 风格文字元素
   */
  addStyledText: function addStyledText(text, options) {
    var data = _assign({
      type: 'styledText',
      fontSize: 16,
      fontFamily: 'HYChengXingJ',
      // TODO: change to default fontFamily
      content: text,
      resize: 5
    }, options);

    var widthOffset = 10;
    var heightOffset = 10; // 预测宽高

    if (!data.width) {
      var panel = this.$el;
      var span = document.createElement('span');
      var cssText = 'position:absolute;left:0;top:-100px;';
      var zoom = this.global.zoom;
      cssText += 'white-space: nowrap;';
      cssText += "max-width:" + this.width / zoom + "px;";
      cssText += "line-height:" + (data.lineHeight || 'normal') + ";";
      cssText += "font-size:" + data.fontSize / zoom + "px;";

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
  changeStyledTextContents: function changeStyledTextContents(props, element, makeSnapshot) {
    element = this.getElement(element);
    var richText = this.currentRichText;
    if (element.type !== 'styledText') return;

    if (!element.$editing) {
      // 还未进入编辑状态时, 数据控制contents更新
      element.contents = serialize.injectStyleProps(element.contents, props);

      _merge(element, props);

      makeSnapshot && this.makeSnapshot('change_text_contents');
    } else if (richText) {
      // 进入编辑状态时, 命令控制contents更新
      Object.keys(props).forEach(function (name) {
        return richText.cmd.do(name, props[name]);
      });
    }
  },

  /**
   * 3D文字元素转换为普通文字元素
   * @memberof EditorEffectTextElementMixin
   * @param  {element} element - 被转换变形文字元素
   * @param  {layout} layout  - 元素所在的布局
   * @return {element}        创建的普通文字元素
   */
  convertStyledTextToText: function convertStyledTextToText(element, layout) {
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
    var newElement = this.replaceElement(element, data, layout);
    this.focusElement(newElement);
    return newElement;
  }
};