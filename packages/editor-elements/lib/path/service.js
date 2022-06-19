import _asyncToGenerator from "@babel/runtime/helpers/asyncToGenerator";
import _inheritsLoose from "@babel/runtime/helpers/inheritsLoose";
import _debounce from "lodash/debounce";
import _regeneratorRuntime from "@babel/runtime/regenerator";
import { PathEditorContext } from "./path-editor/context";
import { BaseService } from "@gaoding/editor-framework/lib/base/service";
import paper from 'paper';
import PathModel from "./model";
import { PathRenderer } from "./path-renderer";
import { updateElementRectAtResize, resizeLine } from "@gaoding/editor-framework/lib/utils/resize-element";
import { colors } from "./path-editor/consts";
import { modelColorToPaperColor } from "./utils";
export var PathService = /*#__PURE__*/function (_BaseService) {
  _inheritsLoose(PathService, _BaseService);

  function PathService(editor) {
    var _this;

    _this = _BaseService.call(this, editor) || this;
    _this.context = void 0;
    _this.model = void 0;
    _this._store = {
      fillColor: colors.defaultFill,
      strokeColor: colors.defaultStroke,
      strokeWidth: 0
    };
    _this._debounceUpdateStore = _debounce(function (model, props) {
      props.filling && (_this._store.fillColor = modelColorToPaperColor(model));
      props.color && (_this._store.strokeColor = new paper.Color(props.color));
    }, 500);
    var canvas = document.createElement('canvas');
    canvas.classList.add('path-editor-canvas');
    canvas.tabIndex = -1;
    canvas.style.outline = 'none';
    _this.context = new PathEditorContext(canvas, editor);
    return _this;
  }

  var _proto = PathService.prototype;

  _proto.setStore = function setStore(key, value) {
    this._store[key] = value;
  };

  _proto._initEmptyEditing = /*#__PURE__*/function () {
    var _initEmptyEditing2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee() {
      var editor, pathProps;
      return _regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              editor = this.editor;
              pathProps = {
                type: 'path',
                left: 0,
                top: 0,
                width: editor.currentLayout.width,
                height: editor.currentLayout.height,
                path: '',
                radius: 0,
                $editing: true,
                pathShape: 'pen',
                $lookLike: this.context.state.toolType
              };
              this.model = new PathModel(pathProps);
              this.model.$currentPathEffect.lineType = 'inner';
              editor.currentElement = this.model;
              _context.next = 7;
              return editor.$nextTick();

            case 7:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    function _initEmptyEditing() {
      return _initEmptyEditing2.apply(this, arguments);
    }

    return _initEmptyEditing;
  }();

  _proto._beforeInitEmptyEditing = function _beforeInitEmptyEditing() {
    var _this2 = this;

    return new Promise(function (resolve) {
      var editor = _this2.editor,
          context = _this2.context; // 可在启动绘制时退出之前的编辑态

      if (editor.currentElement && editor.currentElement.$editing) {
        editor.currentElement.$editing = false;
        editor.$nextTick(function () {
          resolve(true);
        });
      } else resolve(true);

      context.widgets.refreshShape(_this2.context, {
        fillColor: _this2._store.fillColor,
        strokeColor: _this2._store.strokeColor,
        strokeWidth: _this2._store.strokeWidth
      });
    });
  };

  _proto.initRectEditing = /*#__PURE__*/function () {
    var _initRectEditing = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2() {
      return _regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _context2.next = 2;
              return this._beforeInitEmptyEditing();

            case 2:
              this.context.setTool('rect');
              _context2.next = 5;
              return this._initEmptyEditing();

            case 5:
              this.context.setCursor('rect');

            case 6:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this);
    }));

    function initRectEditing() {
      return _initRectEditing.apply(this, arguments);
    }

    return initRectEditing;
  }();

  _proto.initEllipseEditing = /*#__PURE__*/function () {
    var _initEllipseEditing = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee3() {
      return _regeneratorRuntime.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              _context3.next = 2;
              return this._beforeInitEmptyEditing();

            case 2:
              this.context.setTool('ellipse');
              _context3.next = 5;
              return this._initEmptyEditing();

            case 5:
              this.context.setCursor('ellipse');

            case 6:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3, this);
    }));

    function initEllipseEditing() {
      return _initEllipseEditing.apply(this, arguments);
    }

    return initEllipseEditing;
  }();

  _proto.initTriangleEditing = /*#__PURE__*/function () {
    var _initTriangleEditing = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee4() {
      return _regeneratorRuntime.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              _context4.next = 2;
              return this._beforeInitEmptyEditing();

            case 2:
              this.context.setTool('triangle');
              _context4.next = 5;
              return this._initEmptyEditing();

            case 5:
              this.context.setCursor('triangle');

            case 6:
            case "end":
              return _context4.stop();
          }
        }
      }, _callee4, this);
    }));

    function initTriangleEditing() {
      return _initTriangleEditing.apply(this, arguments);
    }

    return initTriangleEditing;
  }();

  _proto.initLineEditing = /*#__PURE__*/function () {
    var _initLineEditing = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee5() {
      return _regeneratorRuntime.wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              this._store.strokeWidth = 4;
              _context5.next = 3;
              return this._beforeInitEmptyEditing();

            case 3:
              this.context.setTool('line');
              _context5.next = 6;
              return this._initEmptyEditing();

            case 6:
              this._store.strokeWidth = 0;
              this.context.setCursor('line');

            case 8:
            case "end":
              return _context5.stop();
          }
        }
      }, _callee5, this);
    }));

    function initLineEditing() {
      return _initLineEditing.apply(this, arguments);
    }

    return initLineEditing;
  }();

  _proto.cancelEditing = function cancelEditing() {
    if (!this.model) return;
    this.model.$editing = false;
  };

  _proto.changeCurrentPathEffect = function changeCurrentPathEffect(model, props) {
    Object.assign(model.$currentPathEffect, props);

    if (model.isLine() && props.width) {
      model.height = props.width;
    }

    this._debounceUpdateStore(model, props);

    this.editor.makeSnapshotByElement(model);
  }
  /**
   * 获取直线包围盒
   */
  ;

  _proto.getLineRect = function getLineRect(model) {
    var path = new paper.Path(model.path);
    var p1 = path.firstSegment.point;
    var p2 = path.lastSegment.point;
    var size = p2.getDistance(p1);
    var angle = p2.subtract(p1).angle;
    return {
      left: p1.x,
      top: p1.y,
      width: size,
      height: Math.max(model.$currentPathEffect.width),
      angle: angle
    };
  }
  /**
   * 渲染 model 为 blob
   */
  ;

  _proto.renderToBlob = function renderToBlob(model) {
    var renderer = new PathRenderer(model).render();
    return new Promise(function (resolve, reject) {
      try {
        renderer.canvas.toBlob( /*#__PURE__*/function () {
          var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee6(blob) {
            return _regeneratorRuntime.wrap(function _callee6$(_context6) {
              while (1) {
                switch (_context6.prev = _context6.next) {
                  case 0:
                    resolve(blob);

                  case 1:
                  case "end":
                    return _context6.stop();
                }
              }
            }, _callee6);
          }));

          return function (_x) {
            return _ref.apply(this, arguments);
          };
        }());
      } catch (err) {
        reject(err);
      }
    });
  };

  _proto.export = /*#__PURE__*/function () {
    var _export2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee7(model) {
      var renderer, canvas, strokeBounds;
      return _regeneratorRuntime.wrap(function _callee7$(_context7) {
        while (1) {
          switch (_context7.prev = _context7.next) {
            case 0:
              if (this.canEditPath(model)) {
                _context7.next = 2;
                break;
              }

              return _context7.abrupt("return", null);

            case 2:
              renderer = new PathRenderer(model).render();
              canvas = renderer.canvas, strokeBounds = renderer.strokeBounds;
              return _context7.abrupt("return", {
                canvas: canvas,
                offsetX: Math.round(-strokeBounds.left),
                offsetY: Math.round(-strokeBounds.top),
                elementRealWidth: strokeBounds.width,
                elementRealHeight: strokeBounds.height
              });

            case 5:
            case "end":
              return _context7.stop();
          }
        }
      }, _callee7, this);
    }));

    function _export(_x2) {
      return _export2.apply(this, arguments);
    }

    return _export;
  }();

  _proto.resize = function resize(element, drag) {
    var lastWidth = element.width;
    var lastHeight = element.height;
    var dir = drag.dir;
    var path = new paper.Path(element.path);
    var strokeWidth = element.$currentPathEffect.width || 0;

    if (element.isLine()) {
      resizeLine.call(this.editor, element, drag);
      path.scale(element.width / lastWidth, 1, new paper.Point(0, element.height / 2));
      element.path = path.pathData;
    } else if (element.isRect()) {
      var _updateElementRectAtR = updateElementRectAtResize(element, drag, Math.max(10, strokeWidth / 2)),
          width = _updateElementRectAtR.width,
          height = _updateElementRectAtR.height;

      var shape = new paper.Shape.Rectangle(new paper.Rectangle(0, 0, width, height));
      element.path = shape.toPath(false).pathData;
    } else {
      var _updateElementRectAtR2 = updateElementRectAtResize(element, drag, Math.max(10, strokeWidth * 2)),
          _width = _updateElementRectAtR2.width,
          _height = _updateElementRectAtR2.height;

      var scaleX = _width / lastWidth;
      var scaleY = _height / lastHeight;
      /[e|w]/.test(dir) && path.scale(scaleX, 1, new paper.Point(0, _height / 2));
      /[s|n]/.test(dir) && path.scale(1, scaleY, new paper.Point(_width / 2, 0));
      element.path = path.pathData;
    }

    return element;
  }
  /**
   * 获取选中锚点类型
   */
  ;

  _proto.getPickedAnchorTypes = function getPickedAnchorTypes() {
    return this.context.liteTool.getAnchorType();
  };

  _proto.getPickedAnchors = function getPickedAnchors() {
    return Array.from(this.context.currentPath.pickedAnchors);
  };

  _proto.setAnchorType = function setAnchorType(type) {
    this.context.liteTool.setAnchorType(type);
  };

  _proto.editPath = function editPath(model) {
    this.context.setTool('lite');
    model.$editing = true;
  }
  /**
   * 判断是否可编辑
   */
  ;

  _proto.canEditPath = function canEditPath(model) {
    return model.pathShape === 'pen';
  };

  return PathService;
}(BaseService);