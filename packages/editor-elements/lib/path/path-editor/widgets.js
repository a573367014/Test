import _createClass from "@babel/runtime/helpers/createClass";
import _inheritsLoose from "@babel/runtime/helpers/inheritsLoose";

function _createForOfIteratorHelperLoose(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (it) return (it = it.call(o)).next.bind(it); if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; return function () { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

import paper from 'paper';
import { sharpToCurve, toAngleMirror, toFullMirror, toSharp } from "./anchor-utils";
import { cursors, sizes } from "./consts";
import { addAnchorToScene, cloneWithReplace, createAnchorHandle, createAnchorLine, createAnchorPoint, createCursorPath, createCursorPoint, createHintPath, createHoverCurve, createMainPath, createPickerFrame, createPoint, createPreAddPoint, createShape, getAnchorType, isCloseEnough, moveAnchor, moveHandle as _moveHandle } from "./utils";

var BaseTarget = function BaseTarget(path) {
  this.path = void 0;
  this.path = path;
};

export var CurveTarget = /*#__PURE__*/function (_BaseTarget) {
  _inheritsLoose(CurveTarget, _BaseTarget);

  function CurveTarget(path, index) {
    var _this;

    _this = _BaseTarget.call(this, path) || this;
    _this.index = void 0;
    _this.index = index;
    return _this;
  }

  return CurveTarget;
}(BaseTarget);
export var AnchorTarget = /*#__PURE__*/function (_BaseTarget2) {
  _inheritsLoose(AnchorTarget, _BaseTarget2);

  function AnchorTarget() {
    return _BaseTarget2.apply(this, arguments) || this;
  }

  return AnchorTarget;
}(BaseTarget);
export var AnchorHoverTarget = /*#__PURE__*/function (_AnchorTarget) {
  _inheritsLoose(AnchorHoverTarget, _AnchorTarget);

  function AnchorHoverTarget(path, index) {
    var _this2;

    _this2 = _AnchorTarget.call(this, path) || this;
    _this2.index = void 0;
    _this2.index = index;
    return _this2;
  }

  return AnchorHoverTarget;
}(AnchorTarget);
export var HandleTarget = /*#__PURE__*/function (_BaseTarget3) {
  _inheritsLoose(HandleTarget, _BaseTarget3);

  function HandleTarget(path, index, handleFlag) {
    var _this3;

    _this3 = _BaseTarget3.call(this, path) || this;
    _this3.index = void 0;
    _this3.handleFlag = void 0;
    _this3.index = index;
    _this3.handleFlag = handleFlag;
    return _this3;
  }

  return HandleTarget;
}(BaseTarget);
export var Widgets = /*#__PURE__*/function () {
  /**
   * [
   *   ...shape,
   *   hoverPreAddPoint,
   *   ...editablePaths,
   *   hoverCurve,
   *   ...anchorPoints,
   *   pickerFrame,
   *   ...guides,
   *   centerPreAddPoint,
   *   cursorPath,
   *   cursorPoint,
   * ]
   */
  function Widgets(context) {
    this.cursorPoint = createCursorPoint();
    this.cursorPath = createCursorPath();
    this.hoverCurve = createHoverCurve();
    this.centerPreAddPoint = createPreAddPoint(false);
    this.hoverPreAddPoint = createPreAddPoint(true);
    this.pickerFrame = createPickerFrame(0, 0, 0, 0);
    this.guides = [];
    this.shape = createShape();
    var scene = context.scene;
    scene.addChild(this.shape);
    scene.addChild(this.hoverPreAddPoint); // path0.main, path0.hint, path1.main, path1.hint...

    scene.addChild(this.hoverCurve); // anchors...

    scene.addChild(this.pickerFrame); // guides...

    scene.addChild(this.centerPreAddPoint);
    scene.addChild(this.cursorPoint);
  }

  var _proto = Widgets.prototype;

  _proto.refreshShape = function refreshShape(context, options) {
    this.shape.remove();
    this.shape = createShape(options);
    context.scene.addChild(this.shape);
    context.render();
  };

  return Widgets;
}();
export var EditableAnchor = /*#__PURE__*/function () {
  function EditableAnchor(segment) {
    this.point = createAnchorPoint();
    this.handleIn = createAnchorHandle();
    this.handleOut = createAnchorHandle();
    this.lineIn = createAnchorLine();
    this.lineOut = createAnchorLine();
    this.anchorType = void 0;
    this.point.position = createPoint(segment.point.x, segment.point.y);
    !segment.handleIn.isZero() && this.setHandleIn(segment.handleIn);
    !segment.handleOut.isZero() && this.setHandleOut(segment.handleOut);
    this.anchorType = getAnchorType(this);
  }

  var _proto2 = EditableAnchor.prototype;

  _proto2.setHandleIn = function setHandleIn(handleIn) {
    if (!handleIn) {
      this.lineIn = createAnchorLine();
      this.handleIn = createAnchorHandle();
      return;
    } else if (handleIn.isZero()) return;

    this.handleIn.position = this.point.position.add(handleIn);
    var newLine = new paper.Path.Line(this.point.position, this.handleIn.position);
    this.lineIn = cloneWithReplace(newLine, this.lineIn);
    this.handleIn.visible = this.lineIn.visible = true;
  };

  _proto2.setHandleOut = function setHandleOut(handleOut) {
    if (!handleOut) {
      this.lineOut = createAnchorLine();
      this.handleOut = createAnchorHandle();
      return;
    } else if (handleOut.isZero()) return;

    this.handleOut.position = this.point.position.add(handleOut);
    var newLine = new paper.Path.Line(this.point.position, this.handleOut.position);
    this.lineOut = cloneWithReplace(newLine, this.lineOut);
    this.handleOut.visible = this.lineOut.visible = true;
  };

  _proto2.remove = function remove() {
    this.point.remove();
    this.handleIn.remove();
    this.handleOut.remove();
    this.lineIn.remove();
    this.lineOut.remove();
  };

  _createClass(EditableAnchor, [{
    key: "segment",
    get: function get() {
      var hin = this.handleIn.position.isZero() ? this.handleIn.position : this.handleIn.position.subtract(this.point.position);
      var hout = this.handleOut.position.isZero() ? this.handleOut.position : this.handleOut.position.subtract(this.point.position);
      return new paper.Segment(this.point.position, hin, hout);
    }
  }]);

  return EditableAnchor;
}();
export var EditablePath = /*#__PURE__*/function () {
  function EditablePath(context) {
    this.context = void 0;
    this.widgets = void 0;
    this.anchors = [];
    this.name = void 0;
    this.main = void 0;
    this.hint = void 0;
    this.offset = void 0;
    this.pickedAnchors = new Set();
    this.tempAlign = new Map();
    this.context = context;
    this.widgets = context.widgets;
    this.main = createMainPath();
    this.hint = createHintPath();
    this.offset = createMainPath();
    context.scene.insertChild(0, this.hint);
    context.scene.insertChild(0, this.main);
    context.scene.insertChild(0, this.offset);
  }

  var _proto3 = EditablePath.prototype;

  _proto3.addAnchor = function addAnchor(anchor) {
    var context = this.context,
        main = this.main,
        hint = this.hint,
        anchors = this.anchors;
    anchors.push(anchor);
    main.add(anchor.segment);
    hint.add(anchor.segment);
    addAnchorToScene(context, anchor);
    this.pickedAnchors.clear();
    this.pickedAnchors.add(this.anchors.length - 1);
  };

  _proto3.setAnchorType = function setAnchorType(type, pickedAnchors) {
    if (pickedAnchors === void 0) {
      pickedAnchors = null;
    }

    var anchors = this.anchors,
        context = this.context,
        main = this.main,
        hint = this.hint;
    var updated = 0;

    if (!pickedAnchors) {
      pickedAnchors = this.pickedAnchors;
    }

    pickedAnchors.forEach(function (i) {
      var anchor = anchors[i];
      if (anchor.anchorType === type) return;
      anchor.remove();

      if (type === 'sharp') {
        toSharp(anchor);
      } else if (anchor.anchorType === 'sharp') {
        sharpToCurve(anchor, anchors, i);
      } else if (type === 'fullMirror') {
        toFullMirror(anchor);
      } else if (type === 'angleMirror') {
        toAngleMirror(anchor);
      }

      anchor.anchorType = type;
      main.removeSegment(i);
      main.insertSegments(i, [anchor.segment]);
      hint.removeSegment(i);
      hint.insertSegments(i, [anchor.segment]);
      addAnchorToScene(context, anchor);
      updated++;
    });
    context.render();
    return !!updated;
  };

  _proto3.movePickedAnchors = function movePickedAnchors(delta) {
    var main = this.main,
        hint = this.hint,
        anchors = this.anchors,
        pickedAnchors = this.pickedAnchors;
    pickedAnchors.forEach(function (index) {
      var mainSegment = main.segments[index];
      var hintSegment = hint.segments[index];
      mainSegment.point = mainSegment.point.add(delta);
      hintSegment.point = hintSegment.point.add(delta);
      moveAnchor(anchors[index], delta);
    });
  };

  _proto3.moveHandle = function moveHandle(delta) {
    var _this4 = this;

    var dragTarget = this.context.state.dragTarget;

    if (dragTarget instanceof HandleTarget) {
      var index = dragTarget.index,
          handleFlag = dragTarget.handleFlag;

      _moveHandle(this, index, delta, handleFlag);
    } else if (dragTarget instanceof AnchorTarget) {
      this.pickedAnchors.forEach(function (index) {
        _moveHandle(_this4, index, delta, true);
      });
    }
  }
  /** 设置锚点位置为吸附后位置，需在 afterRender 时重置以免 model 数据不同步 */
  ;

  _proto3.setTempAlign = function setTempAlign() {
    var anchors = this.anchors,
        pickedAnchors = this.pickedAnchors,
        context = this.context;

    for (var i = 0; i < anchors.length; i++) {
      var picked = pickedAnchors.has(i);
      if (!picked) continue;
      var cursor = context.editor.cursorController.currentCursor;
      cursor === cursors.fitAnchor && (cursor = 'default');

      for (var j = 0; j < anchors.length; j++) {
        if (i === j) continue;

        if (isCloseEnough(anchors[i].point.position, anchors[j].point.position, sizes.anchorMergeRadius * context.modelScale)) {
          // 此时应临时吸附至该锚点
          this.tempAlign.set(i, anchors[i].point.position);
          var target = anchors[j];
          anchors[i].point.position = target.point.position;
          this.main.segments[i].point = target.point.position;
          this.hint.segments[i].point = target.point.position;
          cursor = cursors.fitAnchor;
          break;
        }
      }

      this.context.setCursor(cursor);
    }
  };

  _proto3.resetTempAlign = function resetTempAlign() {
    var _this5 = this;

    this.tempAlign.forEach(function (point, i) {
      _this5.anchors[i].point.position = point;
      _this5.main.segments[i].point = point;
      _this5.hint.segments[i].point = point;
    });
    this.tempAlign.clear();
  };

  _proto3.pickAnchor = function pickAnchor(index) {
    this.pickedAnchors.add(index);
    this.context.events.emit('pickedAnchorChange', this.pickedAnchors);
  };

  _proto3.removePickedAnchor = function removePickedAnchor(index) {
    this.pickedAnchors.delete(index);
    this.context.events.emit('pickedAnchorChange', this.pickedAnchors);
  };

  _proto3.clearPickedAnchor = function clearPickedAnchor() {
    this.pickedAnchors.clear();
    this.context.events.emit('pickedAnchorChange', this.pickedAnchors);
  };

  _proto3.remove = function remove() {
    var main = this.main,
        hint = this.hint,
        offset = this.offset;
    main.remove();
    hint.remove();
    offset.remove();

    for (var _iterator = _createForOfIteratorHelperLoose(this.anchors), _step; !(_step = _iterator()).done;) {
      var anchor = _step.value;
      anchor.remove();
    }
  };

  _createClass(EditablePath, [{
    key: "lastAnchor",
    get: function get() {
      return this.anchors[this.anchors.length - 1];
    }
  }, {
    key: "pickedPositions",
    get: function get() {
      var _this6 = this;

      var positions = [];
      this.pickedAnchors.forEach(function (index) {
        return positions.push(_this6.main.segments[index].point);
      });
      return positions;
    }
  }]);

  return EditablePath;
}();