import _asyncToGenerator from "@babel/runtime/helpers/asyncToGenerator";
import _pick from "lodash/pick";
import _assign from "lodash/assign";
import _regeneratorRuntime from "@babel/runtime/regenerator";
import editorDefaults from "@gaoding/editor-framework/lib/base/editor-defaults";
import VideoRenderer from "@gaoding/editor-framework/lib/utils/renderer/video";
export default {
  /**
   * 添加视频元素
   * @memberof EditorVideoElementMixin
   * @param {String} url - 视频路径
   * @param {Object} options - 视频其他参数，查看{@link module:EditorDefaults.element|element}
   */
  addVideo: function addVideo(url, options) {
    var data = _assign({
      type: 'video',
      volume: 1,
      url: url
    }, options);

    return this.addElement(data);
  },

  /**
   * 播放指定时间的视频画面
   * @memberof EditorVideoElementMixin
   * @param {element} element - 视频元素
   * @param {Number} time - 要 seek 的时间
   */
  seekVideo: function seekVideo(element, time) {
    if (element && element.type === 'video') {
      element.$currentTime = time;
    }
  },

  /**
   * 播放视频
   * @memberof EditorVideoElementMixin
   * @param {element} element - 视频元素
   * @param {Number} time - 开始播放的时间点
   */
  playVideo: function playVideo(element, time) {
    var _this = this;

    return _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee() {
      return _regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              if (!(!element || element.type !== 'video')) {
                _context.next = 2;
                break;
              }

              return _context.abrupt("return");

            case 2:
              _context.next = 4;
              return _this.$nextTick();

            case 4:
              time && _this.seekVideo(element, time);
              element.$playing = true;

            case 6:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }))();
  },

  /**
   * 暂停视频
   * @memberof EditorVideoElementMixin
   * @param {Object} element - 视频元素
   * @param {Number} time - 暂停的时间点 - 用来纠正播放可能出现偏移的情况
   */
  pauseVideo: function pauseVideo(element, time) {
    if (!element || element.type !== 'video') return;
    element.$playing = false;
    time && this.seekVideo(element, time);
  },

  /**
   * 停止播放视频, 并把 currentTime 设为 0
   * @memberof EditorVideoElementMixin
   * @param {element} element - 视频元素
   */
  stopVideo: function stopVideo(element) {
    this.pauseVideo(element, 0);
  },

  /**
   * 替换 `videoElement` 视频元素
   * @memberof EditorVideoElementMixin
   * @param {String} url - 新视频地址
   * @param {Object} options - 替换参数
   * @param {Boolean} [options.forwardEdit=true] - 替换后进入元素编辑状态 `showElementEditor`
   * @param {Number} [options.width] - 新视频的尺寸宽度
   * @param {Number} [options.height] - 新视频的尺寸高度
   * @param {Number} [options.naturalDuration] - 新视频的持续时间
   * @param {element} element - 被替换的元素
   * @param {Boolean} makeSnapshot - 是否创建快照
   */
  replaceVideo: function replaceVideo(url, options, element, makeSnapshot) {
    if (makeSnapshot === void 0) {
      makeSnapshot = true;
    }

    element = this.getElement(element);

    if (!element) {
      return;
    }

    var type = element.type;

    if (type !== 'video') {
      return;
    }

    options = _assign({
      forwardEdit: true
    }, options);
    var elementWidth = element.width;
    var elementHeight = element.height;
    var imgWidth = options.width || elementWidth;
    var imgHeight = options.height || elementHeight; // 短边放大，cover

    var ratio = Math.max(elementWidth / imgWidth, elementHeight / imgHeight);
    var width = imgWidth * ratio;
    var height = imgHeight * ratio;
    element.imageTransform = element.parseTransform({
      a: 1,
      b: 0,
      c: 0,
      d: 1,
      tx: 0,
      ty: 0
    });
    var _element = element,
        animation = _element.animation;
    var naturalDuration = typeof options.duration === 'number' ? options.duration * 1000 : options.naturalDuration;

    var _this$getTimeRange = this.getTimeRange(element),
        delay = _this$getTimeRange.delay;

    this.setTimeRange(delay, naturalDuration);
    this.changeElement({
      url: url,
      imageTransform: element.imageTransform,
      naturalWidth: imgWidth,
      naturalHeight: imgHeight,
      $imageWidth: width,
      $imageHeight: height,
      startTime: 0,
      endTime: naturalDuration,
      naturalDuration: naturalDuration,
      animation: animation,
      invertPlay: false
    }, element, makeSnapshot);

    if (options.forwardEdit && element !== this.currentSubElement) {
      this.showVideoCroper(element);
    }
  },

  /**
   * `videoElement` 视频元素进入剪裁状态
   * @memberof EditorVideoElementMixin
   * @param {element} element - 视频元素应用
   */
  showVideoCroper: function showVideoCroper(element) {
    element = this.getElement(element);
    element.$originalType = 'video';
    this.currentCropElement = element;
  },

  /**
   * 编辑器的当前处于剪裁状态的 `videoElement` 视频元素，退出剪裁状态
   * @memberof EditorVideoElementMixin
   */
  hideVideoCroper: function hideVideoCroper() {
    this.currentCropElement = null;
  },

  /**
   * 视频元素转换为图片或蒙版元素
   * @memberof EditorMaskElementMixin
   * @param  {element} element - 被转换视频元素
   * @param {Object} replaceOption - 替换参数
   * @param {Boolean} [replaceOption.forwardEdit=true] - 替换后进入元素编辑状态 `showElementEditor`
   * @param {Number} [replaceOption.width] - 新的尺寸宽度
   * @param {Number} [replaceOption.height] - 新的尺寸高度
   * @param {Number} [replaceOption.url] - 资源地址
   * @param {Number} [replaceOption.startTime] - 开始时间
   * @param {Number} [replaceOption.endTime] - 结束时间
   * @param {Number} [replaceOption.naturalDuration] - 持续时间
   * @param  {layout} layout  - 元素所在的布局
   * @return {element}        创建的图片或蒙版元素
   */
  convertVideoToImage: function convertVideoToImage(element, replaceOption, layout) {
    var _this2 = this;

    return _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2() {
      var defaultElement, defaultImageElement, props, data, endTime, startTime, renderer, newElement;
      return _regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              if (replaceOption === void 0) {
                replaceOption = {};
              }

              element = _this2.getElement(element);

              if (element) {
                _context2.next = 4;
                break;
              }

              return _context2.abrupt("return");

            case 4:
              defaultElement = editorDefaults.element;
              defaultImageElement = element.mask ? editorDefaults.maskElement : editorDefaults.imageElement;
              props = [].concat(Object.keys(defaultImageElement)).concat(Object.keys(defaultElement));
              data = _pick(element, props); // image props

              data.type = element.mask ? 'mask' : 'image';
              data.version = editorDefaults.version;
              data.url = replaceOption.url || element.url;
              data.startTime = replaceOption.startTime || 0;
              data.endTime = replaceOption.endTime || 0;
              data.naturalDuration = replaceOption.naturalDuration || 0;

              if (element.invertPlay) {
                endTime = data.endTime, startTime = data.startTime;
                data.startTime = data.naturalDuration - endTime;
                data.endTime = data.naturalDuration - startTime;
              }

              if (replaceOption.url) {
                _context2.next = 20;
                break;
              }

              renderer = new VideoRenderer({
                model: element,
                editor: self
              }).render();
              _context2.next = 19;
              return renderer.export().then(function (canvas) {
                if (_this2.options.resource.blobUrlEnable) {
                  return new Promise(function (resolve) {
                    canvas.toBlob(function (blob) {
                      resolve(URL.createObjectURL(blob));
                    }, 'image/jpg', 0.9);
                  });
                } else {
                  return canvas.toDataURL('image/jpg', 0.9);
                }
              });

            case 19:
              data.url = _context2.sent;

            case 20:
              _this2.makeSnapshotTransact(function () {
                newElement = _this2.replaceElement(element, data, layout);

                if (replaceOption.url) {
                  _this2.replaceImage(data.url, replaceOption, newElement);
                }
              });

              _this2.focusElement(newElement);

              return _context2.abrupt("return", newElement);

            case 23:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2);
    }))();
  },

  /**
   * 蒙版或图片元素转换为视频元素
   * @memberof EditorMaskElementMixin
   * @param  {element} element - 被转换蒙版元素
   * @param {Object} replaceOption - 替换参数
   * @param {Boolean} [replaceOption.forwardEdit=true] - 替换后进入元素编辑状态 `showElementEditor`
   * @param {Number} [replaceOption.width] - 新的尺寸宽度
   * @param {Number} [replaceOption.height] - 新的尺寸高度
   * @param {Number} [replaceOption.url] - 资源地址
   * @param {Number} [replaceOption.startTime] - 开始时间
   * @param {Number} [replaceOption.endTime] - 结束时间
   * @param {Number} [replaceOption.naturalDuration] - 持续时间
   * @param  {layout} layout  - 元素所在的布局
   * @return {element}        创建的视频元素
   */
  convertImageToVideo: function convertImageToVideo(element, replaceOption, layout) {
    var _this3 = this;

    if (replaceOption === void 0) {
      replaceOption = {};
    }

    element = this.getElement(element);

    if (!element) {
      return;
    }

    var defaultElement = editorDefaults.element;
    var defaultImageElement = editorDefaults.videoElement;
    var props = [].concat(Object.keys(defaultImageElement)).concat(Object.keys(defaultElement));

    var data = _pick(element, props); // image props


    data.type = 'video';
    data.url = replaceOption.url || element.url;
    data.version = editorDefaults.version;
    data.startTime = replaceOption.startTime || 0;
    data.endTime = replaceOption.endTime || 0;
    data.naturalDuration = replaceOption.naturalDuration || 0;
    var newElement;
    this.makeSnapshotTransact(function () {
      newElement = _this3.replaceElement(element, data, layout);

      if (replaceOption.url) {
        _this3.replaceVideo(data.url, replaceOption, newElement);
      }
    });
    this.focusElement(newElement);
    return newElement;
  }
};