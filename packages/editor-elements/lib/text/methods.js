import _extends from "@babel/runtime/helpers/extends";
import _isString from "lodash/isString";
import _merge from "lodash/merge";
import _assign from "lodash/assign";

/**
 * @class EditorTextElementMixin
 * @description 元素的专属方法
 */
import $ from "@gaoding/editor-utils/lib/zepto";
import editorDefaults from "@gaoding/editor-framework/lib/base/editor-defaults";
import { commandValueMap } from "@gaoding/editor-framework/lib/utils/rich-text/config";
import { serialize } from "@gaoding/editor-framework/lib/utils/utils";
import { isGroup } from "@gaoding/editor-utils/lib/element"; // 四舍五入保留小数点后 2 位

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
  addText: function addText(text, options, layout) {
    var data = _assign({
      type: 'text',
      fontSize: 16,
      fontFamily: 'Simsun',
      content: text,
      lineHeight: 1.2
    }, options);

    this.calculateBox(data);
    return this.addElement(data, layout);
  },

  /**
   * 预测文本元素宽高
   * @memberof EditorTextElementMixin
   * @param {Object} data - 创建文本元素所需的数据
   */
  calculateBox: function calculateBox(data) {
    if (!data.width) {
      var widthOffset = 10;
      var heightOffset = 10;
      var panel = this.$el;
      var span = document.createElement('span');
      var cssText = 'position:absolute;left:0;top:-100px;';
      cssText += "max-width:" + this.width + "px;";
      cssText += "line-height:" + (data.lineHeight || 'normal') + ";";
      cssText += "font-size:" + data.fontSize + "px;";
      cssText += "letter-spacing:" + (data.letterSpacing || 0) + "px;";

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
  changeTextContents: function changeTextContents(props, element, makeSnapshot) {
    var _this = this;

    if (makeSnapshot === void 0) {
      makeSnapshot = true;
    }

    element = this.getElement(element);
    var richText = this.currentRichText;
    if (!['text', 'effectText'].includes(element.type)) return;

    if (!element.$editing) {
      // 还未进入编辑状态时, 数据控制contents更新
      element.contents = serialize.injectStyleProps(element.contents, props);
      var newContents = [];

      if (_isString(props.listStyle) && props.listStyle !== '') {
        element.contents.forEach(function (item) {
          var content = item.content.replace(/(\r?\n|\r)/gm, '__BR__');
          var strs = content.split('__BR__');
          delete item.beginParentTag;
          delete item.closeParentTag;
          newContents = newContents.concat(strs.filter(function (str) {
            return !!str;
          }).map(function (str) {
            return _extends({}, item, {
              content: str,
              beginParentTag: 'li',
              closeParentTag: 'li'
            });
          }));
        });
        element.contents = serialize.mergeChild(newContents);
      } else if (_isString(props.listStyle)) {
        newContents = element.contents.filter(function (item) {
          return !!item.content;
        });
        newContents = newContents.map(function (item, i) {
          var brakValid = /(\r?\n|\r)$/.test(item.content);

          if (item.closeParentTag && i !== newContents.length - 1 && !brakValid) {
            item.content += '\n';
          }

          delete item.beginParentTag;
          delete item.closeParentTag;
          return _extends({}, item);
        });
        element.contents = serialize.mergeChild(newContents);
      }

      _merge(element, props);

      var action = {
        tag: 'change_element',
        elements: [element],
        props: _extends({}, props, {
          contents: element.contents
        })
      };
      makeSnapshot && this.makeSnapshot(action);
    } else if (richText) {
      // 进入编辑状态时, 命令控制contents更新
      var data = this.currentSelection;
      Object.keys(props).forEach(function (name) {
        var value = props[name];
        var fontsMap = _this.options.fontsMap;

        if (name === 'listStyle' && value) {
          richText.cmd.do('insertList');
        }

        if (!data || data[name] && data[name] !== value) {
          // name 若是包含 ”.“ 这种非法字符 document.execCommand 无法执行
          // 此时需回退 family
          if (name === 'fontFamily' && value.includes('.') && fontsMap[value] && fontsMap[value].family) {
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
  toggleBold: function toggleBold(element) {
    if (element === void 0) {
      element = this.currentSubElement || this.currentElement;
    }

    var model = this.currentSelection || element;
    this.changeTextContents({
      fontWeight: +model.fontWeight === 700 ? 400 : 700
    }, element);
  },

  /**
   * 文字元素斜体切换
   * @memberof EditorTextElementMixin
   * @param {textElement} element - 文字元素
   */
  toggleItalic: function toggleItalic(element) {
    if (element === void 0) {
      element = this.currentSubElement || this.currentElement;
    }

    var model = this.currentSelection || element;
    this.changeTextContents({
      fontStyle: model.fontStyle === 'italic' ? 'normal' : 'italic'
    }, element);
  },

  /**
   * 文字元素下划线切换
   * @memberof EditorTextElementMixin
   * @param {textElement} element - 文字元素
   */
  toggleUnderline: function toggleUnderline(element) {
    if (element === void 0) {
      element = this.currentSubElement || this.currentElement;
    }

    var model = this.currentSelection || element;
    var value = model.textDecoration === 'underline' ? 'none' : 'underline';
    this.changeTextContents({
      textDecoration: value
    }, element);
  },

  /**
   * 文字元素删除线切换
   * @memberof EditorTextElementMixin
   * @param {textElement} element - 文字元素
   */
  toggleThrough: function toggleThrough(element) {
    if (element === void 0) {
      element = this.currentSubElement || this.currentElement;
    }

    var model = this.currentSelection || element;
    var value = model.textDecoration === 'line-through' ? 'none' : 'line-through';
    this.changeTextContents({
      textDecoration: value
    }, element);
  },

  /**
   * 设置文字元素字体
   * @memberof EditorTextElementMixin
   * @param {String} value - 字体名称
   * @param {textElement} element - 文字元素
   */
  setFontFamily: function setFontFamily(value, element) {
    if (element === void 0) {
      element = this.currentSubElement || this.currentElement;
    }

    this.changeTextContents({
      fontFamily: value
    }, element);
  },

  /**
   * 设置文字元素字号
   * @memberof EditorTextElementMixin
   * @param {String} value - 字号大小
   * @param {textElement} element - 文字元素
   */
  setFontSize: function setFontSize(value, element) {
    if (element === void 0) {
      element = this.currentSubElement || this.currentElement;
    }

    this.changeTextContents({
      fontSize: value
    }, element);
  },

  /**
   * 设置文字元素颜色
   * @memberof EditorTextElementMixin
   * @param {String} value - 文字颜色
   * @param {textElement} element - 文字元素
   */
  setColor: function setColor(value, element) {
    if (element === void 0) {
      element = this.currentSubElement || this.currentElement;
    }

    this.changeTextContents({
      color: value
    }, element);
  },
  updateCurrentSelection: function updateCurrentSelection() {
    var _this2 = this;

    var textSelectionKeys = Object.keys(commandValueMap); // 这些值可能为null

    var textDefaultValue = {
      fontWeight: 400,
      fontStyle: 'normal',
      textDecoration: 'none'
    }; // 设置text默认值

    var textSelection = {};
    textSelectionKeys.forEach(function (key) {
      textSelection[key] = null;
    }); // 判断是否混合多种属性

    textSelectionKeys.forEach(function (key) {
      textSelection[key + 'Mixed'] = false;
    });

    var clearSelectionWatch = function clearSelectionWatch() {}; // 比较所有contents，判断是否混合


    var diffContentsProps = function diffContentsProps(elements) {
      var result = {};
      var contents = [];
      elements.forEach(function (element) {
        var child = element.contents.filter(function (item) {
          var rBreakLine = /<br>|\r|\n/g;
          if (!item.content || !item.content.replace(rBreakLine, '')) return false;
          return true;
        }).map(function (item) {
          return _extends({}, item, {
            element: element
          });
        });
        contents = contents.concat(child);
      });
      contents.length > 1 && contents.reduce(function (a, b) {
        textSelectionKeys.forEach(function (key) {
          var aValue = a[key] || a.element[key] || textDefaultValue[key];
          var bValue = b[key] || b.element[key] || textDefaultValue[key];

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

    var getElementSelection = function getElementSelection(element) {
      var props = {};
      textSelectionKeys.forEach(function (key) {
        props[key] = element[key] || textDefaultValue[key];
      });
      props.fontSize = round(props.fontSize);
      return props;
    };

    this.$watch(function () {
      var result = null;
      var currentElement = _this2.currentElement,
          currentSubElement = _this2.currentSubElement,
          selectedElements = _this2.selectedElements;
      var elements = selectedElements || [];
      currentElement = currentSubElement || currentElement; // 单选文本不是编辑状态

      if (currentElement && /text/i.test(currentElement.type) && !currentElement.$editing) {
        result = _extends({}, diffContentsProps([currentElement]), getElementSelection(currentElement));
      } // 单选组元素


      if (isGroup(currentElement)) {
        elements = [];

        _this2.walkTemplet(function (element) {
          elements.push(element);
        }, true, [currentElement]);
      } // 多选取selector.elements为准
      else if (elements.length > 1 && currentElement && currentElement.type === '$selector') {
        elements = currentElement.elements || [];
        elements = elements.reduce(function (a, b) {
          return a.concat(b.elements || b);
        }, []);
      } else if (elements.length > 1) {
        elements = [];
      }

      elements = elements.filter(function (element) {
        return /text/i.test(element.type);
      });

      if (elements.length) {
        result = _extends({}, diffContentsProps(elements), getElementSelection(elements[0]));
      }

      return {
        result: result,
        length: elements.length,
        currentElement: currentElement
      };
    }, function (_ref) {
      var result = _ref.result,
          currentElement = _ref.currentElement;

      if (result) {
        _this2.currentTextSelection = Object.assign({}, textSelection, result);
      } else if (!currentElement || !/text/i.test(currentElement.type)) {
        _this2.currentTextSelection = null;
      }
    }); // 单选文本 && 编辑状态

    this.$watch('currentRichText', function (richText) {
      var currentElement = _this2.currentElement,
          currentSubElement = _this2.currentSubElement;
      currentElement = currentSubElement || currentElement;
      clearSelectionWatch();

      if (!currentElement || !richText) {
        return;
      }

      var callback = function callback() {
        var currentElement = _this2.currentElement,
            currentSubElement = _this2.currentSubElement;
        currentElement = currentSubElement || currentElement;
        if (!currentElement.$editing) return;
        var props = {};
        textSelectionKeys.forEach(function (key) {
          var val = richText.cmd.queryCommandValue(key);
          props[key] = commandValueMap[key](val) || currentElement[key];
        });
        props.fontSize = round(props.fontSize);
        _this2.currentTextSelection = Object.assign({}, textSelection, props); // 选区是否混合状态

        var range = richText.selection._currentRange;
        if (!range) return; // 纯文本不存在混合状态

        var selectedNodes = $('<div></div>').append(range.cloneContents());
        if (!selectedNodes.children().length) return;
        var contents = serialize.fromJSON(selectedNodes.html());
        if (!contents || contents.length < 2) return;
        var result = diffContentsProps([_extends({}, currentElement, {
          contents: contents
        })]);
        Object.assign(_this2.currentTextSelection, result);
      }; // 监听selection


      richText.on('change', callback);
      richText.selection.on('change', callback); // 缓存事件删除句柄

      clearSelectionWatch = function clearSelectionWatch() {
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
  showTextEditor: function showTextEditor(element) {
    element.$editing = true;
  }
};