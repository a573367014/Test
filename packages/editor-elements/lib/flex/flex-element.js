import throttle from 'lodash/throttle';
import pick from 'lodash/pick';
import cloneDeep from 'lodash/cloneDeep';
import inherit from "@gaoding/editor-framework/lib/utils/vue-inherit";
import BaseElement from "@gaoding/editor-framework/lib/base/base-element";
import EditorDefaults from "@gaoding/editor-framework/lib/base/editor-defaults";
import { FlexShadow } from "./flex-shadow";
import template from "./flex-element.html";
import { resizeElement } from "@gaoding/editor-framework/lib/utils/resize-element";
export default inherit(BaseElement, {
  name: 'flex-element',
  template: template,
  data: function data() {
    return {
      resizing: false,
      widthRatio: 1,
      heightRatio: 1,
      $innerUpdate: false
    };
  },
  computed: {
    shadowRoot: function shadowRoot() {
      var _this$model = this.model,
          autoAdaptive = _this$model.autoAdaptive,
          flexDirection = _this$model.flexDirection,
          justifyContent = _this$model.justifyContent,
          alignItems = _this$model.alignItems,
          alignContent = _this$model.alignContent,
          flexWrap = _this$model.flexWrap,
          width = _this$model.width,
          height = _this$model.height,
          padding = _this$model.padding;
      return {
        autoAdaptive: autoAdaptive,
        flexDirection: flexDirection,
        justifyContent: justifyContent,
        alignItems: alignItems,
        alignContent: alignContent,
        flexWrap: flexWrap,
        width: width,
        height: height,
        padding: padding
      };
    },
    shadowModels: function shadowModels() {
      var elements = this.model.elements;
      return elements.map(function (element) {
        var _element$flex = element.flex,
            flex = _element$flex === void 0 ? EditorDefaults.flex : _element$flex,
            width = element.width,
            height = element.height,
            type = element.type,
            $id = element.$id,
            hidden = element.hidden;

        var _ref = flex || {},
            alignSelf = _ref.alignSelf,
            flexGrow = _ref.flexGrow,
            flexShrink = _ref.flexShrink,
            flexBasis = _ref.flexBasis,
            margin = _ref.margin;

        return {
          $id: $id,
          width: width,
          height: height,
          type: type,
          alignSelf: alignSelf,
          flexGrow: flexGrow,
          flexShrink: flexShrink,
          flexBasis: flexBasis,
          margin: margin,
          hidden: hidden
        };
      });
    },
    calcMargin: function calcMargin() {
      var visibleElements = this.visibleElements,
          model = this.model;
      var width = model.width,
          height = model.height;
      var length = visibleElements.length;
      var subWidthSum = 0;
      var subHeightSum = 0;
      visibleElements.forEach(function (element) {
        var width = element.width,
            height = element.height;
        subWidthSum += width;
        subHeightSum += height;
      });
      var rowMargin = (width - subWidthSum) / (length - 1);
      var columnMargin = (height - subHeightSum) / (length - 1);
      if (this.isRow && rowMargin < 0 || !this.isRow && columnMargin < 0) return [0, 0, 0, 0];
      return this.isRow ? [0, rowMargin, 0, 0] : [0, 0, columnMargin, 0];
    },
    isRow: function isRow() {
      return this.model.flexDirection === 'row';
    },
    scaleStyle: function scaleStyle() {
      var resizing = this.resizing,
          widthRatio = this.widthRatio,
          heightRatio = this.heightRatio;

      if (resizing) {
        return {
          transform: "scale(" + widthRatio + ", " + heightRatio + ")",
          transformOrigin: 'left top'
        };
      }

      return {};
    },
    visibleElements: function visibleElements() {
      var elements = this.model.elements;
      return elements.filter(function (element) {
        return !element.hidden;
      });
    }
  },
  methods: {
    load: function load() {
      var _this = this;

      var model = this.model;

      if (!this.loadDfd) {
        var loadDfd = this.loadDfd = {
          loadCount: 0,
          check: function check(element) {
            if (model.elements.includes(element)) {
              loadDfd.loadCount += 1;
            }

            if (loadDfd.loadCount >= model.elements.length) {
              loadDfd.resolve();
            }
          }
        };
        loadDfd.promise = new Promise(function (resolve, reject) {
          loadDfd.resolve = resolve;
          loadDfd.reject = reject; // 无子元素

          if (!model.elements.length) {
            resolve();
          }
        }).then(function () {
          return _this.syncRect();
        });
      }

      return this.loadDfd.promise;
    },
    resizeInit: function resizeInit(data) {
      var _this2 = this;

      var dir = data.dir;

      if (['sw', 'nw', 'ne', 'se'].includes(dir)) {
        this.resizing = true;
        this.$childModelsCache = new Map();
        this.editor.walkTemplet(function (element) {
          var cache = pick(element, ['left', 'top', 'width', 'height', 'fontSize', 'contents', 'letterSpacing', 'strokeWidth', 'effectScale', 'radius', '$originalScale']);
          cache.padding = cloneDeep(element.padding);
          cache.flex = cloneDeep(element.flex);

          if (element.$paths) {
            cache.$paths = cloneDeep(element.$paths);
          }

          if (element.contents) {
            cache.contents = cloneDeep(element.contents);
          }

          if (element.imageTransform) {
            cache.imageTransform = cloneDeep(element.imageTransform);
          }

          if (element.imageEffects) {
            cache.imageEffects = cloneDeep(element.imageEffects);
            cache.effectedResult = cloneDeep(element.effectedResult);
          }

          if (element.shadows) {
            cache.shadows = cloneDeep(element.shadows);
          }

          if (element.backgroundEffect && element.backgroundEffect.enable) {
            cache.backgroundEffect = cloneDeep(element.backgroundEffect);
          }

          if (element.border && element.border.enable) {
            cache.border = cloneDeep(element.border);
          }

          _this2.$childModelsCache.set(element.$id, cache);
        }, true, [this.model]);
        this.$elementCache = {
          dir: dir,
          width: this.model.width,
          height: this.model.height
        };
        this.widthRatio = 1;
        this.heightRatio = 1;
      }
    },
    resize: function resize() {
      if (this.resizing) {
        this.updateSubElements();
      }
    },
    resizeEnd: function resizeEnd() {
      this.resizing = false;
      this.updateSubElements();
      delete this.$childModelsCache;
      delete this.$elementCache;
    },
    setSubElementsRatio: function setSubElementsRatio(widthRatio) {
      var $childModelsCache = this.$childModelsCache,
          model = this.model;
      var _this$$elementCache$d = this.$elementCache.dir,
          dir = _this$$elementCache$d === void 0 ? '' : _this$$elementCache$d;
      this.editor.walkTemplet(function (element) {
        var cache = $childModelsCache.get(element.$id);
        if (!cache) return;

        if (dir.length === 2) {
          resizeElement(element, widthRatio, {
            cache: cache,
            sync: true,
            deep: false
          });
        }
      }, true, [model]);
      !this.resizing && this.editor.makeSnapshotByElement(this.model, false, true);
    },
    updateSubElements: function updateSubElements() {
      var model = this.model;
      var childModelsCache = this.$childModelsCache;

      if (!childModelsCache) {
        return;
      }

      var widthRatio = model.width / this.$elementCache.width;
      var heightRatio = model.height / this.$elementCache.height; // this.widthRatio = widthRatio;
      // this.heightRatio = heightRatio;

      this.setSubElementsRatio(widthRatio, heightRatio, model.width - this.$elementCache.width, model.height - this.$elementCache.height);
    },
    elementIsGroup: function elementIsGroup(element) {
      return this.editor.isGroup(element);
    },
    syncMargin: function syncMargin() {
      if (!this.model.autoAdaptive) return;
      var margin = this.calcMargin;
      var elements = this.model.elements;
      var modelMargin = elements[0].flex.margin;
      var length = elements.length;
      var isSynced = this.isRow ? modelMargin[1] === margin[1] : modelMargin[2] === margin[2];
      if (isSynced) return;
      elements.forEach(function (element, index) {
        if (index === length - 1) {
          element.flex.margin = [0, 0, 0, 0];
          return;
        }

        element.flex.margin = [].concat(margin);
      });
    },
    resetBounding: function resetBounding(width, height) {
      var getCenterVec = function getCenterVec(width, height, rotation) {
        var x = width / 2;
        var y = height / 2;
        var k1 = Math.cos(rotation);
        var k2 = Math.sin(rotation);
        return [x * k1 - y * k2, x * k2 + y * k1];
      };

      var model = this.model;
      var rotation = model.rotation;
      var left = 0;
      var top = 0;
      var centerVec = getCenterVec(model.width, model.height, rotation);
      var centerVecNew = getCenterVec(width, height, rotation);
      var leftAfterRotate = left * Math.cos(rotation) - top * Math.sin(rotation);
      var topAfterRotate = left * Math.sin(rotation) + top * Math.cos(rotation); // model.elements.forEach(element => {
      //     // 子组件中心位置保持不变
      //     element.left -= left;
      //     element.top -= top;
      // });

      var centerOffset = [leftAfterRotate + centerVecNew[0] - centerVec[0], topAfterRotate + centerVecNew[1] - centerVec[1]];
      model.left += centerOffset[0] + (model.width - width) / 2;
      model.top += centerOffset[1] + (model.height - height) / 2;
      model.width = width;
      model.height = height;
    },
    calculateLayout: function calculateLayout(delta) {
      var _this3 = this;

      // $disabledCalc 控制 flex 是否计算布局
      if (!this.isDesignMode || this.model.$disabledCalc) {
        return;
      }

      var shadowModels = this.shadowModels,
          shadowRoot = this.shadowRoot,
          autoAdaptive = this.autoAdaptive;
      var alignItems = this.model.alignItems;

      if (delta) {
        var _width = delta.width,
            _height = delta.height;

        if ((autoAdaptive & 2) !== 0 && _width !== 0) {
          shadowRoot.width += _width;
        }

        if ((autoAdaptive & 1) !== 0 && _height !== 0) {
          shadowRoot.height += _height;
        }
      }

      this.shadow.setRoot(shadowRoot);
      this.shadow.setNodes(shadowModels);
      var _this$model2 = this.model,
          width = _this$model2.width,
          height = _this$model2.height,
          elements = _this$model2.elements;
      var shadowContainer = this.shadow.getRootSize();
      if (shadowContainer.width === 0 || shadowContainer.height === 0) return;
      elements.forEach(function (element) {
        var $id = element.$id,
            autoAdaptive = element.autoAdaptive,
            fontSize = element.fontSize,
            type = element.type;

        var shadowElement = _this3.shadow.getNodeSize($id);

        var left = shadowElement.left,
            top = shadowElement.top,
            width = shadowElement.width,
            height = shadowElement.height;
        element.left = left;
        element.top = top; // 修正收缩时文字溢出;

        if ((autoAdaptive & 2) === 0 && width !== 0) {
          if (type === 'text' && width < fontSize) width = fontSize;
          element.width = width;
        }

        if ((autoAdaptive & 1) === 0 && height !== 0) {
          if (type === 'text' && height < fontSize) height = fontSize;
          element.height = height;
        }

        _this3.$events.$emit('element.syncRect', element);
      });

      if (Math.abs(width - shadowContainer.width) > 0.1 || Math.abs(height - shadowContainer.height) > 0.1) {
        this.resetBounding(shadowContainer.width, shadowContainer.height);
        this.$innerUpdate = true;
        this.$events.$emit('element.rectUpdate', this.model, {
          width: this.model.width - width,
          height: this.model.height - height
        });
      } // 文字宽高自增时，文字自增的宽高偏移方向 和 flex组元素对齐方向 同步


      if (delta) {
        var offsetNum = this.isRow ? this.model.height - height : this.model.width - width;
        if (alignItems === 'center' && offsetNum !== 0) this.model[this.isRow ? 'top' : 'left'] -= offsetNum / 2;
        if (alignItems === 'flex-end' && offsetNum !== 0) this.model[this.isRow ? 'top' : 'left'] -= offsetNum;
      }
    },
    lazyCalculateLayout: function lazyCalculateLayout() {
      var _this4 = this;

      if (!this._lazyCalculateLayout) {
        this._lazyCalculateLayout = throttle(function () {
          _this4.calculateLayout();
        }, 50, {
          leading: false,
          trailing: true
        });
      }

      this._lazyCalculateLayout();
    },
    syncRect: function syncRect() {
      this.calculateLayout();
    }
  },
  events: {
    'element.loaded': function elementLoaded(model) {
      if (this.loadDfd) {
        this.loadDfd.check(model);
      }
    },
    'element.loadError': function elementLoadError(ex, model) {
      if (this.loadDfd) {
        this.loadDfd.check(model);
      }

      return true;
    },
    'element.rectUpdate': function elementRectUpdate(currModel, delta) {
      if (delta === void 0) {
        delta = {
          width: 0,
          height: 0
        };
      }

      var model = this.model,
          resizing = this.resizing;
      var elements = model.elements;
      if (resizing) return;

      if (elements.indexOf(currModel) >= 0) {
        this.calculateLayout(delta);
      }
    },
    'group.contentScale': function groupContentScale(model, ratio) {
      if (model === this.model) {
        this.scaleGroup(ratio, ratio);
      }
    },
    'element.transformStart': function elementTransformStart(model, data) {
      this.transforming = true;

      if (model !== this.model) {
        return;
      }

      this.resizeInit(data);
    },
    'element.transformResize': function elementTransformResize(drag, model) {
      if (model !== this.model) {
        return;
      }

      if (['se', 'ne', 'sw', 'nw'].includes(drag.dir)) {
        this.widthRatio = model.width / this.$elementCache.width;
        this.heightRatio = model.height / this.$elementCache.height;
        return;
      } // 布局前，先将 间距 同步到 flex-margin


      this.syncMargin();
      this.lazyCalculateLayout();
      this.resize(drag);
    },
    'element.transformEnd': function elementTransformEnd(model) {
      if (model !== this.model) {
        return;
      }

      this.transforming = false;
      this.resizeEnd(); // 布局前，先将 间距 同步到 flex-margin

      this.syncMargin();
      this.lazyCalculateLayout();
    }
  },
  mounted: function mounted() {
    this.shadow = new FlexShadow(this.$refs.shadowContainer);

    this.model.$getResizeLimit = function () {
      return {
        maxWidth: Infinity,
        minWidth: 20,
        maxHeight: Infinity,
        minHeight: 20
      };
    };

    this.$watch(function () {
      return [this.shadowRoot, this.shadowModels];
    }, function () {
      if (!this.editor.global.$draging) {
        this.calculateLayout();
      }
    });
  }
});