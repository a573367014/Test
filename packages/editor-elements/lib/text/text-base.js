import _pick from "lodash/pick";
import _cloneDeep from "lodash/cloneDeep";
import _uniq from "lodash/uniq";
import Promise from 'bluebird';
import tinycolor from 'tinycolor2';
import loader from "@gaoding/editor-utils/lib/loader";
import inherit from "@gaoding/editor-framework/lib/utils/vue-inherit";
import utils, { serialize } from "@gaoding/editor-framework/lib/utils/utils";
import BaseElement from "@gaoding/editor-framework/lib/base/base-element";
import template from "./text-element.html";
import { isGroup } from "@gaoding/editor-utils/lib/element";
import { fitText } from "@gaoding/editor-framework/lib/utils/fit-elements";
import { initMaskInfo, debounceUpdateMaskInfo } from "@gaoding/editor-framework/lib/static/mask-wrap/utils";
import $ from "@gaoding/editor-utils/lib/zepto"; // const rTwoSpace = /\s\s/g;
// const rBr = /<br\s*\/?>/ig;
// const rBreakLine = /\r?\n/gm;

var isFox = utils.isFox();
var supportMiniFontSize = isFox || window.safari;
export var textBase = {
  template: template,
  data: function data() {
    return {
      fallbackFonts: 'Arial,SimSun,Sans-Serif',
      // safari 原生支持字号小于12像素
      minFontSize: supportMiniFontSize ? 1 : this.model.$miniFontSize,
      // 优化切换字体时闪一下的问题
      lastFont: null
    };
  },
  computed: {
    listClass: function listClass() {
      var listStyle = this.model.listStyle;
      var elems = this.model.contents.filter(function (item) {
        return item.beginParentTag === 'li';
      });
      var digitMaps = {
        decimal: 10,
        'upper-alpha': 27,
        'lower-alpha': 27,
        'cjk-ideographic': 11
      };
      var digit = digitMaps[listStyle] ? 1 + Math.min(1, Math.floor(elems.length / digitMaps[listStyle])) : 1;
      var classArr = [];
      listStyle && listStyle !== 'none' && classArr.push('is-list is-list--' + listStyle);
      isFox && classArr.push('is-fox');
      digit && classArr.push('is-list--digit-' + digit);
      return classArr.join(' ');
    },
    textPadding: function textPadding() {
      var model = this.model;
      return this.isText ? model.padding.join('px ') + 'px' : this.padding;
    },
    hasEffects: function hasEffects() {
      return this.effectedTextEffects.length;
    },

    /** 是否只有投影 */
    isOnlyShadow: function isOnlyShadow() {
      var _this$model = this.model,
          _this$model$shadows = _this$model.shadows,
          shadows = _this$model$shadows === void 0 ? [] : _this$model$shadows,
          _this$model$textEffec = _this$model.textEffects,
          textEffects = _this$model$textEffec === void 0 ? [] : _this$model$textEffec;

      var getCount = function getCount(arr) {
        return arr.filter(function (v) {
          return v === null || v === void 0 ? void 0 : v.enable;
        }).length;
      };

      return getCount(shadows) > 0 && getCount(textEffects) === 0;
    },
    // 有渐变、图案填充
    hasAdvancedFilling: function hasAdvancedFilling() {
      var _this = this;

      return !!this.effectedTextEffects && this.effectedTextEffects.find(function (effect) {
        return _this.checkAdvancedFilling(effect);
      });
    },
    resize: function resize() {
      return this.model.resize;
    },
    isVertical: function isVertical() {
      var writingMode = this.model.writingMode;
      return writingMode && writingMode.indexOf('vertical') > -1;
    },
    contentsHTML: function contentsHTML() {
      var _this2 = this;

      var model = this.model,
          options = this.options;

      var defaultModel = _pick(model, ['fontStyle', 'fontWeight', 'textDecoration']);

      var fontSubsetEnable = options.fontSubset.getUrl;
      var subsetSuffix = options.subsetSuffix;
      var contents = model.contents.map(function (item) {
        var result = {}; // TODO: 截图服务 mirror 页面可以突破 12 字号限制，导致chrome浏览器跟截图效果不一致

        if (item.fontSize && _this2.options.mode === 'mirror' && !supportMiniFontSize) {
          result.fontSize = Math.max(item.fontSize, 12);
        }

        if (item && item.fontFamily) {
          var font;

          if (item.fontFamily === _this2.model.fontFamily && _this2.lastFont) {
            font = _this2.lastFont;
          } else {
            font = _this2.getCloseFont(item.fontFamily) || {
              name: item.fontFamily
            };
          }

          var subsetData = options.fontSubsetsMap[font.name];
          var subsetNames = fontSubsetEnable && subsetData ? ["\"" + (font.name + subsetSuffix) + "\"", "\"" + (font.family + subsetSuffix) + "\""] : [];

          var fontNames = _uniq(subsetNames.concat(["\"" + font.name + "\"", "\"" + font.family + "\"", _this2.fallbackFonts]));

          if (font) {
            result.fontFamily = fontNames.join(',');
          }

          return Object.assign({}, defaultModel, item, result);
        }

        return Object.assign({}, defaultModel, item, result);
      });
      var html = serialize.fromHTML(contents, {
        listStyle: this.model.listStyle
      });
      return html;
    },
    fontFamily: function fontFamily() {
      var fallbackFonts = this.fallbackFonts;
      var font = this.lastFont;

      if (!font || this.model.$loaded) {
        font = this.getCloseFont();
      }

      if (!font) {
        return fallbackFonts;
      }

      var fontSubsetEnable = this.options.fontSubset.getUrl;
      var subsetSuffix = this.options.subsetSuffix;
      var subsetData = this.options.fontSubsetsMap[font.name];
      var subsetNames = fontSubsetEnable && subsetData ? ["\"" + (font.name + subsetSuffix) + "\"", "\"" + (font.family + subsetSuffix) + "\""] : [];

      var fontNames = _uniq(subsetNames.concat(["\"" + font.name + "\"", "\"" + font.family + "\"", fallbackFonts]));

      return fontNames.join(',');
    },
    color: function color() {
      return this.model.color && tinycolor(this.model.color).toString('rgb');
    },
    fontSize: function fontSize() {
      return this.model.fontSize;
    },
    fontSizeScale: function fontSizeScale() {
      return Math.min(1, this.fontSize / this.minFontSize);
    },
    letterSpacingScale: function letterSpacingScale() {
      return this.fontSizeScale < 1 ? this.minFontSize / this.model.fontSize : this.global.zoom;
    },
    transformOrigin: function transformOrigin() {
      var origin = [0, 0];
      var align = this.model.verticalAlign; // Horizontal

      if (!this.isVertical) {
        origin[0] = 0;
        origin[1] = {
          top: 0,
          middle: '50%',
          bottom: '100%'
        }[align];
      } // Vertical
      else {
        origin[0] = {
          top: '100%',
          middle: '50%',
          bottom: 0
        }[align];
        origin[1] = 0;
      }

      return origin.join(' ');
    },
    mainTransform: function mainTransform() {
      var fontSizeScale = this.fontSizeScale;
      return fontSizeScale < 1 ? 'scale(' + fontSizeScale + ')' : null;
    },
    mainMinHeight: function mainMinHeight() {
      if (!this.isVertical) {
        var model = this.model;
        return this.fontSize * model.lineHeight * this.fontSizeScale + 'px';
      } else {
        return 'initial';
      }
    },
    mainMinWidth: function mainMinWidth() {
      if (this.isVertical) {
        var model = this.model;
        return this.fontSize * model.lineHeight * this.fontSizeScale + 'px';
      } else {
        return 'initial';
      }
    },
    // 宽度自增
    widthAutoScale: function widthAutoScale() {
      var model = this.model;
      return [this.isVertical ? 1 : 2, 3].includes(model.autoAdaptive);
    },
    mainWidth: function mainWidth() {
      var fontSizeScale = this.fontSizeScale;
      var width = 100 / fontSizeScale;

      if (this.isVertical) {
        return 'auto';
      } else {
        return this.widthAutoScale ? 'auto' : "calc(" + width + "% + " + this.model.letterSpacing + "px)";
      }
    },
    mainHeight: function mainHeight() {
      var fontSizeScale = this.fontSizeScale;
      var height = 100 / fontSizeScale;

      if (!this.isVertical) {
        return 'auto';
      } else {
        return this.widthAutoScale ? 'auto' : "calc(" + height + "% + " + this.model.letterSpacing + "px)";
      }
    },
    textShadow: function textShadow() {
      // {color: '#00FF00FF', offsetX: 2, offsetY: 4, blurRadius: 5}
      var data = this.model.textShadow;

      if (!data) {
        return '';
      }

      return [data.offsetX + 'px', data.offsetY + 'px', data.blurRadius + 'px', data.color].join(' ');
    },
    textStyle: function textStyle() {
      var $effectPadding = this.model.$effectPadding;
      var style = {
        fontFamily: this.fontFamily,
        fontSize: Math.max(this.minFontSize, this.fontSize) + 'px',
        letterSpacing: this.model.letterSpacing + 'px',
        verticalAlign: this.model.verticalAlign,
        color: this.color,
        transform: this.mainTransform,
        transformOrigin: this.transformOrigin,
        minWidth: this.mainMinWdith,
        minHeight: this.mainMinHeight,
        width: this.mainWidth,
        height: this.mainHeight
      };

      if ($effectPadding) {
        style.padding = $effectPadding[0] + "px " + $effectPadding[1] + "px " + $effectPadding[2] + "px " + $effectPadding[3] + "px";
        style.marginTop = $effectPadding[0] * -1 + "px";
        style.marginRight = $effectPadding[3] * -1 + "px";
      } // 3D 文字由于高度和编辑态文本高度可能相差很大，所以采用编辑态文本垂直居中


      if (this.model.type === 'threeText') {
        Object.assign(style, {
          whiteSpace: 'nowrap',
          top: this.model.height / 2 + 'px',
          transform: 'translate(0,-50%)'
        });
      }

      if (this.widthAutoScale) {
        style.whiteSpace = 'nowrap';
      }

      return style;
    },
    linkSelected: function linkSelected() {
      var element = this.editor.currentSubElement || this.editor.currentElement || {};
      return this.isLinkWith(element);
    }
  },
  methods: {
    fitFontSize: function fitFontSize(baseFontSize, ratio) {
      var newFontSize = Math.max(baseFontSize * ratio, 0.01);

      if (newFontSize % 1 !== 0) {
        return Math.floor(newFontSize * 10) / 10;
      }

      return newFontSize;
    },
    load: function load(name) {
      var _this3 = this;

      var options = this.options;
      var _this$model2 = this.model,
          contents = _this$model2.contents,
          fontFamily = _this$model2.fontFamily;
      var names = null;

      if (name) {
        names = [name];
      } else {
        names = contents.filter(function (item) {
          return item && item.fontFamily;
        }).map(function (item) {
          return item.fontFamily;
        });
        names.push(fontFamily);
        names = _uniq(names);
      }

      var fontLoads = names.map(function (name) {
        var _this3$options$collab, _this3$options$collab2;

        var font = _this3.getCloseFont(name);

        var fontFallBackHook = ((_this3$options$collab = _this3.options.collabOptions) === null || _this3$options$collab === void 0 ? void 0 : _this3$options$collab.enable) && ((_this3$options$collab2 = _this3.options.collabOptions) === null || _this3$options$collab2 === void 0 ? void 0 : _this3$options$collab2.fontFallBackHook);
        var promise = Promise.resolve(font);

        if (!font && fontFallBackHook) {
          promise = Promise.try(function () {
            return _this3.options.collabOptions.fontFallBackHook(name, _this3.model);
          }).catch(function (e) {
            console.error(e);
            return font;
          });
        }

        return promise.then(function (font) {
          var _this3$options;

          if (!font) return null;
          var fontSubset = _this3.options.fontSubsetsMap[font.name];
          return loader.loadFont(Object.assign({}, font, {
            display: 'swap',
            useLocal: ((_this3$options = _this3.options) === null || _this3$options === void 0 ? void 0 : _this3$options.mode) === 'mirror'
          }, (fontSubset === null || fontSubset === void 0 ? void 0 : fontSubset.loadType) === 'subset' ? {
            subset: {
              suffix: options.subsetSuffix,
              promise: fontSubset.subsetPromise,
              content: fontSubset.subsetContent
            }
          } : null), options.fontLoadTimeout);
        });
      });
      return Promise.all(fontLoads).then(function () {
        initMaskInfo(_this3.model, _this3.editor);
        return names;
      }).finally(function () {
        _this3.lastFont = _this3.getCloseFont(_this3.model.fontFamily);
      });
    },
    getCloseFont: function getCloseFont(name) {
      var _this$options$collabO, _this$options$collabO2;

      if (name === void 0) {
        name = '';
      }

      var _this$options = this.options,
          fontsMap = _this$options.fontsMap,
          defaultFont = _this$options.defaultFont,
          fontList = _this$options.fontList;

      if (!name) {
        name = this.model.fontFamily;
      }

      if ((_this$options$collabO = this.options.collabOptions) !== null && _this$options$collabO !== void 0 && _this$options$collabO.enable && (_this$options$collabO2 = this.options.collabOptions) !== null && _this$options$collabO2 !== void 0 && _this$options$collabO2.fontFallBackHook) {
        return fontsMap[name];
      } else {
        return fontsMap[name] || fontsMap[defaultFont] || fontList[0];
      }
    },
    updateRect: function updateRect() {
      var model = this.model;
      var zoom = this.global.zoom;
      var rect = this.getRect();
      var height = rect.height / zoom;
      var width = rect.width / zoom;
      var isChild = !!this.model.$parentId;
      var isVertical = model.writingMode === 'vertical-rl';
      var hasUpdated = false;
      var delta = {
        width: 0,
        height: 0,
        align: 'left'
      }; // 延迟调用 updateRect 时，dom 可能并不存在，getRect 获取的宽高可能为 0

      if (width !== model.width && rect.originWidth !== 0 && model.autoAdaptive & 2) {
        delta.width = width - model.width;
        model.width = width;

        if (!isChild && isVertical) {
          model.left -= {
            top: delta.width,
            middle: delta.width / 2,
            bottom: delta.width * -1
          }[model.verticalAlign || 'top'];
        }

        hasUpdated = true;
      }

      if (height !== model.height && rect.originHeight !== 0 && model.autoAdaptive & 1) {
        delta.height = height - model.height;
        model.height = height;
        hasUpdated = true;
      } // 具备宽度自增时，left 需根据 textAlign 做效果


      var textAlignMap = {
        center: function center(w) {
          return w / 2;
        },
        right: function right(w) {
          return w;
        }
      };

      if (hasUpdated && !isChild && textAlignMap[model.textAlign] && model.autoAdaptive & (isVertical ? 1 : 2, 3)) {
        if (model.writingMode !== 'vertical-rl') {
          model.left -= textAlignMap[model.textAlign](delta.width);
        } else {
          model.top -= textAlignMap[model.textAlign](delta.height);
        }
      }

      if (hasUpdated && this.isDesignMode) {
        var textAlign = model.textAlign;

        if (isVertical) {
          textAlign = {
            top: 'right',
            middle: 'center',
            bottom: 'left'
          }[model.verticalAlign || 'top'];
        }

        delta.align = textAlign;
        this.$events.$emit('element.rectUpdate', model, delta);
      }
    },
    _getRect: function _getRect() {
      var element = $(this.$el);
      var innerElement = element.find('.element-main');
      var zoom = this.global.zoom;

      if (this.model.$editing) {
        innerElement = $('.editor-text-editor .element-main');
      }

      if (innerElement.length) {
        element = innerElement;
      }

      var height;
      var width;

      if (this.isText && this.hasAdvancedFilling) {
        var rect = this.setEffectPadding(element);
        height = rect.height;
        width = rect.width;
      } else {
        height = element.prop('offsetHeight') || 0;
        width = element.prop('offsetWidth') || 0;
      }

      return {
        height: height * zoom,
        width: width * zoom
      };
    },
    // rect
    getRect: function getRect() {
      // const superMethods = BaseElement.find((v) => v.name === 'base-element').methods;
      var rect = this._getRect(); // .call(this);


      var width = rect.width,
          height = rect.height;
      var zoom = this.global.zoom; // fontSizeScale

      var fontSizeScale = this.fontSizeScale; // dom 可能并不存在，getRect 获取的宽高可能为 0

      rect.originWidth = rect.width;
      rect.originHeight = rect.height;
      rect.height = height * fontSizeScale + (this.model.padding[0] + this.model.padding[2]) * zoom;
      rect.width = width * fontSizeScale + (this.model.padding[1] + this.model.padding[3]) * zoom; // 需减去最后一个字间距

      var isVertical = this.model.writingMode === 'vertical-rl';

      if (isVertical) {
        rect.height -= Math.max(0, this.model.letterSpacing * zoom);
      } else {
        rect.width -= Math.max(0, this.model.letterSpacing * zoom);
      }

      return rect;
    },
    // 将 DOM 实际 rect 参数同步到 model 中
    syncRect: function syncRect() {
      if (this.options.mode === 'preview' || !this.model.autoAdaptive || this.model.$resizeApi) {
        return;
      } // DOM 可能未更新，需延调用


      this.$nextTick(this.updateRect);
    },
    setEffectPadding: function setEffectPadding(element) {
      var cachePadding = element.css('padding');
      element.css('padding', 0);
      var height = element.prop('offsetHeight') || 0;
      var width = element.prop('offsetWidth') || 0;
      var isVertical = this.model.writingMode === 'vertical-rl';
      var bbox = utils.getBBoxByBBoxs(Array.from(element[0].children).map(function (item) {
        return {
          width: item.offsetWidth,
          height: item.offsetHeight,
          left: item.offsetLeft,
          top: item.offsetTop
        };
      }));
      element.css('padding', cachePadding); // 当判断子元素包围盒超过，容器区域时，需要新增 padding 处理，避免特效被裁剪

      if (isVertical && bbox.width > width) {
        // chrome 竖排时，子节点 span 的 offsetLeft 计算方式有点奇怪，此时做个简单的校准
        // 出现以上情况时，子元素实际位置会大幅向左偏移，导致padding计算异常，所以这里按居中处理，做层 hack
        if (bbox.left * -1 < (bbox.width - width) / 5) {
          bbox.left = (bbox.width - width) / 2 * -1;
        }

        var paddingLeft = bbox.left * -1;
        this.$set(this.model, '$effectPadding', [0, bbox.width - paddingLeft - width, 0, paddingLeft]);
      } else if (!isVertical && bbox.height > height) {
        var paddingTop = bbox.top * -1;
        this.$set(this.model, '$effectPadding', [paddingTop, 0, bbox.height - paddingTop - height, 0]);
      } else {
        this.$set(this.model, '$effectPadding', null);
      }

      return {
        width: width,
        height: height
      };
    },
    deleteEffectPadding: function deleteEffectPadding() {
      this.$delete(this.model, '$effectPadding');
    },
    checkAdvancedFilling: function checkAdvancedFilling(effect) {
      return effect.filling && effect.filling.enable && effect.filling.type !== 0 && effect.filling.type !== 'color';
    }
  },
  watch: {
    hasAdvancedFilling: function hasAdvancedFilling(v) {
      if (v) return;
      this.deleteEffectPadding();
    },
    'model.fontFamily': function modelFontFamily() {
      this.checkLoad();
    },
    'model.listStyle': function modelListStyle() {
      this.syncRect();
    },
    'model.autoAdaptive': function modelAutoAdaptive() {
      this.syncRect();
    }
  },
  events: {
    'element.loaded': function elementLoaded(model) {
      if (model === this.model) {
        this.syncRect();
      }
    },
    'element.transformStart': function elementTransformStart(model, _ref) {
      var action = _ref.action,
          dir = _ref.dir;
      if (action !== 'resize' || !this.isDesignMode) return;
      var autoAdaptive = this.model.autoAdaptive; // 手动拉大缩小文本宽度时取消高、宽自增

      if (dir.length === 1 && autoAdaptive) {
        var isInclude = false;

        if (isGroup(model)) {
          var parents = this.editor.getParentGroups(this.model);
          isInclude = model.type !== 'flex' && parents.map(function (item) {
            return item.$id;
          }).concat(this.model.$id).includes(this.model.$id);
        } else {
          isInclude = model === this.model;
        }

        var dirMap = {
          s1: 0,
          n1: 0,
          w2: 0,
          e2: 0,
          s3: 2,
          n3: 2,
          w3: 1,
          e3: 1
        };

        if (isInclude && dirMap[dir + autoAdaptive] !== undefined) {
          this.model.autoAdaptive = dirMap[dir + autoAdaptive];
        }
      }

      var _this$rect = this.rect,
          width = _this$rect.width,
          height = _this$rect.height;
      this.$textResizeMeta = {
        width: width,
        height: height,
        letterSpacing: this.model.letterSpacing,
        fontSize: this.model.fontSize,
        contents: _cloneDeep(this.model.contents),
        padding: _cloneDeep(this.model.padding)
      };
    },
    'element.transformEnd': function elementTransformEnd(model, drag, _ref2) {
      var action = _ref2.action;
      if (action !== 'resize' || !this.isDesignMode) return;
      delete this.$textResizeMeta; // TODO: 文字容器中单向拖拽，文字存在自动换行，此时需自适应
      // 若要在 transformResize 的过程实时更新 rect
      // 需更新 drag 的 cache 状态，group 的 cahce，svg 的 cache，较繁琐

      if (['w', 'e', 'n', 's'].indexOf(drag.dir) !== -1 && model === this.$parent.model && model.autoGrow) {
        var zoom = this.global.zoom;
        var rect = this.getRect();
        var height = rect.height / zoom - this.model.height;
        var width = rect.width / zoom - this.model.width;

        if (Math.abs(height) > 0.5 || Math.abs(width) > 0.5) {
          this.model.height = rect.height / zoom;
          this.model.width = rect.width / zoom;
          this.$events.$emit('element.rectUpdate', this.model, {
            height: height,
            width: width
          }, true);
        }
      }
    },
    'element.transformResize': function elementTransformResize(drag, model) {
      if (model !== this.model || !this.isDesignMode) return;
      if (!model.autoScale) return; // 高度自增文本框，文本自增方向上拖拽则使用拖拽高度

      var isHorizontal = this.model.writingMode === 'horizontal-tb';
      var dir = drag.dir;

      if (model.autoAdaptive && (isHorizontal && (dir === 'n' || dir === 's') || !isHorizontal && (dir === 'w' || dir === 'e'))) {
        return;
      } // 对 autoScale 文本框，四角方向拖拽时作等比缩放


      if (dir.length > 1) {
        var currRect = this.rect;
        var baseText = this.$textResizeMeta; // 原文本框缩放至 0 宽高后，展开时按 1:1 处理

        var ratio = isHorizontal ? currRect.width / (baseText.width || 1) : currRect.height / (baseText.height || 1);
        fitText(model, baseText, ratio);
      } // 纵横向拖拽时与非 autoScale 一致, 拖拽过程可能换行需 syncRect
      else {
        this.syncRect();
      }
    },
    'element.change': function elementChange(model, propName) {
      if (propName === 'contents' && this.isLinkWith(model)) {
        var contents = _cloneDeep(this.model.contents);

        var content = model.contents.reduce(function (list, content) {
          list.push(content.content);
          return list;
        }, []).join('');

        if (!contents || contents.length === 0) {
          this.model.contents = [{
            content: content
          }];
        } else {
          contents.reduce(function (startIndex, contentBody, index) {
            if (startIndex < content.length) {
              var length = contentBody.content.length;
              var append = '';

              if (startIndex + length > content.length || index === contents.length - 1) {
                append = content.substring(startIndex);
              } else {
                append = content.substring(startIndex, startIndex + length);
              }

              contentBody.content = append;
              startIndex += append.length;
            } else {
              contentBody.content = '';
            }

            return startIndex;
          }, 0);
        }

        this.editor.changeElement({
          content: content,
          contents: contents
        }, this.model, false);
        this.syncRect();
      }
    }
  },
  mounted: function mounted() {
    var _this4 = this;

    this.syncRect();
    this.$watch(function () {
      return _this4.model.$renderProps;
    }, function () {
      return debounceUpdateMaskInfo(_this4.model, _this4.editor);
    }, {
      deep: true
    });
  },
  beforeDestroy: function beforeDestroy() {
    var elem = this.editElement;
    var layout = this.editor.currentLayout;
    var isNeedDel = elem && !elem.content.trim();

    if (isNeedDel && layout.elements.find(function (el) {
      return el === elem;
    }) && this.removeEmptyEnable) {
      this.editor.removeElement(elem, layout);
    }
  }
};
export default inherit(BaseElement, textBase);