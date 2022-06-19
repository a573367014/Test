import _asyncToGenerator from "@babel/runtime/helpers/asyncToGenerator";
import _regeneratorRuntime from "@babel/runtime/regenerator";
import cloneDeep from 'lodash/cloneDeep';
import throttle from 'lodash/throttle';
import isEqual from 'lodash/isEqual';
import pick from 'lodash/pick';
import inherit from "@gaoding/editor-framework/lib/utils/vue-inherit";
import utils from "@gaoding/editor-framework/lib/utils/utils";
import BaseElement from "@gaoding/editor-framework/lib/base/base-element";
import template from "./watermark-editor.html";
import { WatermarkEditorModel } from "./watermark-editor-model";
import { getRepeat, renderRepeat } from "./utils";
export default inherit(BaseElement.createStaticBaseElement(), {
  template: template,
  name: 'watermark-editor',
  props: ['model', 'currentElement', 'currentLayout', 'global', 'options'],
  filters: {
    angle: function angle(_angle) {
      _angle = Math.round(_angle) % 360;
      _angle = _angle >= 180 ? _angle - 360 : _angle;
      return _angle + '°';
    }
  },
  data: function data() {
    return {
      innerProps: {
        editModel: null
      },
      shellRect: {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0
      },
      repeatCanvas: null,
      cellCanvas: null,
      watermarkImage: '',
      watermarkWidth: 0,
      watermarkHeight: 0,
      action: {
        scale: false,
        drag: false,
        rotate: false
      }
    };
  },
  computed: {
    editor: function editor() {
      return this.$parent;
    },
    zoom: function zoom() {
      return this.global.zoom;
    },
    editModel: function editModel() {
      return this.getEditModel();
    },
    layout: function layout() {
      return this.editor.currentLayout;
    },
    boxStyle: function boxStyle() {
      var _this$shellRect = this.shellRect,
          left = _this$shellRect.left,
          top = _this$shellRect.top,
          right = _this$shellRect.right,
          bottom = _this$shellRect.bottom;
      return {
        right: -right + "px",
        bottom: -bottom + "px",
        left: -left + "px",
        top: -top + "px"
      };
    },
    outerWatermarkStyle: function outerWatermarkStyle() {
      var zoom = this.global.zoom;
      var shellRect = this.shellRect,
          editModel = this.editModel,
          watermarkImage = this.watermarkImage,
          watermarkWidth = this.watermarkWidth,
          watermarkHeight = this.watermarkHeight;
      var fullScreenInfo = editModel.fullScreenInfo,
          opacity = editModel.opacity;
      var offsetLeft = fullScreenInfo.left * zoom;
      var offsetTop = fullScreenInfo.top * zoom;
      return {
        backgroundImage: "url(" + watermarkImage + ")",
        opacity: 0.19 * opacity,
        backgroundSize: watermarkWidth * zoom + "px " + watermarkHeight * zoom + "px",
        backgroundRepeat: 'repeat',
        backgroundPosition: offsetLeft + shellRect.left + "px " + (offsetTop + shellRect.top) + "px"
      };
    },
    innerWatermarkStyle: function innerWatermarkStyle() {
      var zoom = this.global.zoom;
      var editModel = this.editModel,
          watermarkImage = this.watermarkImage,
          watermarkWidth = this.watermarkWidth,
          watermarkHeight = this.watermarkHeight,
          shellRect = this.shellRect;
      var fullScreenInfo = editModel.fullScreenInfo,
          opacity = editModel.opacity;
      var offsetLeft = fullScreenInfo.left * zoom;
      var offsetTop = fullScreenInfo.top * zoom;
      return {
        backgroundImage: "url(" + watermarkImage + ")",
        opacity: opacity,
        backgroundSize: watermarkWidth * zoom + "px " + watermarkHeight * zoom + "px",
        backgroundRepeat: 'repeat',
        backgroundPosition: offsetLeft + "px " + offsetTop + "px",
        left: shellRect.left + "px",
        top: shellRect.top + "px",
        width: editModel.width * zoom + "px",
        height: editModel.height * zoom + "px"
      };
    },
    transform: function transform() {
      return this.editModel.template.transform;
    }
  },
  watch: {
    currentElement: function currentElement(element) {
      if (element !== this.editModel) {
        this.$events.$emit('element.editApply', this.editModel);
        this.destroyEditModel();
      }
    }
  },
  events: {
    'element.watermarTransformEnd': function elementWatermarTransformEnd() {
      this.lazyRenderWatermark();
    },
    'element.dragStart': function elementDragStart(element) {
      if (element === this.editModel) {
        this.dragInit();
        this.action.drag = true;
      }
    },
    'element.customDragMove': function elementCustomDragMove(_ref) {
      var element = _ref.element,
          dx = _ref.dx,
          dy = _ref.dy;

      if (element === this.editModel) {
        this.draging(dx, dy);
      }
    },
    'element.dragEnd': function elementDragEnd(element) {
      if (element === this.editModel) {
        this.dragEnd();
        this.action.drag = false;
      }
    },
    'element.editApply': function elementEditApply(model) {
      if (model === this.editModel) {
        this.save();
      }
    },
    'element.editCancel': function elementEditCancel(model) {
      if (model === this.editModel) {
        this.cancel();
      }
    },
    'element.editReset': function elementEditReset(model) {
      if (model === this.editModel) {
        model.$reset();
      }
    },
    'watermarkEditor.scale': function watermarkEditorScale(scale) {
      var transform = this.editModel.template.transform;
      transform.scale.x = scale;
      transform.scale.y = scale;
      this.lazyRenderWatermark();
      this.action.scale = true;
    },
    'watermarkEditor.rotate': function watermarkEditorRotate(rotate) {
      var transform = this.editModel.template.transform;
      transform.rotation = utils.degToRad(rotate);
      this.lazyRenderWatermark();
    },
    'watermarkEditor.scaleEnd': function watermarkEditorScaleEnd() {
      this.action.scale = false;
    },
    'watermarkEditor.changeGap': function watermarkEditorChangeGap(value) {
      var fullScreenInfo = this.editModel.fullScreenInfo;
      fullScreenInfo.colGap = value;
      fullScreenInfo.rowGap = value;
      this.lazyRenderWatermark();
    },
    'watermarkEditor.changeIndent': function watermarkEditorChangeIndent(value) {
      var fullScreenInfo = this.editModel.fullScreenInfo;
      fullScreenInfo.leftIndent = value;
      this.lazyRenderWatermark();
    },
    'base.click': function baseClick(e) {
      e.preventDefault();

      if (!this.action.scale && !this.action.drag) {
        // 点击空白区域应用修改
        var point = this.editor.pointFromEvent(e);
        var rect = utils.getElementRect(this.editModel, 1);

        if (!utils.pointInRect(point.x, point.y, rect)) {
          this.save();
        }
      }
    }
  },
  created: function created() {
    var _this = this;

    this.lastCurrentElement = this.currentElement;
    this.lazyRenderWatermark = throttle(function () {
      _this.renderWatermark();
    }, 80, {
      leading: false
    });
  },
  mounted: function mounted() {
    var _this2 = this;

    return _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee() {
      return _regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _this2.editor.focusElement(_this2.editModel);

              _this2.shellDom = _this2.editor.container.find('.editor-shell-wrap')[0];

              _this2.$watch(function () {
                var _this2$editor = _this2.editor,
                    containerRect = _this2$editor.containerRect,
                    shellRect = _this2$editor.shellRect;
                return [containerRect.width, containerRect.height, shellRect.width, shellRect.height];
              }, function () {
                var _this2$shellDom = _this2.shellDom,
                    offsetTop = _this2$shellDom.offsetTop,
                    offsetLeft = _this2$shellDom.offsetLeft,
                    clientWidth = _this2$shellDom.clientWidth,
                    clientHeight = _this2$shellDom.clientHeight;
                var offsetRight = offsetLeft + clientWidth;
                var offsetBottom = offsetTop + clientHeight;
                var containerRect = _this2.editor.containerRect;
                _this2.shellRect = {
                  left: offsetLeft + containerRect.padding[3],
                  top: offsetTop + containerRect.padding[0],
                  right: containerRect.scrollWidth - offsetRight + containerRect.padding[1],
                  bottom: containerRect.scrollHeight - offsetBottom + containerRect.padding[2]
                };
              }, {
                immediate: true
              });

              _this2.editModel.active = true;

              if (_this2.model.$cellCanvas) {
                _context.next = 7;
                break;
              }

              _context.next = 7;
              return _this2.model.renderCell(_this2.editor);

            case 7:
              if (_this2.model.$repeatCanvas) {
                _context.next = 10;
                break;
              }

              _context.next = 10;
              return _this2.model.renderRepeat(_this2.editor);

            case 10:
              _this2.cellCanvas = _this2.model.$cellCanvas;
              _this2.repeatCanvas = _this2.model.$repeatCanvas;

              _this2.exportImage();

            case 13:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }))();
  },
  methods: {
    getEditModel: function getEditModel() {
      var _this3 = this;

      var _this$model = this.model,
          width = _this$model.width,
          height = _this$model.height,
          fullScreenInfo = _this$model.fullScreenInfo,
          template = _this$model.template,
          opacity = _this$model.opacity,
          lock = _this$model.lock;
      var newTemplate = cloneDeep(template);
      newTemplate.transform = this.model.parseTransform(template.transform);
      var model = new WatermarkEditorModel({
        type: '$watermarker',
        left: 0,
        top: 0,
        width: width,
        height: height,
        opacity: opacity,
        waterType: 1,
        fullScreenInfo: cloneDeep(fullScreenInfo),
        template: newTemplate,
        $customDragMove: true,
        rotatable: false,
        resize: 0,
        lock: lock
      });
      this.model.$editing = true;

      model.$canReset = function () {
        var props = ['scale'];

        var cache = _this3.getEditModel();

        return !isEqual(pick(model, props), pick(cache, props));
      };

      var transform = model.template.transform;
      var scaleCache = {
        x: transform.scale.x,
        y: transform.scale.y
      };

      model.$reset = function () {
        model.scale = scaleCache;

        _this3.lazyRenderWatermark();
      };

      return model;
    },
    destroyEditModel: function destroyEditModel() {
      var model = this.model;

      if (!model) {
        return;
      }

      if (this.lastCurrentElement && this.currentElement === this.editModel) {
        this.editor.focusElement(this.lastCurrentElement);
      }

      model.$editing = false;
      this.$emit('update:model', null);
    },
    renderWatermark: function renderWatermark() {
      var cellCanvas = this.cellCanvas,
          editModel = this.editModel;
      var repeat = getRepeat(editModel);
      this.repeatCanvas = renderRepeat(cellCanvas, repeat);
      this.exportImage();
    },
    exportImage: function exportImage() {
      var _this4 = this;

      return _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2() {
        var repeatCanvas, url;
        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                repeatCanvas = _this4.repeatCanvas;

                if (!_this4.options.resource.blobUrlEnable) {
                  _context2.next = 7;
                  break;
                }

                _context2.next = 4;
                return new Promise(function (resolve) {
                  repeatCanvas.toBlob(function (blob) {
                    resolve(URL.createObjectURL(blob));
                  }, 'image/png', 1);
                });

              case 4:
                url = _context2.sent;
                _context2.next = 8;
                break;

              case 7:
                url = repeatCanvas.toDataURL('image/png', 1);

              case 8:
                _this4.watermarkImage = url;
                _this4.watermarkWidth = repeatCanvas.width;
                _this4.watermarkHeight = repeatCanvas.height;

              case 11:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2);
      }))();
    },
    dragInit: function dragInit() {
      var _this$editModel$fullS = this.editModel.fullScreenInfo,
          left = _this$editModel$fullS.left,
          top = _this$editModel$fullS.top;
      this.$dragCache = {
        left: left,
        top: top
      };
    },
    draging: function draging(dx, dy) {
      var fullScreenInfo = this.editModel.fullScreenInfo;
      var _this$$dragCache = this.$dragCache,
          left = _this$$dragCache.left,
          top = _this$$dragCache.top;
      fullScreenInfo.left = left + dx;
      fullScreenInfo.top = top + dy;
    },
    dragEnd: function dragEnd() {
      delete this.$editModel;
    },
    save: function save() {
      var model = this.model,
          editModel = this.editModel;
      this.destroyEditModel(); // 重新设置 model.$editing 来优化性能，使用已渲染的 repeatCanvas 来生成水印

      model.$editing = true;
      this.editor.changeElement({
        opacity: editModel.opacity,
        fullScreenInfo: editModel.fullScreenInfo,
        template: {
          transform: editModel.template.transform
        },
        lock: editModel.lock
      }, model);
      model.$repeatCanvas = this.repeatCanvas;
      this.editor.$events.$emit('element.watermarkUpdated', model);
      model.$editing = false;
    },
    cancel: function cancel() {
      this.destroyEditModel();
    }
  }
});