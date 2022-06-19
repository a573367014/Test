import _pick from "lodash/pick";
import _cloneDeep from "lodash/cloneDeep";
import _throttle from "lodash/throttle";
import Promise from 'bluebird';
import utils from "@gaoding/editor-framework/lib/utils/utils";
import inherit from "@gaoding/editor-framework/lib/utils/vue-inherit";
import BaseElement from "@gaoding/editor-framework/lib/base/base-element";
import { resizeElement } from "@gaoding/editor-framework/lib/utils/resize-element";
import template from "./group-element.html";
import { resetElementsByMaskInfo } from "@gaoding/editor-framework/lib/static/mask-wrap/utils";
import MaskWrap from "@gaoding/editor-framework/lib/static/mask-wrap";
export default inherit(BaseElement, {
  name: 'group-element',
  template: template,
  components: {
    MaskWrap: MaskWrap
  },
  props: ['global', 'model', 'options', 'editor'],
  data: function data() {
    return {
      resizing: false,
      widthRatio: 1,
      heightRatio: 1,
      ninePatchChild: null
    };
  },
  computed: {
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
    elements: function elements() {
      var elements = this.model.elements;
      return resetElementsByMaskInfo(elements);
    }
  },
  methods: {
    load: function load() {
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
        });
      }

      return this.loadDfd.promise;
    },
    // 子元素位置超出时 group 边界重置
    resetBounding: function resetBounding() {
      var model = this.model,
          isDesignMode = this.isDesignMode;
      var padding = model.padding,
          $inWatermark = model.$inWatermark,
          rotation = model.rotation,
          autoAdaptive = model.autoAdaptive;
      if (!isDesignMode || model.$resizeApi || $inWatermark || autoAdaptive === 0 || !model.elements.length) return;

      var getCenterVec = function getCenterVec(width, height, rotation) {
        var x = width / 2;
        var y = height / 2;
        var k1 = Math.cos(rotation);
        var k2 = Math.sin(rotation);
        return [x * k1 - y * k2, x * k2 + y * k1];
      };

      var elements = model.elements;
      var rect = utils.getBBoxByElements(elements);
      rect.width += padding[1] + padding[3];
      rect.height += padding[0] + padding[2];
      rect.left -= padding[3];
      rect.top -= padding[0];
      var left = rect.left,
          top = rect.top;
      elements.forEach(function (element) {
        // 子组件中心位置保持不变
        element.left -= left;
        element.top -= top;
      });
      var centerVec = getCenterVec(model.width, model.height, rotation);
      var centerVecNew = getCenterVec(rect.width, rect.height, rotation);
      var leftAfterRotate = left * Math.cos(rotation) - top * Math.sin(rotation);
      var topAfterRotate = left * Math.sin(rotation) + top * Math.cos(rotation);
      var centerOffset = [leftAfterRotate + centerVecNew[0] - centerVec[0], topAfterRotate + centerVecNew[1] - centerVec[1]];
      model.left += centerOffset[0] + (model.width - rect.width) / 2;
      model.width = rect.width;
      model.top += centerOffset[1] + (model.height - rect.height) / 2;
      model.height = rect.height;
    },
    resizeInit: function resizeInit(dir) {
      var model = this.model,
          $cache = this.$cache; // const notSupportScaleTypes = [];
      // const supportScaleTypes = ['image', 'mask', 'watermark', 'text', 'svg', 'three-text', 'group'];
      // 最外层 transform scale 即可

      var suportScale = !model.$parentId || this.editor.getParentLayout(model);
      $cache.children = new Map();
      this.editor.walkTemplet(function (element) {
        var cache = _pick(element, ['left', 'top', 'width', 'height', 'fontSize', 'contents', 'letterSpacing', 'strokeWidth', 'effectScale', 'radius', '$originalScale']);

        cache.padding = _cloneDeep(element.padding);

        if (element.flex) {
          cache.flex = _cloneDeep(element.flex);
        }

        if (element.$paths) {
          cache.$paths = _cloneDeep(element.$paths);
        }

        if (element.contents) {
          cache.contents = _cloneDeep(element.contents);
        }

        if (element.imageTransform) {
          cache.imageTransform = _cloneDeep(element.imageTransform);
        }

        if (element.imageEffects) {
          cache.imageEffects = _cloneDeep(element.imageEffects);
          cache.effectedResult = _cloneDeep(element.effectedResult);
        }

        if (element.shadows) {
          cache.shadows = _cloneDeep(element.shadows);
        }

        if (element.backgroundEffect && element.backgroundEffect.enable) {
          cache.backgroundEffect = _cloneDeep(element.backgroundEffect);
        }

        if (element.border && element.border.enable) {
          cache.border = _cloneDeep(element.border);
        } // 判断内部元素是否支持使用 scale 缩放
        // if(notSupportScaleTypes.includes(element.type)) {
        //     suportScale = false;
        // }
        // if(suportScale && element.elements) {
        //     this.editor.walkTemplet(elem => {
        //         if(notSupportScaleTypes.includes(elem.type)) {
        //             suportScale = false;
        //         }
        //         return !suportScale;
        //     }, true, [element]);
        // }


        $cache.children.set(element.$id, cache);
      }, true, [this.model]);
      $cache.element = {
        dir: dir,
        width: model.width,
        height: model.height,
        padding: {
          left: $cache.childrenRect.left,
          right: model.width - $cache.childrenRect.left - $cache.childrenRect.width,
          top: $cache.childrenRect.top,
          bottom: model.height - $cache.childrenRect.top - $cache.childrenRect.height
        }
      };
      this.widthRatio = 1;
      this.heightRatio = 1;

      if (dir) {
        this.resizing = dir.length > 1 && suportScale;
      }
    },
    resizeEnd: function resizeEnd() {
      delete this.$cache.children;
      delete this.$cache.element;
      this.resizing = false;
    },
    scaleGroup: function scaleGroup(widthRatio, heightRatio) {
      this.resizeInit();
      this.setSubElementsRatio(widthRatio, heightRatio);
      this.resetBounding();
      this.resizeEnd();
    },
    setSubElementsRatio: function setSubElementsRatio(widthRatio, heightRatio, dw, dh) {
      var $cache = this.$cache,
          model = this.model;
      var _this$$cache$element = this.$cache.element,
          _this$$cache$element$ = _this$$cache$element.dir,
          dir = _this$$cache$element$ === void 0 ? '' : _this$$cache$element$,
          padding = _this$$cache$element.padding;
      if (model.$resizeApi) return;
      var modifiedElements = [];
      this.editor.walkTemplet(function (element) {
        modifiedElements.push(element);
        var cache = $cache.children.get(element.$id);

        if (dir.length === 1 && model.autoGrow) {
          if (element.type === 'ninePatch') {
            element.width = cache.width + dw || 0;
            element.height = cache.height + dh || 0;
          } else {
            var paddingLeftRight = padding.left + padding.right;
            var paddingTopBottom = padding.top + padding.bottom;

            var _widthRatio = (model.width - paddingLeftRight) / ($cache.element.width - paddingLeftRight);

            var _heightRatio = (model.height - paddingTopBottom) / ($cache.element.height - paddingTopBottom);

            element.width = cache.width * _widthRatio;
            element.left = padding.left + (cache.left - padding.left) * _widthRatio;
            element.height = cache.height * _heightRatio;
            element.top = padding.top + (cache.top - padding.top) * _heightRatio;
          }
        } else if (dir.length === 2) {
          resizeElement(element, widthRatio, {
            cache: cache,
            sync: true,
            deep: false
          });
        }
      }, true, [this.model]);
      !this.resizing && this.editor.makeSnapshotByElement(this.model, false, true);
    },
    updateSubElements: function updateSubElements() {
      if (!this.isDesignMode) return;
      var model = this.model,
          $cache = this.$cache;
      var childModelsCache = $cache.children;

      if (!childModelsCache) {
        return;
      }

      var widthRatio = model.width / $cache.element.width;
      var heightRatio = model.height / $cache.element.height;
      this.setSubElementsRatio(widthRatio, heightRatio, model.width - $cache.element.width, model.height - $cache.element.height);
    },
    scaleSubElements: function scaleSubElements() {
      var model = this.model,
          resizing = this.resizing,
          $cache = this.$cache;
      var childModelsCache = $cache.children;

      if (!childModelsCache) {
        return;
      }

      if (!resizing) {
        return this.updateSubElements();
      }

      var widthRatio = model.width / $cache.element.width;
      var heightRatio = model.height / $cache.element.height;
      this.widthRatio = widthRatio;
      this.heightRatio = heightRatio;
    },
    updateChildrenCache: function updateChildrenCache() {
      var _this = this;

      if (!this.$cache) {
        this.$cache = {
          heights: {},
          widths: {}
        };
      }

      var elements = this.model.elements;
      this.$cache.childrenRect = utils.getBBoxByElements(elements.filter(function (el) {
        return el.type !== 'ninePatch';
      }));
      elements.forEach(function (el) {
        _this.$cache.heights[el.$id] = utils.getBBoxByElement(el).height;
        _this.$cache.widths[el.$id] = utils.getBBoxByElement(el).width;
      });
    },
    elementIsGroup: function elementIsGroup(element) {
      return this.editor.isGroup(element);
    }
  },
  events: {
    // load
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
    // rect
    'element.rectUpdate': function elementRectUpdate(currModel, delta, isCheckCross) {
      var _this2 = this;

      if (delta === void 0) {
        delta = {
          width: 0,
          height: 0,
          align: 'left'
        };
      }

      if (isCheckCross === void 0) {
        isCheckCross = true;
      }

      if (!this.isDesignMode) return;
      if (this.editor.global.$draging) return;
      if (this.model.elements.indexOf(currModel) === -1) return;
      var model = this.model,
          $cache = this.$cache;
      var elements = model.elements,
          autoGrow = model.autoGrow; // 组内元素排版行为
      // 当子元素高度变化时，其他top值 < 其bottom的元素 top += difference

      {
        var bboxs = elements.map(function (el) {
          return Object.assign({
            $id: el.$id,
            type: el.type
          }, utils.getBBoxByElement(el));
        }); // 0.1为了避免计算小数点精度问题

        var modifyedBBoxs = bboxs.filter(function (bbox) {
          return Math.abs(bbox.height - $cache.heights[bbox.$id]) > 0.1 || Math.abs(bbox.width - $cache.widths[bbox.$id]) > 0.1;
        }); // 过滤非常规操作

        if (modifyedBBoxs.length === 1) {
          {
            var modifyedBBox = modifyedBBoxs[0];
            var preHeight = $cache.heights[modifyedBBox.$id];
            var difference = modifyedBBox.height - preHeight; // 与其他bbox存在水平相交

            var isCross = bboxs.some(function (bbox) {
              return bbox !== modifyedBBox && bbox.type !== 'ninePatch' && modifyedBBox.top < bbox.top + bbox.height && modifyedBBox.top + preHeight > bbox.top;
            });
            (!isCross || !isCheckCross) && bboxs.forEach(function (bbox, i) {
              if (modifyedBBox.top < bbox.top) {
                elements[i].top += difference;
              }
            });
          }
          {
            var _modifyedBBox = modifyedBBoxs[0];
            var preWidth = $cache.widths[_modifyedBBox.$id];

            var _difference = _modifyedBBox.width - preWidth; // 处理文字自增, 位移与对齐方向 同步


            if (Math.abs(_difference) > 0.1) {
              if (currModel.autoAdaptive & 2) {
                if (delta.align === 'right') currModel.left -= _difference;
                if (delta.align === 'center') currModel.left -= _difference / 2;
              }
            } // 与其他bbox存在垂直相交


            var _isCross = bboxs.some(function (bbox) {
              return bbox !== _modifyedBBox && bbox.type !== 'ninePatch' && _modifyedBBox.left < bbox.left + bbox.width && _modifyedBBox.left + preWidth > bbox.left;
            });

            var differenceMap = {
              left: {
                offsetRight: _difference,
                offsetLeft: 0
              },
              center: {
                offsetRight: _difference / 2,
                offsetLeft: _difference / 2 * -1
              },
              right: {
                offsetRight: 0,
                offsetLeft: _difference * -1
              }
            };
            var differenceItem = differenceMap[delta.align] || differenceMap.left;
            (!_isCross || !isCheckCross) && bboxs.forEach(function (bbox, i) {
              // 整体向右移动
              if (_modifyedBBox.left < bbox.left) {
                elements[i].left += differenceItem.offsetRight;
              } // 整体向左移动


              if (_modifyedBBox.left > bbox.left) {
                elements[i].left += differenceItem.offsetLeft;
              }
            });
          }
        }

        var childrenRect = $cache.childrenRect;

        if (childrenRect) {
          this.updateChildrenCache();
          delta.height = $cache.childrenRect.height - childrenRect.height;
          delta.width = $cache.childrenRect.width - childrenRect.width;
        }

        model.$parentId && this.$nextTick(function () {
          return _this2.$events.$emit('element.rectUpdate', model, delta);
        });
      }
      var ninePatchChild = this.ninePatchChild; // 仅对不处于缩放中的自增文本框组生效

      if (!autoGrow || !ninePatchChild) {
        this.resetBounding();
        return;
      }

      ninePatchChild.width += delta.width;
      ninePatchChild.height += delta.height;
      this.resetBounding();
      this.updateChildrenCache();
    },
    'group.boundingReset': function groupBoundingReset(model) {
      if (model === this.model) {
        this.resetBounding();
      }
    },
    'group.contentScale': function groupContentScale(model, ratio) {
      if (model === this.model) {
        this.scaleGroup(ratio, ratio);
      }
    },
    // resize
    'element.transformStart': function elementTransformStart(model, data) {
      if (model !== this.model) {
        return;
      }

      this.resizeInit(data.dir);
    },
    'element.transformEnd': function elementTransformEnd(model) {
      this.updateSubElements();
      this.resizeEnd();
      this.updateChildrenCache();

      if (model === this.model) {
        this.resetBounding();
      }
    }
  },
  watch: {
    'model.width': function modelWidth(newVal, oldVal) {
      if (!this.isDesignMode) return; // 频繁 resize 时可能因为小数点精度，无限循环卡死程序
      // 567.4430728881341 -> 567.4430728881342 ->567.4430728881341 ...

      if (Math.abs(newVal - oldVal) > 0.1) {
        this.resizing ? this.scaleSubElements() : this._lazyScaleSubElements();
      }
    },
    'model.height': function modelHeight(newVal, oldVal) {
      if (!this.isDesignMode) return;

      if (Math.abs(newVal - oldVal) > 0.1) {
        this.resizing ? this.scaleSubElements() : this._lazyScaleSubElements();
      }
    },
    'model.padding': {
      handler: function handler() {
        if (this.editor.global.$draging || !this.isDesignMode) return;
        this.resetBounding();
      },
      deep: true
    },
    'model.elements': function modelElements() {
      if (this.editor.global.$draging || !this.isDesignMode) return;
      this.resetBounding();
    }
  },
  created: function created() {
    var _this3 = this;

    // 缓存子元素高度
    this.updateChildrenCache();
    this._lazyScaleSubElements = _throttle(this.scaleSubElements, 1000 / 60);
    var minWidth = 10;
    var minHeight = 10;

    this.model.$getResizeLimit = function () {
      _this3.editor.walkTemplet(function (element) {
        if (element.$getResizeLimit) {
          var limit = element.$getResizeLimit();
          minWidth = Math.max(limit.minWidth, minWidth);
          minHeight = Math.max(limit.minHeight, minHeight);
        }
      }, true, [_this3.model]);

      return {
        maxWidth: Infinity,
        minWidth: minWidth,
        maxHeight: Infinity,
        minHeight: minHeight
      };
    };

    this.$watch(function () {
      if (_this3.editor.global.$draging || !_this3.isDesignMode) return;
      var elements = _this3.model.elements;
      var hasHr, hasVr;
      var ninePatchChild = elements.find(function (el) {
        return el.type === 'ninePatch' && el.width * el.height / (_this3.model.width * _this3.model.height) > 0.95;
      });
      _this3.ninePatchChild = ninePatchChild;
      ninePatchChild && elements.forEach(function (el) {
        if (el.type === 'text' && (el.writingMode === undefined || el.writingMode === 'horizontal-tb')) {
          hasHr = true;
        } else if (el.writingMode === 'vertical-rl') {
          hasVr = true;
        }
      });

      if (hasVr && hasHr) {
        return 7;
      } else if (hasVr) {
        return 3;
      } else if (hasHr) {
        return 5;
      }
    }, function (resize) {
      if (_this3.editor.global.$draging || !_this3.isDesignMode) return;

      if (!resize) {
        _this3.model.resize = 1;
        _this3.model.autoGrow = false;
        return;
      }

      _this3.model.resize = resize;
      _this3.model.autoGrow = true;
    }, {
      immediate: true
    });
  },
  mounted: function mounted() {
    this.$nextTick(this.updateChildrenCache);
  }
});