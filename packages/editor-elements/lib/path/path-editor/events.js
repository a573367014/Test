import { isFarEnough } from "./utils";
import { Hotkeys } from "@gaoding/editor-utils/lib/hotkeys";

function toCanvasEvent(e, rect, startX, startY, last) {
  if (last === void 0) {
    last = null;
  }

  var delta = {
    x: 0,
    y: 0
  };
  var start = {
    x: startX,
    y: startY
  };
  var offsetX = e.clientX - rect.left;
  var offsetY = e.clientY - rect.top;
  var canvasEvent = {
    x: offsetX,
    y: offsetY,
    delta: delta,
    start: start,
    keys: {
      shift: e.shiftKey,
      cmd: e.metaKey || e.ctrlKey,
      alt: e.altKey
    }
  };

  if (last) {
    delta.x = offsetX - last.x;
    delta.y = offsetY - last.y;
  }

  return canvasEvent;
}

export function initEvents(canvas, onDragStart, onDragMove, onDragEnd, onClick, onDblClick, onMouseMove, onMouseOut) {
  var startX = -Infinity;
  var startY = -Infinity;
  var isDragging = false;
  var last = null;
  var rect = null;

  var mouseOutHandler = function mouseOutHandler(e) {
    return onMouseOut(toCanvasEvent(e, rect, startX, startY));
  };

  var mouseDownHandler = function mouseDownHandler(e) {
    rect = canvas.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;
    isDragging = false;
    last = toCanvasEvent(e, rect, startX, startY);
    document.addEventListener('mouseup', mouseUpHandler);
    document.addEventListener('mouseout', mouseOutHandler);
  };

  var mouseMoveHandler = function mouseMoveHandler(e) {
    if (!rect) rect = canvas.getBoundingClientRect();
    var a = {
      x: startX,
      y: startY
    };
    var offsetX = e.clientX - rect.left;
    var offsetY = e.clientY - rect.top;
    var b = {
      x: offsetX,
      y: offsetY
    };

    if (!last) {
      onMouseMove(toCanvasEvent(e, rect, startX, startY, last));
      return;
    }

    if (isFarEnough(a, b) && !isDragging) {
      isDragging = true;
      onDragStart(last);
    }

    if (isDragging) {
      onDragMove(toCanvasEvent(e, rect, startX, startY, last));
      onMouseMove(toCanvasEvent(e, rect, startX, startY, last));
      last = toCanvasEvent(e, rect, startX, startY);
    }
  };

  var mouseUpHandler = function mouseUpHandler(e) {
    if (!isDragging) onClick(toCanvasEvent(e, rect, startX, startY));else onDragEnd(toCanvasEvent(e, rect, startX, startY, last));
    startX = startY = -Infinity;
    isDragging = false;
    last = null;
    document.removeEventListener('mouseup', mouseUpHandler);
    document.removeEventListener('mouseout', mouseOutHandler);
  };

  canvas.addEventListener('mousedown', mouseDownHandler);
  canvas.addEventListener('mousemove', mouseMoveHandler);
  canvas.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    e.stopPropagation();
  });
  canvas.addEventListener('dblclick', function (e) {
    onDblClick(toCanvasEvent(e, rect, startX, startY));
  });
}
export function initKeyEvents(context) {
  var canvas = context.canvas;
  var hotKeys = new Hotkeys();
  hotKeys.init(createKeyMap(context));
  canvas.addEventListener('keydown', function (e) {
    if (hotKeys.fire(e) !== false) e.preventDefault();
  });
  canvas.focus();
}

function createKeyMap(context) {
  return {
    'esc,enter': function escEnter() {
      context.editor.currentElement.$editing = false;
    },
    'ctrl+a, command+a': function ctrlACommandA() {
      if (context.state.isLiteTool) {
        context.currentPath.anchors.forEach(function (_, i) {
          context.currentPath.pickAnchor(i);
        });
        context.render();
      }
    },
    tab: function tab() {
      if (context.state.isLiteTool) {
        var _context$currentPath = context.currentPath,
            pickedAnchors = _context$currentPath.pickedAnchors,
            anchors = _context$currentPath.anchors;
        var index = 0;

        if (pickedAnchors.size === 1) {
          index = pickedAnchors.values().next().value + 1;
          if (index >= anchors.length) index = 0;
        }

        pickedAnchors.clear();
        context.currentPath.pickAnchor(index);
        context.render();
      }
    },
    'delete, backspace': function deleteBackspace() {
      if (context.state.isLiteTool) {
        context.liteTool.removeAnchor();
        context.undoManager.makeSnapshot();
      }
    },
    'ctrl+z, command+z': function ctrlZCommandZ() {
      if (context.state.isLiteTool) {
        context.undoManager.undo();
      }
    },
    'ctrl+shift+z, command+shift+z': function ctrlShiftZCommandShiftZ() {
      if (context.state.isLiteTool) {
        context.undoManager.redo();
      }
    }
  };
}