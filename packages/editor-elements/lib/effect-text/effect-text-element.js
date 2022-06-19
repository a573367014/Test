import _asyncToGenerator from "@babel/runtime/helpers/asyncToGenerator";
import _throttle from "lodash/throttle";
import _cloneDeep from "lodash/cloneDeep";
import _regeneratorRuntime from "@babel/runtime/regenerator";
import Promise from 'bluebird';
import inherit from "@gaoding/editor-framework/lib/utils/vue-inherit";
import BaseElement from "./text-base";
import template from "./effect-text-element.html";
import { drawPath, drawCanvas, getEffectExpand } from "./utils";
import FontPath from "./utils/font-path";
import { transformPath } from "./utils/transform";
import FontEffect from "./utils/font-effect";
import { createCanvas } from "@gaoding/editor-utils/lib/canvas";
import { getLines, getWords as _getWords } from "@gaoding/editor-utils/lib/get-lines";
import { fitText } from "@gaoding/editor-framework/lib/utils/fit-elements";
import utils from "@gaoding/editor-framework/lib/utils/utils";
import { getUpdateFontsSubset } from "@gaoding/editor-framework/lib/utils/subset";
import { scaleEffect } from "@gaoding/editor-utils/lib/effect/utils";
import { getEffectShadowList } from "@gaoding/editor-utils/lib/effect/adaptor";
export default inherit(BaseElement, {
  name: 'effect-text-element',
  template: template,
  data: function data() {
    return {
      isRendering: false,
      isRenderInit: false
    };
  },
  computed: {
    canvasStyle: function canvasStyle() {
      var _this$global$zoom = this.global.zoom,
          zoom = _this$global$zoom === void 0 ? 1 : _this$global$zoom;
      var _this$ratio = this.ratio,
          ratio = _this$ratio === void 0 ? 1 : _this$ratio;
      return {
        transform: "scale(" + zoom * ratio / window.devicePixelRatio + ")"
      };
    },
    isMirrorMode: function isMirrorMode() {
      // 有 imageUrl 才算有效的 mirror 模式，不然依然走渲染
      return this.options.mode === 'mirror' && this.model.imageUrl;
    },
    linkSelected: function linkSelected() {
      var element = this.editor.currentSubElement || this.editor.currentElement || {};
      return this.isLinkWith(element);
    },
    showWithImg: function showWithImg() {
      // 如果一个元素有多个 vue 实例，编辑器修改了其中一个实例，渲染后删除 imageUrl, 会导致其他使用预览图的实例渲染异常
      if (!this.isRenderInit && !this.model.imageUrl) {
        this.lazyRender();
      }

      return !this.isRenderInit;
    },
    showLoading: function showLoading() {
      return this.isRendering && this.isDesignMode;
    }
  },
  events: {
    'element.loaded': function elementLoaded(model) {
      if (model === this.model) {
        this.syncRect();
      }
    },
    'element.transformStart': function elementTransformStart(model, _ref) {
      var action = _ref.action;

      if (this.isModelRelative(model) && action === 'resize') {
        var _this$rect = this.rect,
            width = _this$rect.width,
            height = _this$rect.height;
        this.$textResizeMeta = {
          width: width,
          height: height,
          letterSpacing: this.model.letterSpacing,
          fontSize: this.model.fontSize,
          contents: _cloneDeep(this.model.contents)
        };
      }
    },
    'element.transformEnd': function elementTransformEnd(model, drag, _ref2) {
      var _this = this;

      var action = _ref2.action;

      if (this.isModelRelative(model) && action === 'resize') {
        model === this.model && this.syncRectPos(drag.dir.length > 1);
        this.$nextTick(function () {
          return _this.lazyRender();
        });
      }
    },
    'element.transformResize': function elementTransformResize(drag, model) {
      if (this.isModelRelative(model)) {
        var isHorizontal = this.model.writingMode === 'horizontal-tb';
        var dir = drag.dir;

        if (isHorizontal && (dir === 'n' || dir === 's') || !isHorizontal && (dir === 'w' || dir === 'e')) {
          return;
        }

        if (dir.length > 1) {
          var currRect = this.rect;
          var baseText = this.$textResizeMeta; // 原文本框缩放至 0 宽高后，展开时按 1:1 处理

          this.ratio = isHorizontal ? currRect.width / (baseText.width || 1) : currRect.height / (baseText.height || 1);
        } else {
          this.syncRect();
        }
      }
    },
    'element.change': function elementChange(model, propName) {
      if (propName === 'contents' && this.isLinkWith(model)) {
        var content = model.contents.reduce(function (list, content) {
          list.push(content.content);
          return list;
        }, []).join('');
        this.editor.changeElement({
          contents: [{
            content: content
          }],
          content: content
        }, this.model, false);
        this.syncRect();
      }
    },
    'model.fontSize': function modelFontSize(val, oldVal) {
      if (!this.isDesignMode || this.model.$resizeApi) return;
      scaleEffect(this.model, val / oldVal || 1);
      this.lazyRender();
    }
  },
  methods: {
    load: function load() {
      var _this2 = this;

      return _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee() {
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                // 初始状态加载字体子集，使文字不会换行，导致双击后中心位置改变
                if (_this2.isDesignMode) {
                  _this2.loadFont();
                }

                if (!_this2.model.imageUrl) {
                  _context.next = 6;
                  break;
                }

                _context.next = 4;
                return utils.loadImage(_this2.model.imageUrl, _this2.options.fitCrossOrigin);

              case 4:
                _context.next = 8;
                break;

              case 6:
                _context.next = 8;
                return _this2.render(true);

              case 8:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
      }))();
    },
    loadFontPath: function loadFontPath() {
      var _this3 = this;

      return _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2() {
        var vm, names;
        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                vm = _this3;
                _context2.next = 3;
                return _this3.loadFont();

              case 3:
                names = _context2.sent;
                return _context2.abrupt("return", Promise.map(names, function (name) {
                  var fontData = vm.getFontData(name);
                  return new FontPath(fontData, _this3.model).load();
                }).then(function (fonts) {
                  var result = {};
                  fonts.forEach(function (item) {
                    result[item.name] = item;
                  });
                  return result;
                }));

              case 5:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2);
      }))();
    },
    getWords: function getWords() {
      var _this4 = this;

      var lines = getLines(this.$refs.textNode, this.$refs.textInner); // 有的变化不计算 letterSpacing 更好看

      var types = ['ellipse-byWord', 'triangle-byWord', 'rectangular-byWord', 'pentagon-byWord'];

      if (!types.some(function (type) {
        return type === _this4.model.deformation.type;
      })) {
        lines.forEach(function (line) {
          line.forEach(function (word) {
            word.width -= _this4.model.letterSpacing;
          });
        });
      }

      var words = _getWords(lines, this.model);

      return words;
    },
    getFontData: function getFontData(fontFamily) {
      var options = this.options;
      return options.fontsMap[fontFamily] || options.fontsMap[this.model.fontFamily] || options.defaultFont;
    },
    getPaths: function getPaths(fontPaths) {
      var _this5 = this;

      var initPaths = [];
      this.words = this.getWords();
      var charPosDatas = [];
      var maxFontSize = 0;
      this.words.forEach(function (word) {
        if (word.fontSize < 12) {
          word.fontSize = 12 * _this5.fontSizeScale;
        } // 增加字体回退


        var fontData = _this5.getFontData(word.fontFamily);

        var fontPath = fontPaths[fontData.name];
        var path = fontPath.getPathByData(word);
        initPaths.push(path);
        var x = word.left + 0.5 * word.width;
        var y = word.top + 0.5 * word.height;
        var fontBox = fontPath.$getInfo(word);
        charPosDatas.push({
          rowNum: word.lineIndex,
          columnNum: word.wordIndex,
          fontSize: word.fontSize,
          centerPos: {
            x: x,
            y: y
          },
          centerDiviation: 0.5 * word.height - fontBox.baseLine
        });
        maxFontSize = Math.max(maxFontSize, word.fontSize);
      });
      this.pathOptions = {
        charPosDatas: charPosDatas,
        writingMode: this.model.writingMode,
        maxFontSize: maxFontSize
      };
      return initPaths;
    },
    draw: function draw() {
      var _this6 = this;

      if (this.model.$editing || this.editor.global.$draging || !this.initBBox || !this.initPaths[0]) return;

      if (this.getTextEffectsEnable()) {
        this.boundingBox = getEffectExpand(this.model, this.initBBox);
      }

      if (!this.checkBoundingBox) return;
      this.resizeCanvas(this.boundingBox);
      var _this$boundingBox = this.boundingBox,
          width = _this$boundingBox.width,
          height = _this$boundingBox.height,
          _this$boundingBox$min = _this$boundingBox.min,
          min = _this$boundingBox$min === void 0 ? {
        x: 0,
        y: 0
      } : _this$boundingBox$min; // 重置宽高会导致内容丢失

      this.clickAreaCanvas.width = width;
      this.clickAreaCanvas.height = height;
      this.cacheCtx.save();
      this.clickAreaCtx.save();
      this.cacheCtx.translate(-min.x, -min.y);
      this.clickAreaCtx.translate(-min.x, -min.y);
      this.clickAreaCtx.fillStyle = '#00ff00';
      this.words.forEach(function (word, i) {
        var fontData = _this6.getFontData(word.fontFamily);

        _this6.cacheCtx.fillStyle = word.color;
        _this6.cacheCtx.strokeStyle = word.color;
        drawCanvas({
          ctx: _this6.cacheCtx,
          word: word,
          path: _this6.paths[i],
          fontWeight: fontData.weight
        });
        drawPath(_this6.clickAreaCtx, _this6.paths[i].clickAreaCommands);
      });
      this.cacheCtx.restore();
      this.clickAreaCtx.restore();
      this.doTextEffects();
    },
    doTransform: function doTransform() {
      var _this7 = this;

      return _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee3() {
        return _regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                if (!(_this7.model.$editing || _this7.editor.global.$draging)) {
                  _context3.next = 2;
                  break;
                }

                return _context3.abrupt("return");

              case 2:
                if (!(_this7.initPaths && _this7.initPaths[0])) {
                  _context3.next = 9;
                  break;
                }

                _this7.paths = _cloneDeep(_this7.initPaths);
                _context3.next = 6;
                return transformPath(_this7.paths, _this7.model, _this7.pathOptions);

              case 6:
                _this7.boundingBox = _context3.sent;
                _this7.initBBox = _this7.boundingBox;

                _this7.draw();

              case 9:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3);
      }))();
    },
    doTextEffects: function doTextEffects() {
      var _this8 = this;

      return _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee4() {
        var _this8$boundingBox$mi, min, fe;

        return _regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                if (!(_this8.model.$editing || _this8.editor.global.$draging)) {
                  _context4.next = 2;
                  break;
                }

                return _context4.abrupt("return");

              case 2:
                if (!_this8.getTextEffectsEnable()) {
                  _context4.next = 9;
                  break;
                }

                _this8$boundingBox$mi = _this8.boundingBox.min, min = _this8$boundingBox$mi === void 0 ? {
                  x: 0,
                  y: 0
                } : _this8$boundingBox$mi;
                fe = new FontEffect({
                  inputCtx: _this8.cacheCtx,
                  outputCtx: _this8.ctx,
                  model: _this8.model,
                  mode: _this8.options.mode,
                  paths: _this8.paths,
                  pathOffset: {
                    x: -min.x * window.devicePixelRatio,
                    y: -min.y * window.devicePixelRatio
                  }
                });
                _context4.next = 7;
                return fe.render();

              case 7:
                _context4.next = 12;
                break;

              case 9:
                _this8.canvas.width = _this8.cacheCanvas.width;
                _this8.canvas.height = _this8.cacheCanvas.height;

                _this8.ctx.drawImage(_this8.cacheCanvas, 0, 0);

              case 12:
                _this8.ratio = 1;
                _this8.model.imageUrl = null; // 手动触发点击区域更新

                _this8.editor.lazyUpdatePicker();

              case 15:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4);
      }))();
    },
    initRenderer: function initRenderer() {
      var _this9 = this;

      return _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee5() {
        return _regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                _this9.isRenderInit = true;
                _this9.cacheCanvas = createCanvas();
                _this9.cacheCtx = _this9.cacheCanvas.getContext('2d');
                _context5.next = 5;
                return _this9.$nextTick();

              case 5:
                _this9.canvas = _this9.$refs.canvas;
                _this9.clickAreaCanvas = _this9.$refs.clickAreaCanvas;
                _this9.ctx = _this9.canvas.getContext('2d');
                _this9.clickAreaCtx = _this9.clickAreaCanvas.getContext('2d');

              case 9:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5);
      }))();
    },
    render: function render(isForce) {
      var _this10 = this;

      return _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee6() {
        var fontPaths;
        return _regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                if (!(!_this10.$refs.textInner || (_this10.model.$editing || _this10.editor.global.$draging) && isForce !== true)) {
                  _context6.next = 2;
                  break;
                }

                return _context6.abrupt("return");

              case 2:
                _this10.isRendering = true;

                _this10.syncRect();

                _context6.next = 6;
                return _this10.$nextTick();

              case 6:
                _context6.next = 8;
                return _this10.loadFontPath();

              case 8:
                fontPaths = _context6.sent;

                if (!_this10.$refs.textInner) {
                  _context6.next = 17;
                  break;
                }

                _this10.initPaths = _this10.getPaths(fontPaths);

                if (!(_this10.initPaths && _this10.initPaths[0])) {
                  _context6.next = 17;
                  break;
                }

                if (!(!_this10.isRenderInit || !_this10.clickAreaCanvas)) {
                  _context6.next = 15;
                  break;
                }

                _context6.next = 15;
                return _this10.initRenderer();

              case 15:
                _context6.next = 17;
                return _this10.doTransform();

              case 17:
                _this10.isRendering = false;

              case 18:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6);
      }))();
    },
    lazyRender: function lazyRender(arg) {
      var _this11 = this;

      if (!this._lazyRender) {
        this._lazyRender = _throttle( /*#__PURE__*/function () {
          var _ref3 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee7(arg) {
            return _regeneratorRuntime.wrap(function _callee7$(_context7) {
              while (1) {
                switch (_context7.prev = _context7.next) {
                  case 0:
                    _this11.scaleRatio = 1;
                    _context7.next = 3;
                    return _this11.render(arg);

                  case 3:
                  case "end":
                    return _context7.stop();
                }
              }
            }, _callee7);
          }));

          return function (_x) {
            return _ref3.apply(this, arguments);
          };
        }(), 100);
      }

      this._lazyRender(arg);
    },
    effectRender: function effectRender() {
      if (this.isRenderInit) {
        this.draw();
      } else {
        this.lazyRender();
      }
    },
    resizeCanvas: function resizeCanvas(_ref4) {
      var width = _ref4.width,
          height = _ref4.height;
      this.cacheCanvas.width = Math.ceil(width * window.devicePixelRatio);
      this.cacheCanvas.height = Math.ceil(height * window.devicePixelRatio);
      this.cacheCtx.restore();
      this.cacheCtx.save();
      this.cacheCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
      var model = this.model;
      var dw = width - model.width;
      var dh = height - model.height;

      if (this.isDesignMode) {
        model.left += (model.width - width) / 2;
        model.top += (model.height - height) / 2;
      }

      this.model.typoWidthRatio = model.$typoWidth / width;
      this.model.typoHeightRatio = model.$typoHeight / height;
      model.width = width;
      model.height = height;

      if (Math.abs(dw) + Math.abs(dh) > 0.1) {
        var groups = this.editor.getParentGroups(this.model); // groups 由浅入深，应反向更新

        for (var i = groups.length - 1; i >= 0; i--) {
          this.$events.$emit('group.boundingReset', groups[i]);
        }
      }
    },
    checkBoundingBox: function checkBoundingBox() {
      var _this$boundingBox2 = this.boundingBox,
          _this$boundingBox2$wi = _this$boundingBox2.width,
          width = _this$boundingBox2$wi === void 0 ? 0 : _this$boundingBox2$wi,
          _this$boundingBox2$he = _this$boundingBox2.height,
          height = _this$boundingBox2$he === void 0 ? 0 : _this$boundingBox2$he;
      return width > 1 && height > 1;
    },
    getTextEffectsEnable: function getTextEffectsEnable() {
      return getEffectShadowList(this.model).length > 0;
    },
    syncRectPos: function syncRectPos(isScale) {
      if (isScale === void 0) {
        isScale = false;
      }

      var baseText = this.$textResizeMeta;
      var _this$ratio2 = this.ratio,
          ratio = _this$ratio2 === void 0 ? 1 : _this$ratio2,
          rect = this.rect,
          global = this.global;
      var _global$zoom = global.zoom,
          zoom = _global$zoom === void 0 ? 1 : _global$zoom;
      this.model.width = rect.width / zoom;
      this.model.height = rect.height / zoom;
      this.model.top = rect.top / zoom;
      this.model.left = rect.left / zoom;

      if (isScale) {
        fitText(this.model, baseText, ratio);
      }

      delete this.$textResizeMeta;

      if (!this.isDesignMode) {
        this.ratio = 1;
      }
    },
    checkLoadFullFont: function checkLoadFullFont() {
      var model = this.model,
          options = this.options;
      var fontData = getUpdateFontsSubset([{
        elements: [model]
      }], options);

      if (fontData) {
        Object.keys(fontData).forEach(function (name) {
          var fontSubset = options.fontSubsetsMap[name];

          if (fontSubset) {
            fontSubset.loadType = 'all';
          }
        });
        this.checkLoad();
      }
    }
  },
  mounted: function mounted() {
    this.checkLoadFullFont();
    this.syncRect();
  },
  watch: {
    'model.width': function modelWidth(val) {
      this.model.$typoWidth = val * (this.model.$editing ? 1 : this.model.typoWidthRatio);
    },
    'model.height': function modelHeight(val) {
      this.model.$typoHeight = val * (this.model.$editing ? 1 : this.model.typoHeightRatio);
    },
    'model.$editing': function model$editing(val) {
      var _this12 = this;

      if (this.isDesignMode) {
        var model = this.model;

        if (val) {
          model.resize = this.isVertical ? 3 : 5;
          model.left += model.width * (1 - model.typoWidthRatio) / 2;
          model.top += model.height * (1 - model.typoHeightRatio) / 2;
          model.width = model.$typoWidth;
          model.height = model.$typoHeight;
        } else {
          model.resize = 1;
          model.width = model.$typoWidth / model.typoWidthRatio;
          model.height = model.$typoHeight / model.typoHeightRatio;
          model.top += (model.$typoHeight - model.height) / 2;
          model.left += (model.$typoWidth - model.width) / 2;
        }
      }

      if (!val) {
        this.lazyRender();
        return;
      } // 进入编辑加载全量字体


      var needCheckLoad;
      this.model.contents.forEach(function (item) {
        var font = _this12.options.fontsMap[item.fontFamily || _this12.model.fontFamily] || _this12.options.defaultFont;
        var fontSubset = _this12.options.fontSubsetsMap[font.name];

        if (fontSubset && fontSubset.loadType !== 'all') {
          fontSubset.loadType = 'all';
          needCheckLoad = true;
        }
      });

      if (needCheckLoad) {
        this.checkLoad();
      }
    },
    'model.writingMode': function modelWritingMode() {
      if (!this.isDesignMode) {
        return;
      }

      var model = this.model; // 当前 resize 模式旋转 90 度后可能变为新 resize

      var newResize = {
        2: 4,
        4: 2,
        5: 3,
        3: 5
      }[model.editingResize];

      if (newResize) {
        model.editingResize = newResize;
      }

      var _ref5 = [model.height, model.width];
      model.width = _ref5[0];
      model.height = _ref5[1];
      var _ref6 = [model.typoHeightRatio, model.typoWidthRatio];
      model.typoWidthRatio = _ref6[0];
      model.typoHeightRatio = _ref6[1];
      this.lazyRender();
    },
    'model.contents': {
      deep: true,
      handler: function handler() {
        if (!this.model.$editing && !this.model.$draging) {
          this.checkLoadFullFont();
        }

        this.syncRect();
        this.lazyRender();
      }
    },
    'model.textAlign': 'lazyRender',
    'model.letterSpacing': 'lazyRender',
    'model.lineHeight': 'lazyRender',
    'model.padding': 'lazyRender',
    'model.deformation': {
      deep: true,
      handler: function handler() {
        if (this.model.$needSpeedUp && this.initPaths) {
          this.doTransform();
          this.model.$needSpeedUp = false;
        } else {
          this.lazyRender();
        }
      }
    },
    'model.textEffects': {
      deep: true,
      handler: 'effectRender'
    },
    'model.shadows': {
      deep: true,
      handler: 'effectRender'
    } // 'global.zoom': 'render'

  }
});