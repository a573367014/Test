import _inheritsLoose from "@babel/runtime/helpers/inheritsLoose";
import _createClass from "@babel/runtime/helpers/createClass";
import paper from 'paper';
import { initEvents, initKeyEvents } from "./events";
import { Widgets, EditableAnchor, EditablePath, AnchorTarget, HandleTarget } from "./widgets";
import { initPaper, loadModel as _loadModel, cloneWithReplace, testCurveDrag, refreshPickerFrame, beforeRenderHoverCurve, beforeRenderAnchor, afterRenderAnchor, createPoint, exportModel as _exportModel, updateShape, addShape as _addShape, testAnchorMousedown, testHandleDrag, testPreAddPoint, insertAnchor, testAnchorHover, testHandleHover, resetSnapGuides, createSegment, beforeRenderMain, loadStyle as _loadStyle, tryMergeAnchors, getAnchorType as _getAnchorType, isCloseEnough, trySwitchAnchorType, beforeRenderHandle } from "./utils";
import { mitt } from "../mitt";
import { cursors } from "./consts";

var EnvState = /*#__PURE__*/function () {
  function EnvState(context) {
    this.context = void 0;
    this.toolType = 'lite';
    this.mouseInCanvas = false;
    this.usePenCursor = false;
    this.dragging = false;
    this.dragTarget = null;
    this.hoverTarget = null;
    this.context = context;
  }

  _createClass(EnvState, [{
    key: "isPenTool",
    get: function get() {
      return this.toolType === 'pen';
    }
  }, {
    key: "isLiteTool",
    get: function get() {
      return this.toolType === 'lite';
    }
  }, {
    key: "isRectTool",
    get: function get() {
      return this.toolType === 'rect';
    }
  }, {
    key: "isEllipseTool",
    get: function get() {
      return this.toolType === 'ellipse';
    }
  }, {
    key: "isTriangleTool",
    get: function get() {
      return this.toolType === 'triangle';
    }
  }, {
    key: "isLineTool",
    get: function get() {
      return this.toolType === 'line';
    }
  }, {
    key: "isShapeTool",
    get: function get() {
      return this.isRectTool || this.isEllipseTool || this.isTriangleTool || this.isLineTool;
    }
  }, {
    key: "isDraggingAnchor",
    get: function get() {
      return this.dragTarget instanceof AnchorTarget;
    }
  }, {
    key: "isDraggingHandle",
    get: function get() {
      return this.dragTarget instanceof HandleTarget;
    }
  }, {
    key: "isDragging",
    get: function get() {
      return this.isDraggingAnchor || this.isDraggingHandle;
    }
  }, {
    key: "isRangePicking",
    get: function get() {
      return !this.isDraggingAnchor && !this.isDraggingHandle;
    }
  }]);

  return EnvState;
}();

var BaseTool = function BaseTool(context) {
  this.context = void 0;
  this.widgets = void 0;
  this.context = context;
  this.widgets = context.widgets;
};

var PenTool = /*#__PURE__*/function (_BaseTool) {
  _inheritsLoose(PenTool, _BaseTool);

  function PenTool() {
    return _BaseTool.apply(this, arguments) || this;
  }

  var _proto = PenTool.prototype;

  _proto.refreshCursorWidgets = function refreshCursorWidgets(e) {
    var context = this.context,
        widgets = this.widgets;
    var currentPath = context.currentPath,
        modelScale = context.modelScale;
    var cursorPath = widgets.cursorPath,
        cursorPoint = widgets.cursorPoint;
    var lastAnchor = currentPath.lastAnchor;
    var mousePoint = createPoint(e.x, e.y, modelScale);
    cursorPoint.position = mousePoint;

    if (lastAnchor) {
      var path = new paper.Path();
      path.add(currentPath.main.lastSegment);
      path.add(mousePoint);
      widgets.cursorPath = cloneWithReplace(path, cursorPath);
      lastAnchor.setHandleOut(path.firstSegment.handleOut);
    }
  };

  _proto.addAnchor = function addAnchor(path, segment) {
    var anchor = new EditableAnchor(segment);
    path.addAnchor(anchor);
  };

  _proto.bendSegment = function bendSegment(e) {
    var _this$context$current = this.context.currentPath,
        lastAnchor = _this$context$current.lastAnchor,
        main = _this$context$current.main,
        hint = _this$context$current.hint;
    var delta = createPoint(e.delta.x, e.delta.y, this.context.modelScale);
    main.lastSegment.handleOut = main.lastSegment.handleOut.add(delta);
    hint.lastSegment.handleOut = hint.lastSegment.handleOut.add(delta);
    main.lastSegment.handleIn = main.lastSegment.handleIn.subtract(delta);
    hint.lastSegment.handleIn = hint.lastSegment.handleIn.subtract(delta);
    var _main$lastSegment = main.lastSegment,
        handleIn = _main$lastSegment.handleIn,
        handleOut = _main$lastSegment.handleOut;
    lastAnchor.setHandleIn(handleIn);
    lastAnchor.setHandleOut(handleOut);
  };

  return PenTool;
}(BaseTool);

var LiteTool = /*#__PURE__*/function (_BaseTool2) {
  _inheritsLoose(LiteTool, _BaseTool2);

  function LiteTool() {
    return _BaseTool2.apply(this, arguments) || this;
  }

  var _proto2 = LiteTool.prototype;

  _proto2._testDragTarget = function _testDragTarget(e, isDrag) {
    var context = this.context;
    if (testAnchorMousedown(context, e, isDrag)) return;
    if (testHandleDrag(context, e)) return;
    if (testCurveDrag(context, e)) return;
    context.currentPath.clearPickedAnchor();
  };

  _proto2._clearTarget = function _clearTarget() {
    this.context.state.dragTarget = null;
    this.context.currentPath.clearPickedAnchor();
  };

  _proto2.setAnchorType = function setAnchorType(type, pickedAnchors) {
    if (pickedAnchors === void 0) {
      pickedAnchors = null;
    }

    var res = this.context.currentPath.setAnchorType(type, pickedAnchors);

    if (res) {
      this.context.events.emit('anchorTypeChange', this.getAnchorType());
    }
  };

  _proto2.getAnchorType = function getAnchorType() {
    var _this$context$current2 = this.context.currentPath,
        anchors = _this$context$current2.anchors,
        pickedAnchors = _this$context$current2.pickedAnchors;
    var result = [];

    if (pickedAnchors.size) {
      pickedAnchors.forEach(function (i) {
        result.push(_getAnchorType(anchors[i]));
      });
    }

    return result;
  };

  _proto2.removeAnchor = function removeAnchor() {
    var context = this.context;
    var currentPath = context.currentPath,
        editor = context.editor;
    var pickedAnchors = currentPath.pickedAnchors;
    if (!pickedAnchors.size) return editor.currentElement.$editing = false;

    for (var i = currentPath.anchors.length; i >= 0; i--) {
      var anchor = currentPath.anchors[i];

      if (pickedAnchors.has(i)) {
        currentPath.main.removeSegment(i);
        currentPath.hint.removeSegment(i);
        anchor.remove();
      }
    }

    currentPath.anchors = currentPath.anchors.filter(function (_, i) {
      return !pickedAnchors.has(i);
    });
    context.currentPath.clearPickedAnchor();

    if (!currentPath.anchors.length) {
      return editor.removeElement(editor.currentElement);
    }

    context.render();
  };

  _proto2.onDragStart = function onDragStart(e) {
    this._testDragTarget(e, true); // console.log(e); // 可供本地测试时记录拖拽起始点

  };

  _proto2.onDragMove = function onDragMove(e) {
    var _this$context = this.context,
        state = _this$context.state,
        currentPath = _this$context.currentPath,
        modelScale = _this$context.modelScale; // 原有参考线入口，未适配 zoom
    // if (state.isDraggingAnchor) refreshSnapGuides(this.context, e);
    // const lastX = e.x - e.delta.x;
    // const lastY = e.y - e.delta.y;
    // const [lastSnap] = getSnap(this.context, lastX, lastY);
    // const [newSnap] = getSnap(this.context, e.x, e.y);
    // console.log('e', e.x, e.y, 'last', lastX, lastY, 'snap', newSnap);
    // const snapDelta = createPoint(newSnap.x - lastSnap.x, newSnap.y - lastSnap.y);
    // if (state.isDraggingAnchor) currentPath.movePickedAnchors(snapDelta);

    var delta = createPoint(e.delta.x, e.delta.y, modelScale); // 按住 command 的拖拽行为

    if (e.keys.cmd) {
      if (state.isDraggingAnchor || state.isDraggingHandle) {
        currentPath.moveHandle(delta);
      }
    } // 按住 alt 的拖拽行为
    else if (e.keys.alt) {
      if (state.isDraggingHandle) {
        currentPath.moveHandle(delta);
      }
    } // 朴素的拖拽行为
    else {
      if (state.isDraggingAnchor) currentPath.movePickedAnchors(delta);else if (state.isDraggingHandle) currentPath.moveHandle(delta);else if (state.isRangePicking) refreshPickerFrame(this.context, e);
    }
  };

  _proto2.onDragEnd = function onDragEnd(e) {
    // console.log(e); // 可供本地测试时记录拖拽结束点
    var context = this.context,
        widgets = this.widgets; // const [snap] = getSnap(context, e.x, e.y);

    var point = createPoint(e.x, e.y, this.context.modelScale);
    if (context.state.isRangePicking) widgets.pickerFrame.visible = false;
    resetSnapGuides(context);
    tryMergeAnchors(context, point);

    if (context.currentPath.anchors.length <= 1) {
      context.editor.removeElement(context.editor.currentElement);
      return;
    } else if (context.state.isDragging) {
      context.undoManager.makeSnapshot();
    }

    context.state.dragTarget = null;
  };

  _proto2.onHover = function onHover(e) {
    if (this.context.state.isShapeTool) return;
    this.context.widgets.centerPreAddPoint.visible = false;
    var point = createPoint(e.x, e.y, this.context.modelScale);
    var cursor = 'default';
    var isKeyAction = e.keys.cmd || e.keys.alt;
    if (testAnchorHover(this.context, point)) return this.context.setCursor(isKeyAction ? cursors.updateAnchor : '');
    testHandleHover(this.context, point) && isKeyAction && (cursor = cursors.updateAnchor);
    if (testPreAddPoint(this.context, point)) return this.context.setCursor(cursors.addAnchor);
    this.context.setCursor(cursor);
  };

  _proto2.onClick = function onClick(e) {
    this._clearTarget();

    var point = createPoint(e.x, e.y, this.context.modelScale);
    var context = this.context,
        widgets = this.widgets; // 单击 hover 预添加锚点

    if (widgets.hoverPreAddPoint.visible) {
      insertAnchor(context, widgets.hoverPreAddPoint.position);
      context.undoManager.makeSnapshot();
      return;
    } // 单击 center 预添加锚点
    else if (isCloseEnough(widgets.centerPreAddPoint.position, point, 6 * context.modelScale)) {
      insertAnchor(context, widgets.centerPreAddPoint.position);
      context.undoManager.makeSnapshot();
      return;
    } // 单击锚点或控制点


    this._testDragTarget(e, false); // 按住 command 单击锚点时，切换锚点状态


    if (context.state.isDraggingAnchor && e.keys.cmd) {
      trySwitchAnchorType(this.context, point);
      context.undoManager.makeSnapshot();
      return;
    } // 单击空白位置时返回展示态


    if (!context.state.isDragging && !this.context.scene.hitTest(createPoint(e.x, e.y, this.context.modelScale))) {
      context.editor.currentElement.$editing = false;
    }

    context.render();
  };

  _proto2.onDblClick = function onDblClick(e) {
    var point = createPoint(e.x, e.y, this.context.modelScale);
    trySwitchAnchorType(this.context, point);
    this.context.undoManager.makeSnapshot();
    this.context.render();
  };

  return LiteTool;
}(BaseTool);

var ShapeTool = /*#__PURE__*/function (_BaseTool3) {
  _inheritsLoose(ShapeTool, _BaseTool3);

  function ShapeTool() {
    return _BaseTool3.apply(this, arguments) || this;
  }

  var _proto3 = ShapeTool.prototype;

  _proto3.addShape = function addShape(e) {
    _addShape(this.context, e);
  };

  _proto3.onDragStart = function onDragStart(e) {
    updateShape(this.context, e);
  };

  _proto3.onDragMove = function onDragMove(e) {
    this.context.editor.$events.$emit('path.dragMove', e);
    updateShape(this.context, e);
  };

  _proto3.onDragEnd = function onDragEnd(_e) {
    this.context.editor.currentElement.$editing = false;
    this.context.editor.$events.$emit('path.dragEnd');
  };

  return ShapeTool;
}(BaseTool);

var SimpleUndoManager = /*#__PURE__*/function () {
  function SimpleUndoManager(context) {
    this.context = void 0;
    this._states = [];
    this._index = -1;
    this.context = context;
  }

  var _proto4 = SimpleUndoManager.prototype;

  _proto4.makeSnapshot = function makeSnapshot() {
    this.context.currentPath.main.translate(createPoint(-this.model.left, -this.model.top));
    var pathElement = this.context.currentPath.main.exportSVG();
    var path = pathElement.getAttribute('d');
    this.context.currentPath.main.translate(createPoint(this.model.left, this.model.top));

    if (!this._indexAtLast) {
      this._states.splice(this._index + 1);
    }

    this._states.push(path);

    this._index = this._states.length - 1;
  };

  _proto4.undo = function undo() {
    if (!this.hasUndo) return;
    this._index--;
    this.model.path = this._current;
    this.context.loadModel();
  };

  _proto4.redo = function redo() {
    if (!this.hasRedo) return;
    this._index++;
    this.model.path = this._current;
    this.context.loadModel();
  };

  _createClass(SimpleUndoManager, [{
    key: "model",
    get: function get() {
      return this.context.editor.currentElement;
    }
  }, {
    key: "_indexAtLast",
    get: function get() {
      return this._index === this._states.length - 1;
    }
  }, {
    key: "_current",
    get: function get() {
      return this._states[this._index];
    }
  }, {
    key: "hasUndo",
    get: function get() {
      return this._index > 0;
    }
  }, {
    key: "hasRedo",
    get: function get() {
      return !this._indexAtLast;
    }
  }]);

  return SimpleUndoManager;
}();

export var PathEditorContext = /*#__PURE__*/function () {
  function PathEditorContext(canvas, editor) {
    var _this = this;

    this.editor = void 0;
    this.canvas = void 0;
    this.view = void 0;
    this.penTool = void 0;
    this.liteTool = void 0;
    this.shapeTool = void 0;
    this.widgets = void 0;
    this.state = void 0;
    this.paths = [];
    this.undoManager = new SimpleUndoManager(this);
    this.strokeType = void 0;
    this.events = mitt();
    this._pathIndex = 0;
    this._paper = void 0;

    this._onDragStart = function (e) {
      var state = _this.state,
          penTool = _this.penTool,
          liteTool = _this.liteTool,
          shapeTool = _this.shapeTool,
          currentPath = _this.currentPath;
      state.dragging = true;
      if (state.isPenTool) penTool.addAnchor(currentPath, createSegment(e.x, e.y));else if (state.isLiteTool) liteTool.onDragStart(e);else if (state.isShapeTool) shapeTool.onDragStart(e);

      _this.render();
    };

    this._onDragMove = function (e) {
      var state = _this.state,
          penTool = _this.penTool,
          liteTool = _this.liteTool,
          shapeTool = _this.shapeTool;
      if (state.isPenTool) penTool.bendSegment(e);else if (state.isLiteTool) liteTool.onDragMove(e);else if (state.isShapeTool) shapeTool.onDragMove(e);

      _this.render();
    };

    this._onDragEnd = function (e) {
      var state = _this.state,
          shapeTool = _this.shapeTool;
      state.dragging = false;
      if (state.isShapeTool) shapeTool.onDragEnd(e);else if (state.isLiteTool) _this.liteTool.onDragEnd(e);

      _this.render();
    };

    this._onClick = function (e) {
      var state = _this.state,
          penTool = _this.penTool,
          liteTool = _this.liteTool,
          shapeTool = _this.shapeTool,
          currentPath = _this.currentPath;
      if (state.isPenTool) penTool.addAnchor(currentPath, createSegment(e.x, e.y));else if (state.isLiteTool) liteTool.onClick(e);else if (state.isShapeTool) {
        shapeTool.addShape(e);
        shapeTool.onDragEnd(e);
      }

      _this.render();
    };

    this._onHover = function (e) {
      // this.penTool.refreshCursorWidgets(e);
      _this.liteTool.onHover(e);

      _this.render();
    };

    this._onMouseOut = function (_e) {
      _this.state.mouseInCanvas = false;

      _this.render();

      if (_this.state.isShapeTool && _this.state.dragging) {
        var e = new MouseEvent('mouseup');

        _this.canvas.dispatchEvent(e);
      }
    };

    this._onDblClick = function (e) {
      var state = _this.state,
          liteTool = _this.liteTool;

      if (state.isLiteTool) {
        liteTool.onDblClick(e);
      }
    };

    this.editor = editor;
    this.canvas = canvas;
    var paper = initPaper(canvas);
    this._paper = paper;
    this.view = paper.view;

    this._initEventHandlers();

    this.state = new EnvState(this);
    this.widgets = new Widgets(this);
    this.penTool = new PenTool(this);
    this.liteTool = new LiteTool(this);
    this.shapeTool = new ShapeTool(this);
    this.paths = [new EditablePath(this)];
    this.syncSize(); // @ts-ignore debug

    window.pathContext = this;
  }

  var _proto5 = PathEditorContext.prototype;

  _proto5.loadModel = function loadModel() {
    var model = this.model,
        widgets = this.widgets;
    if (model.path === '') return this.resetPaths();

    _loadModel(this, model);

    widgets.centerPreAddPoint.visible = false;
    widgets.hoverPreAddPoint.visible = false;
    this.fitZoom();
    this.render();
  };

  _proto5.loadStyle = function loadStyle(model) {
    _loadStyle(this, model);

    this.render();
  };

  _proto5.exportModel = function exportModel() {
    var _this$model;

    _exportModel(this, this.model);

    this.currentPath.remove();
    return (_this$model = this.model) === null || _this$model === void 0 ? void 0 : _this$model.path; // 仅供控制台调试用
  };

  _proto5.setTool = function setTool(toolType) {
    var state = this.state;
    state.toolType = toolType;
    if (state.isLiteTool) state.dragTarget = null;
    this.render();
  };

  _proto5.syncSize = function syncSize(update) {
    if (update === void 0) {
      update = true;
    }

    this.view.viewSize = new paper.Size(this.width, this.height);
    update && this.render();
  };

  _proto5.fitZoom = function fitZoom() {
    this.syncSize(false);
    this.view.scale(1 / this.view.zoom * this.zoom, {
      x: 0,
      y: 0
    });
    this.render();
  };

  _proto5._initEventHandlers = function _initEventHandlers() {
    var _this2 = this;

    initEvents(this.canvas, this._onDragStart, this._onDragMove, this._onDragEnd, this._onClick, this._onDblClick, function (e) {
      _this2.state.mouseInCanvas = true;
      if (_this2.state.dragging) return;

      _this2._onHover(e);
    }, this._onMouseOut);
    initKeyEvents(this);
  }
  /**
   * debug only
   */
  ;

  _proto5.hideWidgets = function hideWidgets() {
    this.scene.children.forEach(function (child) {
      child.visible = false;
    });
    this.paths.forEach(function (path) {
      path.offset.visible = true;
    });
    this.view.update();
  };

  _proto5.render = function render() {
    beforeRenderHoverCurve(this);
    beforeRenderAnchor(this);
    beforeRenderHandle(this);
    beforeRenderMain(this);
    this.view.update();
    afterRenderAnchor(this);
  };

  _proto5.setCursor = function setCursor(name) {
    if (this.state.isShapeTool) {
      var opt = {
        args: {
          fill: '#636C78',
          stroke: '#fff'
        }
      };
      this.editor.cursorController.fixedCursor(name, opt);
    } else if (this.state.isLiteTool) {
      this.editor.cursorController.fixedCursor(name);
    } else {
      this.editor.cursorController.fixedCursor('default');
    }
  };

  _proto5.resetPaths = function resetPaths() {
    this.paths.forEach(function (editablePath) {
      return editablePath.remove();
    });
    this.paths = [];
    this.paths = [new EditablePath(this)];
  };

  _createClass(PathEditorContext, [{
    key: "scene",
    get: function get() {
      return this._paper.project.activeLayer;
    }
  }, {
    key: "width",
    get: function get() {
      var _this$editor$currentL;

      return ((_this$editor$currentL = this.editor.currentLayout) === null || _this$editor$currentL === void 0 ? void 0 : _this$editor$currentL.width) * this.zoom || 0;
    }
  }, {
    key: "height",
    get: function get() {
      var _this$editor$currentL2;

      return ((_this$editor$currentL2 = this.editor.currentLayout) === null || _this$editor$currentL2 === void 0 ? void 0 : _this$editor$currentL2.height) * this.zoom || 0;
    }
  }, {
    key: "currentPath",
    get: function get() {
      return this.paths[this._pathIndex];
    }
  }, {
    key: "zoom",
    get: function get() {
      return this.editor.zoom;
    }
  }, {
    key: "model",
    get: function get() {
      return this.editor.currentElement;
    }
    /**
     * 将像素尺寸转为 model 尺寸时的缩放系数。
     * 如 zoom 为 2 时画布坐标系下 100 的距离，即可换算为 50 的 model 坐标系长度。
     * 亦可用于保证控件尺寸不随 zoom 变动。
     */

  }, {
    key: "modelScale",
    get: function get() {
      return 1 / this.zoom;
    }
  }]);

  return PathEditorContext;
}();