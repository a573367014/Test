import _asyncToGenerator from "@babel/runtime/helpers/asyncToGenerator";
import _regeneratorRuntime from "@babel/runtime/regenerator";

/**
 * @class EditorImageElementMixin
 * @description 元素的专属方法
 */
import assign from 'lodash/assign';
import pickBy from 'lodash/pickBy';
import editorDefaults from "@gaoding/editor-framework/lib/base/editor-defaults";
import { filterRendererService } from "@gaoding/editor-framework/lib/utils/filter-renderer/service";
export default {
  /**
   * 添加图片元素
   * @memberof EditorImageElementMixin
   * @param {String} url - 图片路径
   * @param {Object} options - 图片其他参数，查看{@link module:editorDefaults.element|element}
   */
  addImage: function addImage(url, options) {
    var data = assign({
      type: 'image'
    }, options);
    data.url = url || this.options.placeImage;
    return this.addElement(data);
  },

  /**
   * 替换 `imageElement` 与 `maskElement` 图片
   * @memberof EditorImageElementMixin
   * @param {String} url - 新图片地址
   * @param {Object} options - 替换参数
   * @param {Boolean} [options.forwardEdit=true] - 替换后进入元素编辑状态 `showElementEditor`
   * @param {Number} [options.width] - 新图片的尺寸宽度
   * @param {Number} [options.height] - 新图片的尺寸高度
   * @param {element} element - 被替换的元素
   * @param {Boolean} makeSnapshot - 是否创建快照
   */
  replaceImage: function replaceImage(url, options, element, makeSnapshot) {
    if (makeSnapshot === void 0) {
      makeSnapshot = true;
    }

    element = this.getElement(element);

    if (!element) {
      return;
    }

    var type = element.type;

    if (type !== 'image' && type !== 'mask') {
      return;
    }

    options = assign({
      forwardEdit: true
    }, options);
    var elementWidth = element.width;
    var elementHeight = element.height;
    var imgWidth = options.width || elementWidth;
    var imgHeight = options.height || elementHeight; // 短边放大，cover

    var ratio = Math.max(elementWidth / imgWidth, elementHeight / imgHeight);
    var width = imgWidth * ratio;
    var height = imgHeight * ratio;
    this.changeElement({
      url: url,
      naturalWidth: imgWidth,
      naturalHeight: imgHeight,
      imageTransform: element.parseTransform({
        a: 1,
        b: 0,
        c: 0,
        d: 1,
        tx: 0,
        ty: 0
      }),
      $imageWidth: width,
      $imageHeight: height
    }, element, makeSnapshot);

    if (options.forwardEdit && element !== this.currentSubElement) {
      if (type === 'image') {
        this.showImageCroper(element);
      } else if (type === 'mask') {
        this.showMaskEditor(element);
      }
    }
  },

  /**
   * `imageElement` 图片元素进入剪裁状态
   * @memberof EditorImageElementMixin
   * @param {element} element - 图片元素应用
   */
  showImageCroper: function showImageCroper(element) {
    element = this.getElement(element);
    this.currentCropElement = element;
  },

  /**
   * 编辑器的当前处于剪裁状态的 `imageElement` 图片元素，退出剪裁状态
   * @memberof EditorImageElementMixin
   */
  hideImageCroper: function hideImageCroper() {
    this.currentCropElement = null;
  },

  /**
   * 图片元素转换为蒙版元素
   * @memberof EditorImageElementMixin
   * @param  {element} element - 被转换图片元素
   * @param  {layout} layout  - 元素所在的布局
   * @return {element}        创建的蒙版元素
   */
  convertImageToMask: function convertImageToMask(element, layout) {
    element = this.getElement(element);

    if (!element || element.isVideo) {
      return;
    }

    var data = pickBy(element, function (v, k) {
      return k.charAt(0) !== '$';
    }); // mask props

    data.type = 'mask';
    data.mask = data.url;
    data.imageUrl = null;
    data.version = editorDefaults.version;
    var newElement = this.replaceElement(element, data, layout);
    this.focusElement(newElement);
    return newElement;
  },

  /**
   * 切换裁切状态下的内外框
   * @memberof EditorImageElementMixin
   */
  toggleCropperFocus: function toggleCropperFocus() {
    var currentElement = this.currentElement;

    if (!currentElement || currentElement.type !== '$masker' && currentElement.type !== '$croper') {
      return;
    }

    var isInnerActive = currentElement.resize === 7;
    var name = isInnerActive ? 'imageCroper.activeOuter' : 'imageCroper.activeInner';
    this.$events.$emit(name);
  },
  createFilterTask: function createFilterTask(image, zipUrl, isCancel) {
    return filterRendererService.getRender().then( /*#__PURE__*/function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2(render) {
        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return render.loadMaterial(zipUrl);

              case 2:
                return _context2.abrupt("return", render.engine.synchronize( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee() {
                  return _regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                      switch (_context.prev = _context.next) {
                        case 0:
                          if (!(typeof isCancel === 'function' && isCancel())) {
                            _context.next = 2;
                            break;
                          }

                          return _context.abrupt("return");

                        case 2:
                          return _context.abrupt("return", render.renderMaterial(image, zipUrl, 1));

                        case 3:
                        case "end":
                          return _context.stop();
                      }
                    }
                  }, _callee);
                }))).promise);

              case 3:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2);
      }));

      return function (_x) {
        return _ref.apply(this, arguments);
      };
    }());
  }
};