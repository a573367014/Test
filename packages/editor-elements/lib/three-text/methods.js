import _asyncToGenerator from "@babel/runtime/helpers/asyncToGenerator";
import _pick from "lodash/pick";
import _merge from "lodash/merge";
import _regeneratorRuntime from "@babel/runtime/regenerator";
import { serialize } from "@gaoding/editor-framework/lib/utils/utils";
import editorDefaults from "@gaoding/editor-framework/lib/base/editor-defaults";
import ThreeTextRenderer from "@gaoding/editor-framework/lib/utils/three-text";
export default {
  /**
   * 变更单个文本元素富文本内容
   * @memberof EditorTreeTextMixin
   * @param  {object} props    多个属性对象
   * @param  {textElement} element 文本元素
   * @param  {boolean} makeSnapshot 保存快照
   */
  changeThreeTextContents: function changeThreeTextContents(props, element, makeSnapshot) {
    element = this.getElement(element);
    var richText = this.currentRichText;
    if (element.type !== 'threeText') return;

    if (!element.$editing) {
      // 还未进入编辑状态时, 数据控制contents更新
      element.contents = serialize.injectStyleProps(element.contents, props);

      _merge(element, props);

      makeSnapshot && this.makeSnapshotByElement(element);
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
   * @param  {element} element - 被转换3D文字元素
   * @param  {layout} layout  - 元素所在的布局
   * @return {element}        创建的普通文字元素
   */
  convertThreeTextToText: function convertThreeTextToText(element, layout) {
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

    var data = _pick(element, props); // image props


    data.type = 'text';
    data.resize = 5;
    data.version = editorDefaults.version;

    var getColor = function getColor(albedo) {
      return [albedo.color, '#000000', albedo.gradient.stops[0].color][albedo.type];
    };

    data.color = getColor(element.layers[0].frontMaterials.albedo);
    this.calculateBox(data);
    var centerX = element.left - element.centerRatioX * element.width;
    var centerY = element.top - element.centerRatioY * element.height;
    data.left = centerX - 0.5 * data.width;
    data.top = centerY - 0.5 * data.height;
    var newElement = this.replaceElement(element, data, layout);
    this.focusElement(newElement);
    return newElement;
  },
  safeThreeTextRender: function safeThreeTextRender(controlData, model, canvas) {
    var _this = this;

    return _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee() {
      return _regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              if (!_this.$threeTextRenderer) {
                _this.$threeTextRenderer = new ThreeTextRenderer();
              }

              _context.prev = 1;
              _context.next = 4;
              return _this.$threeTextRenderer.requestRenderAll(controlData, model, canvas);

            case 4:
              _context.next = 9;
              break;

            case 6:
              _context.prev = 6;
              _context.t0 = _context["catch"](1);
              console.info(_context.t0);

            case 9:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, null, [[1, 6]]);
    }))();
  },
  getThreeTextCanvas: function getThreeTextCanvas(element) {
    var _this2 = this;

    return _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2() {
      var sourceCanvas, controlData, canvas, ctx, width, height, _sourceCanvas$modelCu, modelCube, sx, sy, sWidth, sHeight;

      return _regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              sourceCanvas = document.createElement('canvas'); // 出图以两倍清晰度出图，风险，超大尺寸溢出

              controlData = {
                compositeZoom: 2,
                hasCanvasResize: true
              };
              _context2.next = 4;
              return _this2.safeThreeTextRender(controlData, element, sourceCanvas);

            case 4:
              canvas = document.createElement('canvas');
              ctx = canvas.getContext('2d');
              width = sourceCanvas.width, height = sourceCanvas.height, _sourceCanvas$modelCu = sourceCanvas.modelCube, modelCube = _sourceCanvas$modelCu === void 0 ? [-1, 1, -1, 1] : _sourceCanvas$modelCu;
              canvas.width = element.width;
              canvas.height = element.height;
              sx = Math.floor((modelCube[0] + 1) / 2 * width);
              sy = Math.floor((1 - modelCube[3]) / 2 * height); // 3D文字尺寸较小时，使用后者数据得到图更清晰

              sWidth = width >= 4096 ? Math.floor((modelCube[1] - modelCube[0]) / 2 * width) : canvas.width * controlData.compositeZoom;
              sHeight = width >= 4096 ? Math.floor((modelCube[3] - modelCube[2]) / 2 * height) : canvas.height * controlData.compositeZoom;
              ctx.drawImage(sourceCanvas, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
              return _context2.abrupt("return", canvas);

            case 15:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2);
    }))();
  }
};