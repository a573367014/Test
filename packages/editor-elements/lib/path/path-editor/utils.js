function _createForOfIteratorHelperLoose(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (it) return (it = it.call(o)).next.bind(it); if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; return function () { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

import paper from 'paper';
import { colors, sizes } from "./consts";
import { EditableAnchor, EditablePath, CurveTarget, AnchorTarget, HandleTarget, AnchorHoverTarget } from "./widgets";
import { PaperOffset } from "../paper-offset";
import { getRectRenderRadius, modelColorToPaperColor, paperColorToModelColor } from "../utils";
var Path = paper.Path,
    Point = paper.Point,
    Shape = paper.Shape,
    Rectangle = paper.Rectangle,
    Segment = paper.Segment;
export function initPaper(canvas) {
  var _paper = new paper.PaperScope(); // 多editor实例会导致global paper被污染


  _paper.setup(canvas);

  _paper.settings.insertItems = false;
  _paper.view.autoUpdate = false;
  return _paper;
}
export function isFarEnough(a, b, d) {
  if (d === void 0) {
    d = 2;
  }

  return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) > d * d;
}
export function isCloseEnough(a, b, d) {
  if (d === void 0) {
    d = 4;
  }

  return !isFarEnough(a, b, d);
}
export function isAlmostEqual(a, b, d) {
  if (d === void 0) {
    d = 8;
  }

  return Math.abs(a - b) < d;
}
export function insertAfter(context, target, item) {
  var i = context.scene.children.indexOf(target);
  context.scene.insertChild(i + 1, item);
}
export function insertBefore(context, target, item) {
  var i = context.scene.children.indexOf(target);
  context.scene.insertChild(i, item);
}
export function cloneWithReplace(dataPath, oldStylePath) {
  var newPath = dataPath.clone();
  newPath.fillColor = oldStylePath.fillColor;
  newPath.strokeColor = oldStylePath.strokeColor;
  newPath.strokeWidth = oldStylePath.strokeWidth;
  oldStylePath.replaceWith(newPath);
  return newPath;
}
export function loadModel(context, model) {
  var pathData = model.path;

  if (model.isRect() && model.radius) {
    var shape = new paper.Shape.Rectangle(new paper.Rectangle(createPoint(), createPoint(model.width, model.height)));
    shape.radius = getRectRenderRadius(model);
    pathData = shape.toPath(false).pathData;
  }

  var lines = pathData.split('M').splice(1).map(function (s) {
    return 'M' + s;
  });
  context.paths.forEach(function (editablePath) {
    return editablePath.remove();
  });
  context.paths = [];

  var _loop = function _loop() {
    var commands = _step.value;
    var path = new paper.Path(commands);

    _transformPathWithModel(path, model);

    var editablePath = new EditablePath(context);
    var closed = commands[commands.length - 1].toUpperCase() === 'Z';
    editablePath.main = cloneWithReplace(new Path({
      closed: closed,
      visible: false
    }), editablePath.main);
    editablePath.hint = cloneWithReplace(new Path({
      closed: closed
    }), editablePath.hint);
    context.paths.push(editablePath);
    path.segments.map(function (a) {
      return context.penTool.addAnchor(editablePath, a);
    });
  };

  for (var _iterator = _createForOfIteratorHelperLoose(lines), _step; !(_step = _iterator()).done;) {
    _loop();
  }

  loadStyle(context, model);
  context.currentPath.pickedAnchors.clear();
}

function _transformPathWithModel(path, model) {
  if (isLinePath(path)) {
    var strokeType = model.$currentPathEffect.lineType;
    var offsetY = model.top;
    if (strokeType === 'center') offsetY = model.top + model.height / 2;
    if (strokeType === 'outer') offsetY = model.top + model.height;
    path.translate(createPoint(model.left, offsetY));
    var verticalOffset = 0;
    if (strokeType === 'inner') verticalOffset = model.height / 2;else if (strokeType === 'outer') verticalOffset = -model.height / 2;
    var rotateCenter = createPoint(path.bounds.x + model.width / 2, path.bounds.y + verticalOffset);
    path.rotate(model.rotate, rotateCenter);
  } else {
    path.translate(createPoint(model.left, model.top));
    path.rotate(model.rotate);
  }
}
/**
 * 加载主路径样式
 */


export function loadStyle(context, model) {
  var currentPath = context.currentPath;
  var main = currentPath.main; // 路径样式

  main.strokeColor = new paper.Color(model.$currentPathEffect.color);
  main.strokeWidth = model.$currentPathEffect.width;
  main.opacity = model.opacity;
  model.$fillColor && (main.fillColor = modelColorToPaperColor(model, true));
  context.strokeType = model.$currentPathEffect.lineType || 'center';
}
export function exportModel(context, model) {
  var state = context.state,
      editor = context.editor,
      currentPath = context.currentPath;

  if (state.isPenTool || state.isLiteTool) {
    var path = currentPath.main;
    syncModelWithPath(model, path);
  } else if (state.isShapeTool) {
    var shape = context.widgets.shape; // 未绘制回收

    if (!shape.bounds.width && !shape.bounds.height) {
      editor.currentElement = null;
      return;
    }

    var _path = shape instanceof paper.Shape ? shape.toPath(false) : shape;

    syncModelWithPath(model, _path);

    if (state.isRectTool) {
      model.$lookLike = 'rect';
    }

    context.widgets.shape.visible = false;
    editor.addElement(model);
  }

  editor.makeSnapshotByElement(model);
}

function syncModelWithPath(model, path) {
  if (isLinePath(path)) {
    var strokeType = model.$currentPathEffect.lineType;
    path = path.clone({
      insert: false
    });

    if (strokeType !== 'center') {
      var offset = strokeType === 'inner' ? -path.strokeWidth / 2 : path.strokeWidth / 2;
      path = PaperOffset.offset(path, offset, {
        insert: false
      });
    }

    model.rotate = path.lastSegment.point.subtract(path.firstSegment.point).angle;
    path.rotate(-model.rotate);
    var bounds = path.bounds;
    var strokeBounds = path.strokeBounds;
    model.left = strokeBounds.x;
    model.top = strokeBounds.y;
    model.width = bounds.width;
    model.height = Math.max(1, path.strokeWidth);
  } else {
    path.rotate(-model.rotate);
    var _bounds = path.bounds;
    model.left = _bounds.x;
    model.top = _bounds.y;
    model.width = _bounds.width;
    model.height = Math.max(1, _bounds.height);
  } // 新绘制图形


  if (!model.path && path.fillColor) {
    model.$currentPathEffect.filling = paperColorToModelColor(path.fillColor);
  }

  path.translate(createPoint(-path.bounds.x, -path.bounds.y));
  model.path = path.pathData;
  model.$currentPathEffect.color = path.strokeColor.toCSS(true);
  model.$currentPathEffect.width = path.strokeWidth;

  if (isLinePath(path)) {
    model.$currentPathEffect.filling = null;
    model.$lookLike = 'line';
    model.resize = 4;
  } else if (isRectPath(path)) {
    model.$lookLike = 'rect';
    model.resize = 7;
  } else {
    model.$lookLike = null;
    model.resize = 7;
  }
}

export function moveAnchor(anchor, delta) {
  anchor.point.position = anchor.point.position.add(delta);
  anchor.handleIn.position = addPositionToNoZero(anchor.handleIn.position, delta);
  anchor.handleOut.position = addPositionToNoZero(anchor.handleOut.position, delta);
  anchor.lineIn.position = addPositionToNoZero(anchor.lineIn.position, delta);
  anchor.lineOut.position = addPositionToNoZero(anchor.lineOut.position, delta);
}
export function addPositionToNoZero(position, delta) {
  return !position.isZero() ? position.add(delta) : position;
}
export function moveHandle(path, i, delta, isHandleIn) {
  var anchor = path.anchors[i];
  var anchorHandle = isHandleIn ? anchor.handleIn : anchor.handleOut;
  var followHandle = isHandleIn ? anchor.handleOut : anchor.handleIn;
  var mainSegment = path.main.segments[i];
  var hintSegment = path.hint.segments[i];
  anchorHandle.position = anchorHandle.position.add(delta);

  if (anchor.anchorType === 'fullMirror') {
    followHandle.position = followHandle.position.subtract(delta);
  } else if (anchor.anchorType === 'angleMirror') {
    var len = followHandle.position.getDistance(anchor.point.position);
    var angle = anchor.point.position.subtract(anchorHandle.position).angle;
    followHandle.position = createPoint(len, 0).rotate(angle, null).add(anchor.point.position);
  }

  var line = new paper.Path.Line(anchor.point.position, anchorHandle.position);
  var followLine = !followHandle.position.isZero() ? new paper.Path.Line(anchor.point.position, followHandle.position) : null;
  mainSegment.handleIn = anchor.segment.handleIn;
  hintSegment.handleIn = anchor.segment.handleIn;
  mainSegment.handleOut = anchor.segment.handleOut;
  hintSegment.handleOut = anchor.segment.handleOut;

  if (isHandleIn) {
    anchor.lineIn = cloneWithReplace(line, anchor.lineIn);
    if (followLine) anchor.lineOut = cloneWithReplace(followLine, anchor.lineOut);
  } else {
    anchor.lineOut = cloneWithReplace(line, anchor.lineOut);
    if (followLine) anchor.lineIn = cloneWithReplace(followLine, anchor.lineIn);
  }
}

function updateShapeByBound(context, bound) {
  var state = context.state,
      widgets = context.widgets;

  if (state.isRectTool) {
    widgets.shape = cloneWithReplace(new Shape.Rectangle(bound), widgets.shape);
  } else if (state.isEllipseTool) {
    widgets.shape = cloneWithReplace(new Shape.Ellipse(bound), widgets.shape);
  } else if (state.isTriangleTool) {
    var topCenter = bound.topCenter,
        bottomLeft = bound.bottomLeft,
        bottomRight = bound.bottomRight;
    var path = new Path([topCenter, bottomLeft, bottomRight]);
    path.closePath();
    widgets.shape = cloneWithReplace(path, widgets.shape);
  } else if (state.isLineTool) {
    var topLeft = bound.topLeft,
        _bottomRight = bound.bottomRight;

    var _path2 = new Path([topLeft, _bottomRight]);

    widgets.shape = cloneWithReplace(_path2, widgets.shape);
  }
}

export function updateShape(context, e) {
  var state = context.state,
      widgets = context.widgets;
  var from = createPoint(e.start.x, e.start.y, context.modelScale);
  var to = createPoint(e.x, e.y, context.modelScale);

  if (state.isRectTool || state.isEllipseTool || state.isTriangleTool) {
    var bound = new Rectangle(from, to);

    if (e.keys.shift) {
      var size = Math.max(bound.width, bound.height);
      bound.width = bound.height = size;
    } // 动态更新渐变值范围


    var shape = widgets.shape;

    if (shape.fillColor && shape.fillColor.type === 'gradient') {
      var fillColor = shape.fillColor;
      var _shape$bounds = shape.bounds,
          left = _shape$bounds.left,
          top = _shape$bounds.top,
          width = _shape$bounds.width,
          height = _shape$bounds.height;

      if (!width) {
        fillColor.origin.x += left;
        fillColor.origin.y += top;
      } else {
        fillColor.destination.x = fillColor.origin.x + width;
        fillColor.destination.y = fillColor.origin.y;
      }
    }

    updateShapeByBound(context, bound);
  } else if (state.isLineTool) {
    var path = new Path([from, to]);
    widgets.shape = cloneWithReplace(path, widgets.shape);
  }

  widgets.shape.visible = true;
}
export function addShape(context, e) {
  var width = context.width,
      height = context.height,
      modelScale = context.modelScale;
  var size = Math.min(width / 2, height / 2);
  var center = createPoint(e.x, e.y, modelScale);
  var half = createPoint(size / 2, size / 2, modelScale);
  var from = center.subtract(half);
  var to = center.add(half);
  var bound = new Rectangle(from, to);
  updateShapeByBound(context, bound);
}
export function testPreAddPoint(context, point) {
  var _context$widgets = context.widgets,
      hoverPreAddPoint = _context$widgets.hoverPreAddPoint,
      centerPreAddPoint = _context$widgets.centerPreAddPoint;
  centerPreAddPoint.fillColor = colors.white;
  var hasPreAddPoint = false;

  for (var _iterator2 = _createForOfIteratorHelperLoose(context.currentPath.main.curves), _step2; !(_step2 = _iterator2()).done;) {
    var curve = _step2.value;
    var nearest = curve.getNearestPoint(point);
    var center = createPoint((curve.segment1.point.x + curve.segment2.point.x) / 2, (curve.segment1.point.y + curve.segment2.point.y) / 2); // nearest 与 point 足够近时，需在该段 curve 上展示预添加锚点

    if (isCloseEnough(nearest, point, 6 * context.modelScale)) {
      hasPreAddPoint = true;
      hoverPreAddPoint.position = nearest; // 直线上必存在 center 点，可能存在 hover 点

      if (curve.isStraight()) {
        centerPreAddPoint.visible = true;
        centerPreAddPoint.position = center; // 离 center 足够近时，仅使用 center 并使其高亮

        if (isCloseEnough(nearest, center, 6 * context.modelScale)) {
          hoverPreAddPoint.visible = false;
          centerPreAddPoint.fillColor = colors.lightBlue;
        } else {
          hoverPreAddPoint.visible = true;
        }
      } // 曲线上只存在 hover 点
      else {
        centerPreAddPoint.visible = false;
        hoverPreAddPoint.visible = true;
      }

      break;
    }
  }

  if (!hasPreAddPoint) {
    hoverPreAddPoint.visible = centerPreAddPoint.visible = false;
  }

  return hasPreAddPoint;
}
export function testAnchorHover(context, point) {
  var state = context.state,
      currentPath = context.currentPath,
      modelScale = context.modelScale;

  for (var i = 0; i < currentPath.main.segments.length; i++) {
    var segment = currentPath.main.segments[i];
    var closeEnough = isCloseEnough(segment.point, point, sizes.hoverRadius * modelScale);

    if (closeEnough) {
      state.hoverTarget = new AnchorHoverTarget(currentPath, i);
      context.widgets.hoverPreAddPoint.visible = false;
      return true;
    }
  }

  return false;
}
export function testHandleHover(context, point) {
  var currentPath = context.currentPath,
      state = context.state,
      modelScale = context.modelScale;
  var hitHandle = null;
  var isHandleIn = false;
  var hitIndex = -1;

  for (var i = 0; i < currentPath.anchors.length; i++) {
    var anchor = currentPath.anchors[i];
    var handleIn = anchor.handleIn,
        handleOut = anchor.handleOut;
    var hitResultIn = isCloseEnough(handleIn.position, point, sizes.hoverRadius * modelScale);
    var hitResultOut = isCloseEnough(handleOut.position, point, sizes.hoverRadius * modelScale);

    if (hitResultIn && !handleIn.position.equals(anchor.point.position)) {
      hitHandle = handleIn;
    }

    if (hitResultOut && !handleOut.position.equals(anchor.point.position)) {
      hitHandle = handleOut;
    }

    hitIndex = i;
    isHandleIn = hitResultIn && !hitResultOut;
    if (hitResultIn || hitResultOut) break;
  }

  if (hitHandle) {
    state.hoverTarget = new HandleTarget(currentPath, hitIndex, isHandleIn);
    return true;
  } else {
    state.hoverTarget = null;
    return false;
  }
}
export function testCurveDrag(context, e) {
  var _hitResult$location;

  var currentPath = context.currentPath,
      state = context.state;
  var point = createPoint(e.x, e.y, context.modelScale);
  var hitResult = currentPath.main.hitTest(point);

  if (hitResult !== null && hitResult !== void 0 && (_hitResult$location = hitResult.location) !== null && _hitResult$location !== void 0 && _hitResult$location.curve) {
    var index = hitResult.location.curve.index;
    state.dragTarget = new CurveTarget(currentPath, index);
    return true;
  }

  return false;
}
export function testAnchorMousedown(context, e, isDrag) {
  var state = context.state,
      currentPath = context.currentPath,
      widgets = context.widgets,
      modelScale = context.modelScale;
  var newPickedAnchors = new Set();
  var point = createPoint(e.x, e.y, context.modelScale);

  for (var i = 0; i < currentPath.main.segments.length; i++) {
    var segment = currentPath.main.segments[i];
    var closeEnough = isCloseEnough(segment.point, point, sizes.hoverRadius * modelScale);

    if (closeEnough) {
      // 原有参考线偏移调整，未适配 zoom
      // const [snap] = getSnap(context, point.x, point.y);
      // const baseOffset = createPoint(snap.x - segment.point.x, snap.y - segment.point.y);
      // const snapPoint = createPoint(snap.x, snap.y);
      // moveAnchor(currentPath.anchors[i], baseOffset);
      // segment.point = snapPoint;
      // currentPath.hint.segments[i].point = snapPoint;
      newPickedAnchors.add(i); // 若按住 command 拖拽锚点，转为以 fullMirror 类型形式重置控制点

      if (e.keys.cmd && isDrag) {
        // 此时不允许多个 pickedAnchor
        currentPath.pickedAnchors.clear();
        currentPath.pickedAnchors.add(i);
        var anchor = currentPath.anchors[i];
        currentPath.setAnchorType('fullMirror');
        anchor.setHandleIn(createPoint(0.1, 0.1));
        anchor.setHandleOut(createPoint(0.1, 0.1));
        currentPath.main.segments[i] = anchor.segment.clone();
        currentPath.hint.segments[i] = anchor.segment.clone();
        break;
      }
    }
  }

  if (newPickedAnchors.size === 0) return false;else if (newPickedAnchors.size > 1) {
    // 选择重叠最上层anchor
    var targetIndex = 0;
    newPickedAnchors.forEach(function (i) {
      var seg = currentPath.main.segments[i];
      var targetSeg = currentPath.main.segments[targetIndex];
      if (seg.index > targetSeg.index) targetIndex = i;
    });
    newPickedAnchors.clear();
    newPickedAnchors.add(targetIndex);
  }
  {
    var moveTogether = false;
    currentPath.pickedAnchors.forEach(function (i) {
      if (newPickedAnchors.has(i)) moveTogether = true;
    });
    if (!moveTogether) currentPath.pickedAnchors.clear();

    for (var _iterator3 = _createForOfIteratorHelperLoose(newPickedAnchors), _step3; !(_step3 = _iterator3()).done;) {
      var _i = _step3.value;
      currentPath.pickAnchor(_i);
    }

    state.dragTarget = new AnchorTarget(currentPath);
    widgets.centerPreAddPoint.visible = widgets.hoverPreAddPoint.visible = false;
    return true;
  }
}
export function testHandleDrag(context, e) {
  var currentPath = context.currentPath,
      state = context.state,
      widgets = context.widgets,
      modelScale = context.modelScale,
      liteTool = context.liteTool;
  var point = createPoint(e.x, e.y, context.modelScale);
  var hitHandle = null;
  var isHandleIn = false;
  var hitIndex = -1;

  for (var i = 0; i < currentPath.anchors.length; i++) {
    var anchor = currentPath.anchors[i];
    var handleIn = anchor.handleIn,
        handleOut = anchor.handleOut;
    var hitResultIn = isCloseEnough(handleIn.position, point, sizes.hoverRadius * modelScale);
    var hitResultOut = isCloseEnough(handleOut.position, point, sizes.hoverRadius * modelScale);

    if (hitResultIn && !handleIn.position.equals(anchor.point.position)) {
      hitHandle = handleIn;
    }

    if (hitResultOut && !handleOut.position.equals(anchor.point.position)) {
      hitHandle = handleOut;
    }

    hitIndex = i;
    isHandleIn = hitResultIn && !hitResultOut;

    if (hitResultIn || hitResultOut) {
      // 按住 command 时的初始化行为
      if (e.keys.cmd) {
        var baseDelta = isHandleIn ? handleIn.position.subtract(anchor.point.position) : handleOut.position.subtract(anchor.point.position);
        liteTool.setAnchorType('fullMirror', new Set([i]));
        anchor.setHandleIn(createPoint(0.1, 0.1));
        anchor.setHandleOut(createPoint(0.1, 0.1));
        moveHandle(currentPath, i, baseDelta, isHandleIn);
      } // 按住 alt 时的初始化行为


      if (e.keys.alt) {
        liteTool.setAnchorType('noMirror', new Set([i]));
      }

      break;
    }
  }

  if (hitHandle) {
    state.dragTarget = new HandleTarget(currentPath, hitIndex, isHandleIn);
    widgets.centerPreAddPoint.visible = widgets.hoverPreAddPoint.visible = false;
    return true;
  }

  return false;
}
export function trySwitchAnchorType(context, point) {
  var currentPath = context.currentPath,
      modelScale = context.modelScale,
      liteTool = context.liteTool;

  for (var i = 0; i < currentPath.main.segments.length; i++) {
    var segment = currentPath.main.segments[i];
    var closeEnough = isCloseEnough(segment.point, point, sizes.hoverRadius * modelScale);
    var anchor = currentPath.anchors[i];

    if (closeEnough) {
      var isSharp = anchor.handleIn.position.isZero() && anchor.handleOut.position.isZero();
      var picked = new Set().add(i);

      if (isSharp) {
        liteTool.setAnchorType('angleMirror', picked);
      } else {
        liteTool.setAnchorType('sharp', picked);
      }
    }
  }
}
export function addAnchorToScene(context, anchor) {
  var widgets = context.widgets;
  insertBefore(context, widgets.cursorPath, anchor.point);
  insertAfter(context, widgets.hoverCurve, anchor.handleIn);
  insertAfter(context, widgets.hoverCurve, anchor.lineIn);
  insertAfter(context, widgets.hoverCurve, anchor.handleOut);
  insertAfter(context, widgets.hoverCurve, anchor.lineOut);
}
export function insertAnchor(context, position) {
  var currentPath = context.currentPath,
      widgets = context.widgets;
  var locationMain = currentPath.main.getNearestLocation(position);
  var locationHint = currentPath.hint.getNearestLocation(position);
  currentPath.main.divideAt(locationMain);
  currentPath.hint.divideAt(locationHint);
  widgets.centerPreAddPoint.visible = widgets.hoverPreAddPoint.visible = false;
  var anchor = new EditableAnchor(createSegment(position.x, position.y));
  var inserted = false;

  for (var i = 0; i < currentPath.main.segments.length; i++) {
    var segment = currentPath.main.segments[i];

    if (isCloseEnough(segment.point, anchor.point.position, 2)) {
      inserted = true;
      currentPath.anchors.splice(i, 0, anchor);
      currentPath.pickAnchor(i);
      anchor.setHandleIn(segment.handleIn);
      anchor.setHandleOut(segment.handleOut);
      break;
    }
  }

  if (!inserted) {
    console.error('新增 anchor 未正确同步');
  }

  addAnchorToScene(context, anchor);
}
export function refreshPickerFrame(context, e) {
  var newFrame = createPickerFrame(e.start.x, e.start.y, e.x, e.y, context.modelScale);
  var currentPath = context.currentPath;
  context.widgets.pickerFrame.replaceWith(newFrame);
  context.widgets.pickerFrame = newFrame;
  context.widgets.pickerFrame.visible = true;
  currentPath.anchors.forEach(function (anchor, i) {
    var result = newFrame.hitTest(anchor.point.position);
    if (result) currentPath.pickAnchor(i);else currentPath.removePickedAnchor(i);
  });
}

function refreshGuides(context, snappedPoint, targets) {
  var widgets = context.widgets;
  var pickerFrame = widgets.pickerFrame;
  widgets.guides.forEach(function (guide) {
    return guide.remove();
  });
  var newGuides = [];
  targets.forEach(function (targetPoint) {
    var guide = createGuide(snappedPoint, targetPoint);
    newGuides.push(guide);
    insertAfter(context, pickerFrame, guide);
  });
  widgets.guides = newGuides;
}

export function getSnap(context, x, y) {
  x *= context.modelScale;
  y *= context.modelScale;
  var snappedX = false;
  var snappedY = false;
  var snapTargets = [];
  var snap = {
    x: x,
    y: y
  };
  var _context$currentPath = context.currentPath,
      anchors = _context$currentPath.anchors,
      pickedAnchors = _context$currentPath.pickedAnchors;

  for (var i = 0; i < anchors.length; i++) {
    if (pickedAnchors.has(i)) continue;
    var anchor = anchors[i].point.position;

    if (isAlmostEqual(anchor.x, x)) {
      snappedX = true;
      snap.x = anchor.x;
      if (!snappedY) snap.y = y;
      snapTargets.push(anchor);
    }

    if (isAlmostEqual(anchor.y, y)) {
      snappedY = true;
      snap.y = anchor.y;
      if (!snappedX) snap.x = x;
      snapTargets.push(anchor);
    }

    if (snappedX && snappedY) break;
  }

  return [snap, snapTargets];
}
export function refreshSnapGuides(context, e) {
  var _getSnap = getSnap(context, e.x, e.y),
      snap = _getSnap[0],
      snapTargets = _getSnap[1];

  var snappedPoint = createPoint(snap.x, snap.y);
  refreshGuides(context, snappedPoint, snapTargets);
}
export function resetSnapGuides(context) {
  context.widgets.guides.forEach(function (guide) {
    return guide.remove();
  });
  context.widgets.guides = [];
}

function tryMergeAdjacentAnchor(context, point) {
  var path = context.currentPath;

  for (var i = 0; i < path.anchors.length; i++) {
    var anchor = path.anchors[i];

    if (path.pickedAnchors.has(i)) {
      var prev = path.anchors[i - 1];
      var next = path.anchors[i + 1];
      var mergePrev = prev && isCloseEnough(prev.point.position, anchor.point.position, sizes.anchorMergeRadius * context.modelScale);
      var mergeNext = next && isCloseEnough(next.point.position, anchor.point.position, sizes.anchorMergeRadius * context.modelScale);

      if (mergePrev || mergeNext) {
        var removeIndex = null;

        if (mergePrev) {
          removeIndex = path.tempAlign.has(i) ? i - 1 : i;
        } else {
          removeIndex = path.tempAlign.has(i) ? i + 1 : i;
        }

        path.main.removeSegment(removeIndex);
        path.hint.removeSegment(removeIndex);
        path.anchors[removeIndex].remove();
        path.anchors.splice(removeIndex, 1);
        path.pickedAnchors.clear();
        path.anchors.forEach(function (anchor, i) {
          if (anchor.point.hitTest(point)) path.pickAnchor(i);
        });
        return true;
      }
    }
  }

  return false;
}

function isHeadTailOverlapping(path) {
  if (path.pickedAnchors.size !== 1) return false;
  var anchors = path.anchors;
  var last = anchors.length - 1;

  if (path.pickedAnchors.has(0) || path.pickedAnchors.has(last)) {
    if (isCloseEnough(anchors[0].point.position, anchors[last].point.position)) {
      // 保证起止锚点位置完全一致，此时方可令 paper 合并起止的 segement
      anchors[last].point.position = path.main.segments[last].point = path.hint.segments[last].point = anchors[0].point.position;
      return true;
    }
  }

  return false;
}

export function tryMergeAnchors(context, point) {
  var state = context.state,
      currentPath = context.currentPath;
  if (!(state.dragTarget instanceof AnchorTarget)) return;
  var pickedAnchors = currentPath.pickedAnchors,
      anchors = currentPath.anchors;
  var anchorSlice = Array.from(pickedAnchors);
  var allOverlapped = anchorSlice.every(function (i) {
    return isCloseEnough(anchors[i].point.position, anchors[0].point.position);
  });
  var hasMultiDifferentPosition = pickedAnchors.size > 1 && !allOverlapped; // 若有多个不同位置的 anchor 被多选拖拽，不应 merge

  if (hasMultiDifferentPosition) return;

  if (pickedAnchors.size === 1) {
    // 若 pickedAnchor 为起止锚点且停留在另一端上，关闭该路径
    if (isHeadTailOverlapping(currentPath)) {
      currentPath.main.closePath();
      currentPath.hint.closePath();
      var lastIndex = currentPath.anchors.length - 1;
      currentPath.anchors[lastIndex].remove();
      currentPath.anchors.pop();
      currentPath.pickedAnchors.delete(lastIndex);
    } // 若移动到相邻锚点上，合并两锚点
    else if (tryMergeAdjacentAnchor(context, point)) {
      return 0;
    }
  } // 若所有 pickedAnchor 均在相同坐标，此时可能停在一个非 picked 的 anchor 上
  // 但此时该位置所有锚点会自然形成联动，无需特殊处理
  // else if (allOverlapped) {}

}
export function beforeRenderCursor(context) {
  var state = context.state,
      widgets = context.widgets,
      currentPath = context.currentPath;
  var cursorPoint = widgets.cursorPoint,
      cursorPath = widgets.cursorPath;
  var cursorVisible = state.isPenTool && state.usePenCursor && state.mouseInCanvas;
  cursorPoint.visible = cursorVisible;
  cursorPath.visible = cursorVisible && currentPath.pickedPositions.every(function (position) {
    return isFarEnough(position, cursorPoint.position);
  });
}
export function beforeRenderHoverCurve(context) {
  var state = context.state,
      widgets = context.widgets,
      modelScale = context.modelScale;
  scaleItem(widgets.centerPreAddPoint, modelScale);
  scaleItem(widgets.hoverPreAddPoint, modelScale);
  if (!(state.dragTarget instanceof CurveTarget)) return;
  var _state$dragTarget = state.dragTarget,
      path = _state$dragTarget.path,
      index = _state$dragTarget.index;

  if (path !== null) {
    var curve = path.hint.curves[index];
    var segment = new Path();
    segment.add(curve.segment1, curve.segment2);
    widgets.hoverCurve = cloneWithReplace(segment, widgets.hoverCurve);
    widgets.hoverCurve.visible = true;
  } else {
    widgets.hoverCurve.visible = false;
  }
}

function setAnchorStyle(anchor, picked, hover) {
  if (!picked) {
    anchor.fillColor = colors.white;
    anchor.strokeColor = hover ? colors.lighterBlue : colors.lightBlue;
  } else {
    anchor.strokeColor = anchor.fillColor = colors.lightBlue;
  }
}

function setHandleStyle(handle, _line, hover) {
  if (hover) {
    handle.fillColor = colors.lightBlue;
  } else {
    handle.fillColor = colors.white;
  }
}

function scaleItem(item, val) {
  item.matrix.a = item.matrix.d = val;
}

export function beforeRenderAnchor(context) {
  var state = context.state,
      currentPath = context.currentPath,
      modelScale = context.modelScale;
  var pickedAnchors = currentPath.pickedAnchors,
      anchors = currentPath.anchors;
  var hoverTarget = state.hoverTarget; // 设置锚点 hover 状态

  anchors.forEach(function (anchor, i) {
    var picked = pickedAnchors.has(i);
    var hover = hoverTarget && hoverTarget instanceof AnchorHoverTarget && hoverTarget.index === i;
    setAnchorStyle(anchor.point, picked, hover);
    scaleItem(anchor.point, modelScale);
    scaleItem(anchor.handleIn, modelScale);
    scaleItem(anchor.handleOut, modelScale);
  });
  currentPath.setTempAlign();
}
export function beforeRenderHandle(context) {
  var _context$state = context.state,
      dragTarget = _context$state.dragTarget,
      hoverTarget = _context$state.hoverTarget;
  var target = null;

  if (dragTarget && dragTarget instanceof HandleTarget) {
    target = dragTarget;
  }

  if (hoverTarget && hoverTarget instanceof HandleTarget) {
    target = hoverTarget;
  }

  if (target) {
    var _target = target,
        path = _target.path,
        index = _target.index,
        handleFlag = _target.handleFlag;
    var anchor = path.anchors[index];
    handleFlag ? setHandleStyle(anchor.handleIn, anchor.lineIn, true) : setHandleStyle(anchor.handleOut, anchor.lineOut, true);
  }
}
export function beforeRenderMain(context) {
  var strokeType = context.strokeType,
      paths = context.paths;
  paths.forEach(function (path) {
    var main = path.main;
    var dataPath = main.clone({
      insert: false
    });

    if (strokeType !== 'center') {
      var d = strokeType === 'inner' ? -1 : 1;
      dataPath = PaperOffset.offset(dataPath, dataPath.strokeWidth / 2 * d, {
        insert: false
      });
    }

    dataPath.visible = true;
    path.offset.remove();
    path.offset = dataPath;
    context.scene.insertChild(0, path.offset);
  });
}
export function afterRenderAnchor(context) {
  var currentPath = context.currentPath;
  currentPath.pickedAnchors.forEach(function (index) {
    var pickedAnchor = currentPath.anchors[index].point;
    setAnchorStyle(pickedAnchor, true, false);
  });
  currentPath.anchors.forEach(function (anchor) {
    setAnchorStyle(anchor.point, false, false);
    setHandleStyle(anchor.handleIn, anchor.lineIn, false);
    setHandleStyle(anchor.handleOut, anchor.lineOut, false);
  });
  currentPath.resetTempAlign();
}
export function createPoint(x, y, scale) {
  if (x === void 0) {
    x = 0;
  }

  if (y === void 0) {
    y = 0;
  }

  if (scale === void 0) {
    scale = 1;
  }

  return new Point(x * scale, y * scale);
}
export function createSegment(x, y) {
  if (x === void 0) {
    x = 0;
  }

  if (y === void 0) {
    y = 0;
  }

  return new Segment(createPoint(x, y));
}
export function createAnchorPoint(x, y) {
  if (x === void 0) {
    x = 0;
  }

  if (y === void 0) {
    y = 0;
  }

  var anchor = new Shape.Rectangle({
    center: [x, y],
    size: sizes.anchorSize
  });
  anchor.strokeColor = colors.lightBlue;
  anchor.strokeWidth = sizes.anchorStrokeWidth;
  anchor.fillColor = colors.white;
  return anchor;
}
export function createCursorPoint() {
  var cursorPoint = new Shape.Circle(createPoint(), sizes.anchorRadius);
  cursorPoint.strokeColor = colors.lightBlue;
  cursorPoint.fillColor = colors.white;
  cursorPoint.visible = false;
  return cursorPoint;
}
export function createPreAddPoint(fill) {
  var cursorPoint = new Shape.Circle(createPoint(), sizes.anchorRadius);
  cursorPoint.strokeColor = colors.lightBlue;
  cursorPoint.fillColor = fill ? colors.lightBlue : colors.white;
  cursorPoint.visible = false;
  return cursorPoint;
}
export function createMainPath() {
  var path = new Path();
  path.strokeColor = colors.black;
  path.strokeWidth = 4; // debug

  return path;
}
export function createHintPath() {
  var hintPath = new Path();
  hintPath.strokeColor = colors.lightBlue;
  return hintPath;
}
export function createCursorPath() {
  var cursorPath = new Path();
  cursorPath.strokeColor = colors.lightBlue;
  return cursorPath;
}
export function createHoverCurve() {
  var hoverCurve = new Path();
  hoverCurve.strokeColor = colors.white;
  hoverCurve.visible = false;
  return hoverCurve;
}
export function createAnchorHandle() {
  var anchorHandle = new Shape.Circle(createPoint(), sizes.handleRadius);
  anchorHandle.fillColor = colors.white;
  anchorHandle.strokeColor = colors.lightBlue;
  anchorHandle.visible = false;
  return anchorHandle;
}
export function createAnchorLine() {
  var anchorLine = new Path.Line(createPoint(), createPoint());
  anchorLine.strokeColor = colors.lightBlue;
  anchorLine.visible = false;
  return anchorLine;
}
export function createPickerFrame(x1, y1, x2, y2, scale) {
  if (scale === void 0) {
    scale = 1;
  }

  var point1 = createPoint(Math.min(x1, x2), Math.min(y1, y2), scale);
  var point2 = createPoint(Math.max(x1, x2), Math.max(y1, y2), scale);
  var pickerFrame = new Shape.Rectangle(point1, point2);
  pickerFrame.fillColor = colors.lightBlue;
  pickerFrame.opacity = 0.15;
  pickerFrame.visible = false;
  return pickerFrame;
}

function createGuide(point1, point2) {
  var guide = new Path.Line(point1, point2);
  guide.strokeColor = colors.red;
  return guide;
}

export function createShape(options) {
  if (options === void 0) {
    options = {};
  }

  var shape = new Shape();
  shape.fillColor = options.fillColor || colors.defaultFill;
  shape.strokeColor = options.strokeColor || colors.defaultStroke;
  shape.strokeWidth = options.strokeWidth || 0;
  shape.visible = false;
  return shape;
}
export function getAnchorType(anchor) {
  if (anchor.anchorType) return anchor.anchorType;
  var handleIn = anchor.handleIn,
      handleOut = anchor.handleOut;
  var p0 = handleIn.position;
  var p1 = anchor.point.position;
  var p2 = handleOut.position;

  if (p0.isZero() && p2.isZero()) {
    return 'sharp';
  } else if (Math.abs(p0.subtract(p1).angle - p1.subtract(p2).angle) < 0.001) {
    if (p1.getDistance(p0) === p1.getDistance(p2)) return 'fullMirror';else return 'angleMirror';
  } else return 'noMirror';
}
export function isLinePath(path) {
  return path.segments.length === 2 && !path.segments.filter(function (seg) {
    return !seg.handleIn.isZero() || !seg.handleOut.isZero();
  }).length;
}
export function isRectPath(path) {
  var shape = path.toShape(false);
  return !!shape && shape.type === 'rectangle';
}