import _asyncToGenerator from "@babel/runtime/helpers/asyncToGenerator";
import _regeneratorRuntime from "@babel/runtime/regenerator";
import throttle from 'lodash/throttle';
import debounce from 'lodash/debounce';
import inherit from "@gaoding/editor-framework/lib/utils/vue-inherit";
import BaseElement from "@gaoding/editor-framework/lib/base/base-element";
import template from "./watermark.html";
import { isBase64 } from "@gaoding/editor-utils/lib/string";
export default inherit(BaseElement, {
  name: 'watermark-element',
  template: template,
  props: ['global', 'model', 'options', 'editor'],
  data: function data() {
    return {
      initDfd: false,
      loadDfd: null,
      componentLoaded: false,
      backgroundModel: null,
      parentLayout: null
    };
  },
  computed: {
    cssStyle: function cssStyle() {
      var rect = this.rect;
      var padding = rect.padding;
      return {
        height: rect.height + padding[0] + padding[2] + 'px',
        width: rect.width + padding[1] + padding[3] + 'px'
      };
    },
    watermarkImageStyle: function watermarkImageStyle() {
      var zoom = this.global.zoom;
      var _this$model = this.model,
          width = _this$model.width,
          height = _this$model.height,
          left = _this$model.left,
          top = _this$model.top;
      return {
        width: width * zoom + "px",
        height: height * zoom + "px",
        left: left * zoom + "px",
        top: top * zoom + "px"
      };
    },
    watermarkStyle: function watermarkStyle() {
      var model = this.model,
          global = this.global;
      var zoom = global.zoom;
      var fullScreenInfo = model.fullScreenInfo,
          width = model.width,
          height = model.height,
          $repeatImageUrl = model.$repeatImageUrl,
          $repeatImageWidth = model.$repeatImageWidth,
          $repeatImageHeight = model.$repeatImageHeight;
      var offsetLeft = fullScreenInfo.left * zoom;
      var offsetTop = fullScreenInfo.top * zoom;
      return {
        width: width * zoom + "px",
        height: height * zoom + "px",
        backgroundImage: "url(" + $repeatImageUrl + ")",
        backgroundSize: $repeatImageWidth * zoom + "px " + $repeatImageHeight * zoom + "px",
        backgroundRepeat: 'repeat',
        backgroundPosition: offsetLeft + "px " + offsetTop + "px"
      };
    },
    waterType: function waterType() {
      return this.model.waterType;
    },
    editing: function editing() {
      return this.model.$editing;
    },
    renderInCanvas: function renderInCanvas() {
      return this.model.$renderInCanvas;
    }
  },
  watch: {
    'model.template': function modelTemplate() {
      if (this.isDesignMode) {
        this.templateInit();
        this.checkLoad();
      }
    },
    'model.$renderVersion': function model$renderVersion() {
      var _this = this;

      if (this.isDesignMode) {
        this.$nextTick(function () {
          _this.lazyRenderFullScreen(true);
        });
      }
    },
    'model.waterType': function modelWaterType() {
      if (this.isDesignMode) {
        this.onWaterTypeChange();
      }
    },
    'model.fullScreenInfo': {
      deep: true,
      handler: function handler() {
        if (this.isDesignMode && !this.editing) {
          this.lazyRenderFullScreen(false, true);
        }
      }
    },
    'model.template.transform': {
      deep: true,
      handler: function handler() {
        if (this.isDesignMode && !this.editing) {
          this.lazyRenderFullScreen(false, true);
        }
      }
    },
    'parentLayout.width': function parentLayoutWidth(width) {
      if (this.isDesignMode && this.waterType === 1) {
        this.model.width = width;
      }
    },
    'parentLayout.height': function parentLayoutHeight(height) {
      if (this.isDesignMode && this.waterType === 1) {
        this.model.height = height;
      }
    }
  },
  created: function created() {
    var _this2 = this;

    // this.lazyRenderToCanvas = throttle(() => {
    //     this.renderToCanvas();
    // }, 80);
    this.lazyRenderFullScreen = throttle(function (reRenderCell, reRenderRepeat) {
      if (_this2.model.waterType === 1) {
        _this2.renderFullScreen(reRenderCell, reRenderRepeat);
      }
    }, 80, {
      trailing: true
    });
    this.lazyExportImage = debounce(function () {
      return _this2.exportImage();
    }, 400, {
      leading: false
    });
    this.templateInit();
  },
  mounted: function mounted() {
    var _this3 = this;

    this.model.$getResizeLimit = function () {
      return {
        maxWidth: Infinity,
        minWidth: 20,
        maxHeight: Infinity,
        minHeight: 20
      };
    };

    this.parentLayout = this.editor.getLayoutByElement(this.model);
    this.$watch(function () {
      var _this3$model$fullScre = _this3.model.fullScreenInfo,
          left = _this3$model$fullScre.left,
          top = _this3$model$fullScre.top;
      return [left, top];
    }, function () {
      if (_this3.isDesignMode && !_this3.editing) {
        _this3.lazyRenderFullScreen();
      }
    });
    this.$watch(function () {
      var _this3$model = _this3.model,
          width = _this3$model.width,
          height = _this3$model.height;
      return [width, height];
    }, function () {
      if (_this3.isDesignMode) {
        _this3.updateSize();
      }
    });
    this.$watch(function () {
      var _this3$model2 = _this3.model,
          left = _this3$model2.left,
          top = _this3$model2.top;
      return [left, top];
    }, function () {
      if (_this3.isDesignMode) {
        _this3.updatePosition();
      }
    });
  },
  methods: {
    load: function load() {
      return this.loadDfd.promise;
    },
    initLoadDfd: function initLoadDfd() {
      var _this4 = this;

      var loadDfd = {};
      loadDfd.promise = new Promise(function (resolve, reject) {
        loadDfd.resolve = resolve;
        loadDfd.reject = reject;
      }).then( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee() {
        var _this4$model, waterType, imageUrl;

        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _this4$model = _this4.model, waterType = _this4$model.waterType, imageUrl = _this4$model.imageUrl;

                if (!(waterType === 1 && (!imageUrl || isBase64(imageUrl)))) {
                  _context.next = 5;
                  break;
                }

                _context.next = 4;
                return _this4.$nextTick();

              case 4:
                return _context.abrupt("return", _this4.renderFullScreen(true));

              case 5:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
      })));
      this.loadDfd = loadDfd;
      this.initDfd = false;
      this.$nextTick(function () {
        _this4.initDfd = true;
      });
    },
    // 记录水印模板中需要用到的数据与 cache
    templateInit: function templateInit() {
      this.initLoadDfd();
    },

    /**
     * 普通水印在元素宽高变化时，需要同步到内部的 group
     */
    updateSize: function updateSize() {
      var model = this.model,
          parentLayout = this.parentLayout;
      var waterType = model.waterType,
          width = model.width,
          height = model.height,
          template = model.template;

      if (waterType === 0) {
        template.width = width;
        template.height = height;
        model.resizeCell(width, height);
      } else {
        // 全屏水印限制元素尺寸为画布尺寸
        model.width = parentLayout.width;
        model.height = parentLayout.height;
        this.lazyRenderFullScreen();
      }
    },

    /**
     * 普通水印在位置发生变化时，需要同步到 cellLeft, cellTop
     */
    updatePosition: function updatePosition() {
      var _this$model2 = this.model,
          waterType = _this$model2.waterType,
          left = _this$model2.left,
          top = _this$model2.top;

      if (waterType === 0) {
        this.model.cellLeft = left;
        this.model.cellTop = top;
      } else {
        this.model.left = 0;
        this.model.top = 0;
      }
    },

    /**
     * 水印类型变化时，需要设置水印的尺寸与位置
     */
    onWaterTypeChange: function onWaterTypeChange() {
      var model = this.model;
      var waterType = model.waterType;

      if (waterType === 1) {
        this.renderFullScreen(true);
      }
    },
    renderFullScreen: function renderFullScreen(reRenderCell, reRenderRepeat) {
      var _this5 = this;

      return _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2() {
        var model, editor;
        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (reRenderCell === void 0) {
                  reRenderCell = false;
                }

                if (reRenderRepeat === void 0) {
                  reRenderRepeat = false;
                }

                model = _this5.model, editor = _this5.editor;

                if (!(!_this5.isInEditor && !_this5.isDesignMode)) {
                  _context2.next = 5;
                  break;
                }

                return _context2.abrupt("return");

              case 5:
                if (!reRenderCell) {
                  _context2.next = 8;
                  break;
                }

                _context2.next = 8;
                return model.renderCell(editor);

              case 8:
                if (!reRenderRepeat) {
                  _context2.next = 11;
                  break;
                }

                _context2.next = 11;
                return model.renderRepeat(editor);

              case 11:
                _this5.exportRepeatCanvas();

              case 12:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2);
      }))();
    },
    exportRepeatCanvas: function exportRepeatCanvas() {
      var _this6 = this;

      return _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee3() {
        var $repeatCanvas;
        return _regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                if (_this6.model.$repeatCanvas) {
                  _context3.next = 3;
                  break;
                }

                _context3.next = 3;
                return _this6.model.renderRepeat(_this6.editor);

              case 3:
                $repeatCanvas = _this6.model.$repeatCanvas;
                _this6.model.$repeatImageUrl = $repeatCanvas.toDataURL('image/png');
                _this6.model.$repeatImageWidth = $repeatCanvas.width;
                _this6.model.$repeatImageHeight = $repeatCanvas.height;
                _this6.model.$renderInCanvas = true;

                _this6.lazyExportFullCanvas();

              case 9:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3);
      }))();
    },
    lazyExportFullCanvas: function lazyExportFullCanvas() {
      var _this7 = this;

      return _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee5() {
        return _regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                if (!_this7._lazyExportFullCanvas) {
                  _this7._lazyExportFullCanvas = debounce( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee4() {
                    var $fullScreenCanvas, url;
                    return _regeneratorRuntime.wrap(function _callee4$(_context4) {
                      while (1) {
                        switch (_context4.prev = _context4.next) {
                          case 0:
                            _context4.next = 2;
                            return _this7.model.renderFullScreen(_this7.editor);

                          case 2:
                            $fullScreenCanvas = _this7.model.$fullScreenCanvas;

                            if (!_this7.options.resource.blobUrlEnable) {
                              _context4.next = 9;
                              break;
                            }

                            _context4.next = 6;
                            return new Promise(function (resolve) {
                              $fullScreenCanvas.toBlob(function (blob) {
                                resolve(URL.createObjectURL(blob));
                              }, 'image/png', 1);
                            });

                          case 6:
                            url = _context4.sent;
                            _context4.next = 10;
                            break;

                          case 9:
                            url = $fullScreenCanvas.toDataURL('image/png', 1);

                          case 10:
                            _this7.model.imageUrl = url;
                            _this7.model.imageWidth = $fullScreenCanvas.width;
                            _this7.model.imageHeight = $fullScreenCanvas.height;

                          case 13:
                          case "end":
                            return _context4.stop();
                        }
                      }
                    }, _callee4);
                  })), 200, {
                    leading: false,
                    trailing: true
                  });
                }

                return _context5.abrupt("return", _this7._lazyExportFullCanvas());

              case 2:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5);
      }))();
    }
  },
  events: {
    'element.loaded': function elementLoaded(model) {
      if (model === this.model.template) {
        this.loadDfd.resolve();
      }
    },
    'element.transformStart': function elementTransformStart(model, data) {
      if (model === this.model && model.waterType === 0) {
        this.$events.$emit('element.transformStart', model.template, data);
      }
    },
    'element.transformEnd': function elementTransformEnd(model, drag, data) {
      var _this8 = this;

      if (model === this.model && model.waterType === 0) {
        this.$events.$emit('element.transformEnd', model.template, drag, data); // 缩放结束后对其水印元素的宽高

        this.$nextTick(function () {
          var _this8$model = _this8.model,
              cellWidth = _this8$model.cellWidth,
              cellHeight = _this8$model.cellHeight,
              waterType = _this8$model.waterType;

          if (waterType === 0) {
            _this8.model.template.width = cellWidth;
            _this8.model.template.height = cellHeight;
          }
        });
      }
    },
    'element.watermarkUpdated': function elementWatermarkUpdated(element, reRenderCell, reRenderRepeat) {
      if (element === this.model) {
        this.lazyRenderFullScreen(reRenderCell, reRenderRepeat);
      }
    }
  }
});