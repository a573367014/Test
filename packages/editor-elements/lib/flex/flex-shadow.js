var DEBUG = false;
/**
 * 设置 flex dom 容器的样式
 * @param { Element } flexModel - flex 元素
 * @param { HTMLElement } element - dom 元素
 */

function setFlexStyleToElement(flexModel, element) {
  var autoAdaptive = flexModel.autoAdaptive,
      flexDirection = flexModel.flexDirection,
      justifyContent = flexModel.justifyContent,
      alignItems = flexModel.alignItems,
      alignContent = flexModel.alignContent,
      flexWrap = flexModel.flexWrap,
      width = flexModel.width,
      height = flexModel.height,
      padding = flexModel.padding;
  var style = element.style;
  style.position = 'absolute';
  style.visibility = DEBUG ? '' : 'hidden';
  style.pointerEvents = 'none';
  style.left = 0;
  style.top = 0;
  style.zIndex = -100;
  style.display = autoAdaptive === 0 ? 'flex' : 'inline-flex';
  style.width = autoAdaptive & 2 ? '' : width + "px";
  style.height = autoAdaptive & 1 ? '' : height + "px";
  style.flexDirection = flexDirection;
  style.justifyContent = justifyContent;
  style.alignItems = alignItems;
  style.alignContent = alignContent;
  style.flexWrap = flexWrap;
  style.padding = padding.map(function (padding) {
    return padding + "px";
  }).join(' ');
  style.boxSizing = 'border-box';
}
/**
 * 设置 flex dom 容器的样式
 * @param { Element } nodeModel - node 元素
 * @param { HTMLElement } element - dom 元素
 */


function setNodeStyleToElement(nodeModel, element) {
  var width = nodeModel.width,
      height = nodeModel.height,
      type = nodeModel.type,
      alignSelf = nodeModel.alignSelf,
      flexGrow = nodeModel.flexGrow,
      flexShrink = nodeModel.flexShrink,
      flexBasis = nodeModel.flexBasis,
      margin = nodeModel.margin,
      hidden = nodeModel.hidden;
  var style = element.style;
  style.width = width + "px";
  style.height = height + "px";
  style.alignSelf = alignSelf;
  style.flexGrow = flexGrow;
  style.flexShrink = type === 'text' ? 1 : flexShrink;
  style.flexBasis = flexBasis < 0 ? 'auto' : flexBasis;
  style.margin = margin ? margin.map(function (margin) {
    return margin + "px";
  }).join(' ') : '';
  style.display = hidden ? 'none' : '';

  if (DEBUG) {
    style.background = 'green';
  }
}

export var FlexShadow = /*#__PURE__*/function () {
  /**
   * @param { HTMLElement } container - 承载 shadow 组件的 dom 容器
   */
  function FlexShadow(container) {
    /**
     * @type { Map<String, HTMLElement>}
     */
    this.map = new Map();
    this.container = container;
    this.root = document.createElement('div');
    container.appendChild(this.root);
  }

  var _proto = FlexShadow.prototype;

  _proto.destory = function destory() {
    this.map = null;
    this.container = null;
    this.root = null;
  }
  /**
   * 设置根节点
   * @param { Element } model - 根结点
   */
  ;

  _proto.setRoot = function setRoot(model) {
    setFlexStyleToElement(model, this.root);
  }
  /**
   * 设置子节点
   * @param { Array<Element> } models - 子节点数组
   */
  ;

  _proto.setNodes = function setNodes(models) {
    var _this = this;

    var ids = {};
    models.forEach(function (model) {
      var $id = model.$id;

      if (!_this.map.has($id)) {
        var element = document.createElement('div');

        _this.root.appendChild(element);

        _this.map.set($id, element);
      }

      var domElement = _this.map.get($id);

      ids[$id] = true;
      setNodeStyleToElement(model, domElement);
    });
    Array.from(this.map.keys()).forEach(function (key) {
      if (!ids[key]) {
        var element = _this.map.get(key);

        element.remove();

        _this.map.delete(key);
      }
    });
  };

  _proto.getRootSize = function getRootSize() {
    var _this$root = this.root,
        offsetWidth = _this$root.offsetWidth,
        offsetHeight = _this$root.offsetHeight;
    return {
      width: offsetWidth,
      height: offsetHeight
    };
  };

  _proto.getNodeSize = function getNodeSize(id) {
    var element = this.map.get(id);

    if (!element) {
      throw new Error('flex shadow element is not exist!');
    }

    var offsetLeft = element.offsetLeft,
        offsetTop = element.offsetTop,
        offsetWidth = element.offsetWidth,
        offsetHeight = element.offsetHeight;
    return {
      left: offsetLeft,
      top: offsetTop,
      width: offsetWidth,
      height: offsetHeight
    };
  };

  return FlexShadow;
}();