/**
 * copyright https://github.com/glenzli/paperjs-offset
 */
import paper from 'paper';
import { offsetPath } from "./core";
export var PaperOffset = /*#__PURE__*/function () {
  function PaperOffset() {}

  PaperOffset.offset = function offset(path, _offset, options) {
    options = options || {};
    var newPath = offsetPath(path, _offset, options.join || 'miter', options.limit || 10);

    if (options.insert === undefined) {
      options.insert = true;
    }

    if (options.insert) {
      (path.parent || paper.project.activeLayer).addChild(newPath);
    }

    return newPath;
  };

  return PaperOffset;
}();