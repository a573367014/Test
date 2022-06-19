import _asyncToGenerator from "@babel/runtime/helpers/asyncToGenerator";
import _regeneratorRuntime from "@babel/runtime/regenerator";
// @ts-ignore vue html template
import template from "./path-editor.html";
import { defineComponent, onMounted, watch, ref, onBeforeUnmount, computed } from '@vue/composition-api';
import { i18n } from "../../i18n";
export var PathEditor = defineComponent({
  name: 'path-editor',
  props: {
    editor: {
      required: true,
      type: Object
    },
    model: {
      required: true,
      type: Object
    }
  },
  setup: function setup(props) {
    var wrap = ref();
    var service;
    var style = computed(function () {
      var _props$editor2, _props$editor2$curren, _props$editor3, _props$editor3$curren;

      var top = 0;

      if (props.editor.mode === 'flow') {
        var _props$editor, _props$editor$current;

        top = (((_props$editor = props.editor) === null || _props$editor === void 0 ? void 0 : (_props$editor$current = _props$editor.currentLayout) === null || _props$editor$current === void 0 ? void 0 : _props$editor$current.top) || 0) * props.editor.zoom;
      }

      return {
        position: 'absolute',
        left: 0,
        top: top + 'px',
        width: (((_props$editor2 = props.editor) === null || _props$editor2 === void 0 ? void 0 : (_props$editor2$curren = _props$editor2.currentLayout) === null || _props$editor2$curren === void 0 ? void 0 : _props$editor2$curren.width) || 0) + 'px',
        height: (((_props$editor3 = props.editor) === null || _props$editor3 === void 0 ? void 0 : (_props$editor3$curren = _props$editor3.currentLayout) === null || _props$editor3$curren === void 0 ? void 0 : _props$editor3$curren.height) || 0) + 'px',
        zIndex: 10
      };
    });
    watch(function () {
      return props.model && props.model.$editing;
    }, function (newValue) {
      if (newValue) initPathEditing();else exitPathEditing();
    });
    watch(function () {
      return {
        strokeColor: props.model.$currentPathEffect.color,
        strokeType: props.model.$currentPathEffect.lineType,
        strokeWidth: props.model.$currentPathEffect.width,
        fillColor: props.model.$currentPathEffect.filling,
        opacity: props.model.opacity
      };
    }, function () {
      props.model && props.model.$editing && service.context.loadStyle(props.model);
    });

    var mousemoveHandler = function mousemoveHandler(e) {
      if (!service.context.state.isShapeTool) return;
      var classList = e.target.classList;

      if (classList.contains('editor-container') || classList.contains('editor-shell-wrap')) {
        props.editor.cursorController.fixedCursor('markTips', {
          tip: i18n.$tsl('移动到画布中绘制')
        });
      } else {
        service.context.setCursor(service.context.state.toolType);
      }
    };

    onMounted(function () {
      service = props.editor.services.cache.get('path');
      if (props.model.$editing) initPathEditing();
    });
    onBeforeUnmount(function () {
      recoverEditorState();
    });

    function initPathEditing() {
      return _initPathEditing.apply(this, arguments);
    }

    function _initPathEditing() {
      _initPathEditing = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee() {
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!(wrap.value.childNodes.length > 0)) {
                  _context.next = 2;
                  break;
                }

                return _context.abrupt("return");

              case 2:
                wrap.value.appendChild(service.context.canvas);
                watch(function () {
                  return props.editor.shellRect.width + props.editor.shellRect.height;
                }, function () {
                  service.context.fitZoom();
                });
                props.editor.$refs.transform.visible = false;
                props.editor.$events.dispatchMouseEvent = false;
                service.context.loadModel();
                service.context.fitZoom();
                service.context.undoManager.makeSnapshot();
                setTimeout(function () {
                  service.context.canvas.focus();
                  if (document.activeElement === service.context.canvas) document.body.addEventListener('mousemove', mousemoveHandler);
                });

              case 10:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
      }));
      return _initPathEditing.apply(this, arguments);
    }

    function exitPathEditing() {
      recoverEditorState();
      service.context.exportModel();
    }

    function recoverEditorState() {
      var _service$context$canv;

      document.body.removeEventListener('mousemove', mousemoveHandler);
      props.editor.cursorController.cancelFixed('default');
      if (props.model.$editing) props.model.$editing = false;
      if (props.editor.$refs.transform) props.editor.$refs.transform.visible = true;
      ((_service$context$canv = service.context.canvas) === null || _service$context$canv === void 0 ? void 0 : _service$context$canv.parentNode) && wrap.value.removeChild(service.context.canvas);
      props.editor.$events.dispatchMouseEvent = true;
    }

    return {
      wrap: wrap,
      style: style
    };
  },
  template: template
});