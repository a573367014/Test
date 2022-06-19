import _extends from "@babel/runtime/helpers/extends";
import _asyncToGenerator from "@babel/runtime/helpers/asyncToGenerator";
import _createClass from "@babel/runtime/helpers/createClass";
import _assertThisInitialized from "@babel/runtime/helpers/assertThisInitialized";
import _inheritsLoose from "@babel/runtime/helpers/inheritsLoose";
import _cloneDeep from "lodash/cloneDeep";
import _set from "lodash/set";
import _get from "lodash/get";
import _regeneratorRuntime from "@babel/runtime/regenerator";
import { createCanvas } from "@gaoding/editor-utils/lib/canvas";
import utils from "@gaoding/editor-framework/lib/utils/utils";
import BaseModel from "@gaoding/editor-framework/lib/base/element-base-model";
import transformMath from "@gaoding/editor-utils/lib/transform-math";
import { getRepeat, renderRepeat as _renderRepeat, isTextElement, aggregatedTextColors, aggregatedImageColors } from "./utils";
import { isGroup } from "@gaoding/editor-utils/lib/element";
import editorDefaults from "@gaoding/editor-framework/lib/base/editor-defaults";

var WatermarkModel = /*#__PURE__*/function (_BaseModel) {
  _inheritsLoose(WatermarkModel, _BaseModel);

  function WatermarkModel(data) {
    var _this;

    // 废弃水印元素 FullScreenInfo.Repeat 字段
    if (_get(data, 'fullScreenInfo.leftIndent') === undefined && _get(data, 'fullScreenInfo.repeat')) {
      var repeat = data.fullScreenInfo.repeat;
      var repeatItem = repeat[0];

      _set(data, 'fullScreenInfo.leftIndent', _get(repeat, '[1].leftIndent', 0));

      _set(data, 'fullScreenInfo.colGap', _get(repeatItem, 'colGap', 0));

      _set(data, 'fullScreenInfo.rowGap', _get(repeatItem, 'rowGap', 0));

      _set(data, 'template.transform', _get(repeatItem, 'transform', _cloneDeep(editorDefaults.element.transform)));
    }

    _this = _BaseModel.call(this, data) || this;

    _this.setTemplate(data.template);

    var isFullScreenWatermark = data.waterType === 1;
    _this.rotatable = !isFullScreenWatermark;
    _this.dragable = !isFullScreenWatermark; // 通过监听 renderVersion 判断是否要更新水印

    _this.$renderVersion = 0;
    _this.$renderInCanvas = false;
    _this.$repeatImageUrl = '';
    _this.$repeatImageWidth = 0;
    _this.$repeatImageHeight = 0;
    _this.cellTransform = _this.parseTransform(data.cellTransform);

    if (_this.cellWidth === 0 || _this.cellHeight === 0) {
      _this.cellWidth = _get(_assertThisInitialized(_this), 'template.width', 0);
      _this.cellHeight = _get(_assertThisInitialized(_this), 'template.height', 0);
    }

    delete _this.fullScreenInfo.repeat;
    return _this;
  }

  var _proto = WatermarkModel.prototype;

  _proto.setTemplate = function setTemplate(template) {
    var _this2 = this;

    // 从 template 中找出打标后的 LOGO 与 INFO 元素
    this.$infoModels = [];
    this.$logoModel = null;
    this.$backgroundModel = null;
    this.$titleModel = null;
    this.$textModels = []; // 缓存可以改变颜色的文字元素

    this.$effectModels = []; // 缓存可以改变颜色的图片、svg 元素

    this.$info = [];
    utils.walkTemplet(function (element) {
      if (element.category === 'LOGO') {
        _this2.$logoModel = element;
      } else if (element.category === 'INFO') {
        _this2.$infoModels.push(element);
      } else if (element.category === 'BG') {
        _this2.$backgroundModel = element;
      } else if (element.category === 'H1') {
        _this2.$titleModel = element;
      }

      if (element.colorChange) {
        if (['text', 'threeText', 'styleText'].includes(element.type)) {
          _this2.$textModels.push(element);
        } else if (['image', 'mask', 'svg'].includes(element.type) && element.category !== 'BG') {
          _this2.$effectModels.push(element);
        }
      }

      if (element.autoAdaptive !== 0 && ['text', 'threeText', 'styleText'].includes(element.type)) {
        element.autoAdaptive = 2;
      } // 设置属性关闭组元素重算包围盒


      if (isGroup(element)) {
        element.$inWatermark = true;
      }
    }, true, [template]);
    template.transform = this.parseTransform(template.transform);
    template.$inWatermark = true;
    this.template = template;
  }
  /**
   * 映射到 watermark.logo.url
   */
  ;

  /**
   * 绘制单元水印
   */
  _proto.renderCell =
  /*#__PURE__*/
  function () {
    var _renderCell = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(editor) {
      return _regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              this.$cellCanvas = null;
              this.$repeatCanvas = null;
              this.$fullScreenCanvas = null;
              _context.next = 5;
              return editor.elementToCanvas(this.template);

            case 5:
              this.$cellCanvas = _context.sent;
              return _context.abrupt("return", this.$cellCanvas);

            case 7:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    function renderCell(_x) {
      return _renderCell.apply(this, arguments);
    }

    return renderCell;
  }()
  /**
   * 绘制最小重复单元
   */
  ;

  _proto.renderRepeat =
  /*#__PURE__*/
  function () {
    var _renderRepeat2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2(editor) {
      var repeat, canvas;
      return _regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              this.$fullScreenCanvas = null;
              this.$repeatCanvas = null;

              if (this.$cellCanvas) {
                _context2.next = 5;
                break;
              }

              _context2.next = 5;
              return this.renderCell(editor);

            case 5:
              repeat = getRepeat(this);
              canvas = _renderRepeat(this.$cellCanvas, repeat);
              this.$repeatCanvas = canvas;
              return _context2.abrupt("return", canvas);

            case 9:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this);
    }));

    function renderRepeat(_x2) {
      return _renderRepeat2.apply(this, arguments);
    }

    return renderRepeat;
  }()
  /**
   * 绘制全屏水印
   */
  ;

  _proto.renderFullScreen =
  /*#__PURE__*/
  function () {
    var _renderFullScreen = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee3(editor) {
      var repeatCanvas, width, height, fullScreenInfo, left, top, canvas, context, offsetLeft, offsetTop;
      return _regeneratorRuntime.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              this.$fullScreenCanvas = null;

              if (this.$repeatCanvas) {
                _context3.next = 4;
                break;
              }

              _context3.next = 4;
              return this.renderRepeat(editor);

            case 4:
              repeatCanvas = this.$repeatCanvas;
              width = this.width, height = this.height, fullScreenInfo = this.fullScreenInfo;
              left = fullScreenInfo.left, top = fullScreenInfo.top;
              canvas = createCanvas(width, height);
              context = canvas.getContext('2d');
              context.save();
              offsetLeft = left % repeatCanvas.width;

              if (offsetLeft > 0) {
                offsetLeft = offsetLeft - repeatCanvas.width;
              }

              offsetTop = top % repeatCanvas.height;

              if (offsetTop > 0) {
                offsetTop = offsetTop - repeatCanvas.height;
              }

              context.translate(offsetLeft, offsetTop);
              context.fillStyle = context.createPattern(repeatCanvas, 'repeat');
              context.fillRect(0, 0, width + Math.abs(offsetLeft), height + Math.abs(offsetTop));
              context.restore();
              this.$fullScreenCanvas = canvas;
              return _context3.abrupt("return", canvas);

            case 20:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3, this);
    }));

    function renderFullScreen(_x3) {
      return _renderFullScreen.apply(this, arguments);
    }

    return renderFullScreen;
  }();

  _proto.resizeCell = function resizeCell(width, height) {
    var cellWidth = this.cellWidth,
        $infoModels = this.$infoModels;
    this.cellWidth = width;
    this.cellHeight = height;
    var ratio = width / cellWidth;
    $infoModels.forEach(function (infoModel) {
      infoModel.elements.forEach(function (element) {
        var relation = element.relation;

        if (relation) {
          var offset = relation.offset,
              defaultOffset = relation.defaultOffset;
          [offset, defaultOffset].filter(function (offset) {
            return offset;
          }).forEach(function (offset) {
            ['left', 'top', 'width', 'height'].forEach(function (key) {
              offset[key] *= ratio;
            });
          });
        }
      });
    });
  } // 序列化水印
  ;

  _proto.exportData = function exportData() {
    // 兼容 repeat 字段
    var cloneData = _extends({}, this);

    var fullScreenInfo = cloneData.fullScreenInfo,
        template = cloneData.template;
    var repeat = [];
    repeat[0] = {
      colGap: fullScreenInfo.colGap,
      rowGap: fullScreenInfo.rowGap,
      transform: template.transform,
      leftIndent: 0
    };

    if (fullScreenInfo.leftIndent !== 0) {
      repeat[1] = {
        colGap: fullScreenInfo.colGap,
        rowGap: fullScreenInfo.rowGap,
        transform: template.transform,
        leftIndent: fullScreenInfo.leftIndent
      };
    }

    fullScreenInfo.repeat = repeat;
    return cloneData;
  };

  _createClass(WatermarkModel, [{
    key: "url",
    get: function get() {
      return this.logo.url;
    },
    set: function set(value) {
      this.logo.url = value;
    }
  }, {
    key: "rotate",
    get: function get() {
      return transformMath.radToDeg(this.rotation);
    },
    set: function set(deg) {
      if (this.waterType === 1) return;
      this.transform.rotation = transformMath.degToRad(deg);
    }
  }, {
    key: "scaleX",
    get: function get() {
      return this.transform.scale.x;
    },
    set: function set(v) {
      if (this.waterType === 1) return;
      this.transform.scale.x = v;
    }
  }, {
    key: "scaleY",
    get: function get() {
      return this.transform.scale.y;
    },
    set: function set(v) {
      if (this.waterType === 1) return;
      this.transform.scale.y = v;
    }
  }, {
    key: "skewX",
    get: function get() {
      return this.transform.skew.x;
    },
    set: function set(v) {
      if (this.waterType === 1) return;
      this.transform.skew.x = v;
    }
  }, {
    key: "skewY",
    get: function get() {
      return this.transform.skew.y;
    },
    set: function set(v) {
      if (this.waterType === 1) return;
      this.transform.skew.y = v;
    }
  }, {
    key: "aggregatedColors",
    get: function get() {
      var colors = [{
        key: 'textColor',
        color: null
      }, {
        key: 'effectColor',
        color: null
      }, {
        key: 'backgroundColor',
        color: null
      }];
      this.$textModels.forEach(function (textModel) {
        var _aggregatedTextColors = aggregatedTextColors(textModel),
            textColor = _aggregatedTextColors.textColor,
            effectColor = _aggregatedTextColors.effectColor;

        if (textColor) {
          colors[0].color = textColor;
        }

        if (effectColor) {
          colors[1].color = effectColor;
        }
      });
      this.$effectModels.forEach(function (effectModel) {
        var effectColor = aggregatedImageColors(effectModel);

        if (effectColor) {
          var index = effectModel.category === 'ICON' ? 0 : 1;
          colors[index].color = effectColor;
        }
      });

      if (this.$backgroundModel) {
        var backgroundColor = aggregatedImageColors(this.$backgroundModel);

        if (backgroundColor) {
          colors[2].color = backgroundColor;
        }
      }

      return colors.filter(function (color) {
        return color.color;
      });
    }
    /** 聚合水印中的字体属性 */

  }, {
    key: "aggregatedFonts",
    get: function get() {
      var $titleModel = this.$titleModel,
          $infoModels = this.$infoModels;
      var aggregatedFonts = [];

      if ($titleModel) {
        aggregatedFonts.push({
          fontFamily: $titleModel.fontFamily,
          fontStyle: $titleModel.fontStyle,
          fontWeight: $titleModel.fontWeight,
          linkedId: $titleModel.$id
        });
      }

      $infoModels.forEach(function (infoModel) {
        var textModel = infoModel;

        if (isGroup(textModel)) {
          textModel = infoModel.elements.find(function (element) {
            return isTextElement(element.type);
          });
        }

        if (isTextElement(textModel)) {
          aggregatedFonts.push({
            fontFamily: textModel.fontFamily,
            fontStyle: textModel.fontStyle,
            fontWeight: textModel.fontWeight,
            linkedId: textModel.$id
          });
        }
      });
      return aggregatedFonts;
    }
  }, {
    key: "title",
    get: function get() {
      var $titleModel = this.$titleModel;

      if ($titleModel) {
        return $titleModel.content;
      }

      return undefined;
    },
    set: function set(value) {}
  }, {
    key: "info",
    get: function get() {
      var $infoModels = this.$infoModels;
      if (!$infoModels) return [];
      return $infoModels.map(function (infoModel) {
        var info = {
          type: null,
          content: null
        };

        if (isTextElement(infoModel)) {
          info.content = infoModel.content;
        } else if (isGroup(infoModel)) {
          utils.walkTemplet(function (element) {
            if (isTextElement(element)) {
              info.content = element.content;
            } else if (element.type === 'svg') {
              info.type = element.iconType;
            }
          }, true, [infoModel]);
        }

        return info;
      });
    },
    set: function set(value) {}
  }, {
    key: "infoCount",
    get: function get() {
      return this.$infoModels.length;
    }
  }, {
    key: "fontFamily",
    get: function get() {
      var aggregatedFonts = this.aggregatedFonts,
          fontFamilyMixed = this.fontFamilyMixed;

      if (fontFamilyMixed || aggregatedFonts.length === 0) {
        return null;
      }

      return aggregatedFonts[0].fontFamily;
    },
    set:
    /**
     * 这些 set 方法是为了防止 changeElement 的时候污染了 watermark 的 json 结构
     */

    /* eslint-disable @typescript-eslint/adjacent-overload-signatures,@typescript-eslint/no-empty-function */
    function set(value) {}
  }, {
    key: "fontWeight",
    get: function get() {
      var aggregatedFonts = this.aggregatedFonts,
          fontFamilyMixed = this.fontFamilyMixed;

      if (fontFamilyMixed || aggregatedFonts.length === 0) {
        return null;
      }

      return aggregatedFonts[0].fontWeight;
    },
    set: function set(value) {}
  }, {
    key: "fontStyle",
    get: function get() {
      var aggregatedFonts = this.aggregatedFonts,
          fontFamilyMixed = this.fontFamilyMixed;

      if (fontFamilyMixed || aggregatedFonts.length === 0) {
        return null;
      }

      return aggregatedFonts[0].fontStyle;
    },
    set: function set(value) {}
  }, {
    key: "fontFamilyMixed",
    get: function get() {
      var aggregatedFonts = this.aggregatedFonts;
      var font = aggregatedFonts[0];

      if (font) {
        return aggregatedFonts.some(function (otherFont, index) {
          return index > 0 && otherFont.fontFamily !== font.fontFamily && otherFont.fontWeight !== font.fontWeight && otherFont.fontStyle !== font.fontStyle;
        });
      }

      return false;
    }
  }, {
    key: "hasLogo",
    get: function get() {
      return !!this.$logoModel;
    }
  }, {
    key: "hasTitle",
    get: function get() {
      return !!this.$titleModel;
    }
  }, {
    key: "hasInfo",
    get: function get() {
      return this.$infoModels.length > 0;
    }
  }]);

  return WatermarkModel;
}(BaseModel);

export default WatermarkModel;