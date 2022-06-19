import _asyncToGenerator from "@babel/runtime/helpers/asyncToGenerator";
import _pick from "lodash/pick";
import _regeneratorRuntime from "@babel/runtime/regenerator";
import editorDefaults from "@gaoding/editor-framework/lib/base/editor-defaults";
import convertSvgElementToImg from "@gaoding/editor-framework/lib/utils/convert-svg";
import autoStretchImage from "@gaoding/editor-utils/lib/auto-stretch-image";
import autoPatchImage from "@gaoding/editor-framework/lib/utils/auto-patch-image";
export default {
  /**
   * 点9元素转换为图片元素
   * @memberof EditorNinePatchElementMixin
   * @param  {element} element 被转换点9元素
   * @param  {layout} layout 元素所在的布局
   * @return {Promise} element 创建的图片元素
   */
  convertNinePatchToImage: function convertNinePatchToImage(element, layout) {
    var _this = this;

    return _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee() {
      var defaultElement, defaultImageElement, props, data, newElement;
      return _regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              element = _this.getElement(element);

              if (element) {
                _context.next = 3;
                break;
              }

              return _context.abrupt("return");

            case 3:
              defaultElement = editorDefaults.element;
              defaultImageElement = editorDefaults.imageElement;
              props = [].concat(Object.keys(defaultImageElement)).concat(Object.keys(defaultElement));
              data = _pick(element, props); // image props

              data.type = 'image';
              _context.next = 10;
              return autoStretchImage(element.url, {
                targetWidth: Math.round(element.width),
                targetHeight: Math.round(element.height),
                imageSlice: element.imageSlice,
                targetImageSlice: {
                  left: element.imageSlice.left * element.effectScale,
                  top: element.imageSlice.top * element.effectScale,
                  right: element.imageSlice.right * element.effectScale,
                  bottom: element.imageSlice.bottom * element.effectScale
                }
              }).then(function (canvas) {
                if (_this.options.resource.blobUrlEnable) {
                  return new Promise(function (resolve) {
                    canvas.toBlob(function (blob) {
                      resolve(URL.createObjectURL(blob));
                    }, 'image/png', 1);
                  });
                }

                return canvas.toDataURL('image/png', 1);
              });

            case 10:
              data.url = _context.sent;
              data.version = editorDefaults.version;
              newElement = _this.replaceElement(element, data, layout);

              _this.focusElement(newElement);

              return _context.abrupt("return", newElement);

            case 15:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }))();
  },

  /**
   * 点svg、image、mask换为点9元素
   * @memberof EditorNinePatchElementMixin
   * @param  {element} element - 被转换的元素
   * @param  {layout} layout  - 元素所在的布局
   * @return {Promise} element 创建的图片元素
   */
  convertElementToNinePatch: function convertElementToNinePatch(element, layout) {
    var _this2 = this;

    return _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2() {
      var defaultElement, defaultImageElement, props, data, urlOrImg, vm, svgElement, titleNode, ret, _ret$offset, left, top, right, bottom, newElement;

      return _regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              element = _this2.getElement(element);

              if (element) {
                _context2.next = 3;
                break;
              }

              return _context2.abrupt("return");

            case 3:
              defaultElement = editorDefaults.element;
              defaultImageElement = editorDefaults.ninePatchElement;
              props = [].concat(Object.keys(defaultImageElement)).concat(Object.keys(defaultElement));
              data = _pick(element, props);

              if (!(element.type === 'svg')) {
                _context2.next = 18;
                break;
              }

              vm = _this2.getComponentById(element.$id);
              svgElement = vm && vm.$el.querySelector('svg');

              if (!svgElement) {
                _context2.next = 16;
                break;
              }

              titleNode = svgElement.querySelector('title');
              titleNode && svgElement.removeChild(titleNode);
              _context2.next = 15;
              return convertSvgElementToImg(svgElement);

            case 15:
              urlOrImg = _context2.sent;

            case 16:
              _context2.next = 19;
              break;

            case 18:
              urlOrImg = element.url;

            case 19:
              // image props
              data.type = 'ninePatch';
              _context2.next = 22;
              return autoPatchImage(urlOrImg, {
                blobUrlEnable: _this2.options.resource.blobUrlEnable
              });

            case 22:
              ret = _context2.sent;
              _ret$offset = ret.offset, left = _ret$offset.left, top = _ret$offset.top, right = _ret$offset.right, bottom = _ret$offset.bottom;
              data.url = ret.image;
              data.version = editorDefaults.version;
              data.imageSlice = {
                left: left,
                top: top,
                right: Math.max(0, ret.width - right - 1),
                bottom: Math.max(0, ret.height - bottom - 1)
              };
              newElement = _this2.replaceElement(element, data, layout);

              _this2.focusElement(newElement);

              return _context2.abrupt("return", newElement);

            case 30:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2);
    }))();
  }
};