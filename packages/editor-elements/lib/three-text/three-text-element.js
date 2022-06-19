import _asyncToGenerator from "@babel/runtime/helpers/asyncToGenerator";
import _cloneDeep from "lodash/cloneDeep";
import _throttle from "lodash/throttle";
import _regeneratorRuntime from "@babel/runtime/regenerator";
import inherit from "@gaoding/editor-framework/lib/utils/vue-inherit";
import BaseElement from "@gaoding/editor-framework/lib/base/base-element";
import template from "./three-text-element.html";
import utils from "@gaoding/editor-framework/lib/utils/utils";
export default inherit(BaseElement, {
  name: 'threeText-element',
  template: template,
  props: ['editor', 'global', 'model', 'options'],
  data: function data() {
    return {
      layerPickerSignal: false,
      renderInit: false,
      renderInitOver: false,
      scaleRatio: 1,
      compositeScaleRatio: 1,
      need2DText: false,
      isRendering: true,
      isNeedTime: false,
      controlData: {
        hasEyeDistanceChanged: true,
        hasFontChanged: true,
        hasModelChanged: true,
        hasLightChanged: true,
        hasCameraChanged: true,
        hasMaterialsChanged: true,
        hasEnvChanged: true,
        hasCanvasResize: true,
        hasShadowChanged: true,
        compositeZoom: this.global.zoom * window.devicePixelRatio
      },
      devicePixelRatio: window && window.devicePixelRatio || 1
    };
  },
  computed: {
    supportTransform: function supportTransform() {
      return !!this.model.containerTransform;
    },
    canvasStyle: function canvasStyle() {
      return {
        overflow: this.model.$showCoordinate ? 'visible' : 'hidden'
      };
    },
    diviateX: function diviateX() {
      var offsetX = 2 * (-(this.model.centerRatioX || -0.5) - 0.5) * this.model.width;
      return offsetX * this.global.zoom;
    },
    diviateY: function diviateY() {
      var offsetY = 2 * (-(this.model.centerRatioY || -0.5) - 0.5) * this.model.height;
      return offsetY * this.global.zoom;
    },
    opacity: function opacity() {
      return this.model.opacity;
    },
    originalContent: function originalContent() {
      var content = '';
      var contents = this.model.contents;
      contents.forEach(function (data) {
        content += data.content;
      });
      return content;
    },
    isPreviewMode: function isPreviewMode() {
      return this.options.mode === 'preview';
    },
    isMirrorMode: function isMirrorMode() {
      // 有 imageUrl 才算有效的 mirror 模式，不然依然走3D渲染
      return this.options.mode === 'mirror' && this.model.imageUrl;
    },
    showPlainText: function showPlainText() {
      return !this.model.imageUrl && this.isRendering;
    },
    textStyle: function textStyle() {
      return {
        fontFamily: this.model.fontFamily,
        fontSize: this.model.fontSize + 'px',
        verticalAlign: this.model.verticalAlign,
        color: this.model.layers[0].frontMaterials.albedo.color,
        transform: this.model.transform,
        transformOrigin: '0 0',
        width: this.model.width,
        height: this.model.height,
        opacity: this.showPlainText ? 1 : 0,
        lineHeight: this.model.height + 'px'
      };
    },
    linkSelected: function linkSelected() {
      var element = this.editor.currentSubElement || this.editor.currentElement || {};
      return this.isLinkWith(element);
    },
    showWithImg: function showWithImg() {
      return !this.renderInit;
    }
  },
  methods: {
    load: function load() {
      var _this = this;

      return _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee() {
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _this.initControlData();

                _this.initModelWatcher();

                _this.initLayerWatcher();

                _this.syncColorToContents();

                if (!_this.model.imageUrl) {
                  _context.next = 9;
                  break;
                }

                _context.next = 7;
                return utils.loadImage(_this.model.imageUrl, _this.options.fitCrossOrigin);

              case 7:
                _context.next = 11;
                break;

              case 9:
                _context.next = 11;
                return _this.multipleRender(false);

              case 11:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
      }))();
    },
    initPreviewCanvas: function initPreviewCanvas() {
      var _this2 = this;

      return _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2() {
        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _this2.renderInit = true;
                _context2.next = 3;
                return _this2.$nextTick();

              case 3:
                _this2.canvas = _this2.$refs.glCanvas;
                _this2.ctx = _this2.canvas.getContext('2d');
                _this2.renderInitOver = true;

              case 6:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2);
      }))();
    },
    initControlData: function initControlData() {
      var controlData = this.controlData;
      controlData.hasEyeDistanceChanged = false;
      controlData.hasFontChanged = false;
      controlData.hasModelChanged = false;
      controlData.hasLightChanged = false;
      controlData.hasCameraChanged = false;
      controlData.hasMaterialsChanged = false;
      controlData.hasEnvChanged = false;
      controlData.hasCanvasResize = false;
      controlData.hasShadowChanged = false;
      controlData.compositeZoom = this.global.zoom * window.devicePixelRatio;
      controlData.mode = this.options.mode;
    },
    initModelWatcher: function initModelWatcher() {
      var _this3 = this;

      ['model.shadow', 'model.deformation', 'model.warpByWord', 'model.environment', 'model.pointLights', 'model.hemiLight'].forEach(function (prop) {
        _this3.$watch(prop, {
          deep: true,
          handler: function handler() {
            this.multipleRender();
          }
        });
      });
      ['model.isOrtho', 'model.viewAngle', 'model.isFloodLightOff', 'model.$showCoordinate'].forEach(function (prop) {
        _this3.$watch(prop, function () {
          _this3.multipleRender();
        });
      });
      ['model.content', 'model.lineHeight', 'model.letterSpacing', 'model.textAlign', 'model.writingMode', 'originalContent'].forEach(function (prop) {
        _this3.$watch(prop, function () {
          _this3.controlData.hasModelChanged = true;
        });
      });
    },
    initLayerWatcher: function initLayerWatcher() {
      var _this4 = this;

      var model = this.model;
      var reMaterials = /Materials/;
      var keys = Object.keys(model.layers[0]);
      var materialTypes = keys.filter(function (key) {
        return reMaterials.test(key);
      });
      var modelProps = keys.filter(function (key) {
        return !reMaterials.test(key);
      });

      var handleByUpdateMaterials = function handleByUpdateMaterials(target) {
        return _this4.$watch(target, function () {
          _this4.controlData.hasMaterialsChanged = true;
        });
      };

      var handleByUpdateModel = function handleByUpdateModel(target) {
        return _this4.$watch(target, function () {
          _this4.controlData.hasModelChanged = true;
        });
      };

      this.model.layers.forEach(function (layer, i) {
        materialTypes.forEach(function (materialType) {
          var getMaterialsProp = function getMaterialsProp(prop) {
            return _this4.model.layers[i][materialType][prop];
          };

          handleByUpdateMaterials(function () {
            return getMaterialsProp('metalRoughness');
          });
          handleByUpdateMaterials(function () {
            return getMaterialsProp('normal');
          });
          handleByUpdateMaterials(function () {
            return getMaterialsProp('scale');
          });
          handleByUpdateMaterials(function () {
            return Object.assign({}, _cloneDeep(getMaterialsProp('albedo')));
          });

          if (getMaterialsProp('enable') !== undefined) {
            handleByUpdateMaterials(function () {
              return getMaterialsProp('enable');
            });
          }

          handleByUpdateMaterials(function () {
            return getMaterialsProp('metalStrength');
          });
          handleByUpdateMaterials(function () {
            return getMaterialsProp('roughnessStrength');
          });
          handleByUpdateMaterials(function () {
            return getMaterialsProp('albedoStrength');
          });
          handleByUpdateMaterials(function () {
            return getMaterialsProp('normalStrength');
          });
          handleByUpdateMaterials(function () {
            return getMaterialsProp('normalDisable');
          });
        });
        modelProps.forEach(function (prop) {
          handleByUpdateModel(function () {
            return _this4.model.layers[i][prop];
          });
        });
      });
    },
    initRenderer: function initRenderer() {
      var _this5 = this;

      return _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee3() {
        return _regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _this5.model.resize = 1; // 用来调节编辑窗口拖拽控制点数量

                _this5.model.$fontData = _this5.getFontData();
                _context3.next = 4;
                return _this5.initPreviewCanvas();

              case 4:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3);
      }))();
    },
    multipleRender: function multipleRender(needUpdateImageUrl) {
      var _this6 = this;

      return _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee4() {
        return _regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                if (needUpdateImageUrl === void 0) {
                  needUpdateImageUrl = true;
                }

                if (!_this6.editor.global.$draging) {
                  _context4.next = 3;
                  break;
                }

                return _context4.abrupt("return");

              case 3:
                _this6.isRendering = true;

                if (needUpdateImageUrl) {
                  _this6.model.imageUrl = null;
                }

                if (_this6.renderInitOver) {
                  _context4.next = 8;
                  break;
                }

                _context4.next = 8;
                return _this6.initRenderer();

              case 8:
                _context4.prev = 8;
                setTimeout(function () {
                  _this6.isNeedTime = true;
                }, 400);
                _this6.controlData.compositeZoom = _this6.global.zoom * window.devicePixelRatio;
                _context4.next = 13;
                return _this6.editor.safeThreeTextRender(_this6.controlData, _this6.model, _this6.canvas);

              case 13:
                _this6.setBBox();

                _this6.initControlData();

                if (!_this6.layerPickerSignal && _this6.isDesignMode) {
                  _this6.layerPickerSignal = true;

                  _this6.editor.lazyUpdatePicker();
                }

                _this6.need2DText = false;
                _context4.next = 24;
                break;

              case 19:
                _context4.prev = 19;
                _context4.t0 = _context4["catch"](8);
                _this6.need2DText = true;
                console.error(_context4.t0);

                _this6.$events.$emit('element.loadError', _context4.t0, _this6.model);

              case 24:
                _this6.isNeedTime = false;
                _this6.isRendering = false; // this.$events.$emit('element.loaded', this.model);

                _this6.scaleRatio = 1;
                _this6.compositeScaleRatio = _this6.scaleRatio * _this6.global.zoom / _this6.canvas.compositeZoom;

              case 28:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, null, [[8, 19]]);
      }))();
    },
    setBBox: function setBBox() {
      var model = this.model,
          canvas = this.canvas;
      var modelCube = canvas.modelCube,
          compositeZoom = canvas.compositeZoom;

      if (modelCube) {
        model.modelCube.forEach(function (val, i) {
          model.modelCube[i] = modelCube[i];
        });
        var top = model.top,
            left = model.left,
            width = model.width,
            height = model.height,
            rotation = model.rotation;
        var x = (-0.5 - model.centerRatioX) * width;
        var y = (-0.5 - model.centerRatioY) * height;
        var diviateX = x * Math.cos(rotation) - y * Math.sin(rotation);
        var diviateY = x * Math.sin(rotation) + y * Math.cos(rotation);
        var centerX = left + 0.5 * width + diviateX,
            centerY = top + 0.5 * height + diviateY;
        width = (modelCube[1] - modelCube[0]) * 0.5 * canvas.width / compositeZoom;
        height = (modelCube[3] - modelCube[2]) * 0.5 * canvas.height / compositeZoom;
        model.centerRatioX = modelCube[0] / (modelCube[1] - modelCube[0]);
        model.centerRatioY = -modelCube[3] / (modelCube[3] - modelCube[2]);
        x = (0.5 + model.centerRatioX) * width;
        y = (0.5 + model.centerRatioY) * height;
        diviateX = x * Math.cos(rotation) - y * Math.sin(rotation);
        diviateY = x * Math.sin(rotation) + y * Math.cos(rotation);
        var newLeft = centerX + diviateX - 0.5 * width;
        var newTop = centerY + diviateY - 0.5 * height;
        var dw = width - model.width;
        var dh = height - model.height;

        if (!isNaN(newLeft * newTop) && Math.hypot(dw, dh) > 0.1) {
          model.left = newLeft;
          model.top = newTop;
          model.width = width;
          model.height = height;
          var groups = this.editor.getParentGroups(this.model); // groups 🈶️浅入深，应反向更新

          for (var i = groups.length - 1; i >= 0; i--) {
            this.$events.$emit('group.boundingReset', groups[i]);
          }
        }
      }
    },
    getFontData: function getFontData() {
      return this.options.fontsMap[this.model.fontFamily || this.options.defaultFont];
    },
    // 欧妮说编辑态颜色应该和3D文字颜色同步
    syncColorToContents: function syncColorToContents() {
      var _this7 = this;

      this.$watch(function () {
        var frontMaterials = _this7.model.layers[0].frontMaterials;
        return frontMaterials.albedo.color;
      }, function (color) {
        _this7.model.contents.forEach(function (content) {
          content.color = color;
        });
      });
    }
  },
  events: {
    'element.transformStart': function elementTransformStart(model) {
      if (model !== this.model) return;
      this.oldWith = this.model.width;
      this.oldFontSize = this.model.fontSize;
      this.oldLetterSpacing = this.model.letterSpacing;
    },
    'element.transformResize': function elementTransformResize(drag, model) {
      var _this8 = this;

      if (model !== this.model) return;
      this.scaleRatio = this.model.width / this.oldWith;
      var canvasScaleRaito = this.global.zoom / (this.canvas && this.canvas.compositeZoom || 1);
      this.compositeScaleRatio = this.scaleRatio * canvasScaleRaito;
      this.model.fontSize = this.oldFontSize * this.scaleRatio; // 编辑态拖拽显示框修改文字大小

      this.model.contents.forEach(function (text) {
        _this8.$set(text, 'fontSize', _this8.model.fontSize);
      });
      this.model.letterSpacing = this.oldLetterSpacing * this.scaleRatio;
    },
    'element.transformEnd': function elementTransformEnd(model, drag, _ref) {
      var action = _ref.action;

      if (this.isModelRelative(model) && action === 'resize') {
        this.controlData.hasCanvasResize = true;
        this.multipleRender();
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
    }
  },
  watch: {
    // 非常高耗的操作，节流
    'controlData.hasModelChanged': function controlDataHasModelChanged(val) {
      var _this9 = this;

      if (val) {
        if (!this._lazyModelRender) {
          this._lazyModelRender = _throttle( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee5() {
            return _regeneratorRuntime.wrap(function _callee5$(_context5) {
              while (1) {
                switch (_context5.prev = _context5.next) {
                  case 0:
                    _this9.scaleRatio = 1;
                    _context5.next = 3;
                    return _this9.multipleRender();

                  case 3:
                  case "end":
                    return _context5.stop();
                }
              }
            }, _callee5);
          })), 2000);
        }

        this._lazyModelRender();
      }
    },
    // 高频操作
    'model.fontSize': function modelFontSize() {
      this.hasCanvasResize = true;
      this.multipleRender();
    },
    'controlData.hasMaterialsChanged': function controlDataHasMaterialsChanged(val) {
      if (val) {
        this.multipleRender();
      }
    },
    'model.fontFamily': function modelFontFamily() {
      this.controlData.hasFontChanged = true;
      this.controlData.hasModelChanged = true;
      this.model.$fontData = this.getFontData();
    },
    'model.rotate3d': function modelRotate3d() {
      // 高频调用
      this.controlData.hasCameraChanged = true;
      this.multipleRender();
    },
    'global.zoom': function globalZoom(val) {
      // ppt 模式下 this.global.$loaded 一直为 false， 需要获取当前 layout 的状态
      if (this.global.$loaded || this.editor.currentLayout.$loaded) {
        this.controlData.compositeZoom = val;
        this.multipleRender(false);
      }
    }
  }
});