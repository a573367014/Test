"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _noop2 = _interopRequireDefault(require("lodash/noop"));

var _forEachRight2 = _interopRequireDefault(require("lodash/forEachRight"));

var _assign2 = _interopRequireDefault(require("lodash/assign"));

var _zepto = _interopRequireDefault(require("./zepto"));

var _dom = _interopRequireDefault(require("./dom"));

const doc = (0, _zepto.default)(document);
const queue = [];
const outClick = {
  queue: queue,

  add(options) {
    options = (0, _assign2.default)({
      callback: _noop2.default,
      delay: true,
      element: null
    }, options);

    if (!options.element) {
      throw new Error('No options.element');
    }

    let removed = false;

    if (options.delay) {
      setTimeout(() => {
        if (!removed) {
          queue.push(options);
        }
      }, +options.delay || 16);
    } else {
      queue.push(options);
    }

    outClick.initEvent();
    return function () {
      outClick.remove(options);
      removed = true;
    };
  },

  remove(options) {
    const inx = queue.lastIndexOf(options);

    if (inx > -1) {
      queue.splice(inx, 1);
    }

    if (!queue.length) {
      outClick.resetEvent();
    }
  },

  checkTask(task, e) {
    const element = task.element;

    if (_dom.default.contains(element, e.target)) {
      return;
    }

    task.callback(e);
  },

  check(e) {
    (0, _forEachRight2.default)(queue, task => {
      outClick.checkTask(task, e);
    });
  },

  initEvent() {
    if (outClick.bound) {
      return;
    }

    outClick.bound = true;
    doc.on('click.editor-out-click', outClick.check);
  },

  resetEvent() {
    if (outClick.bound) {
      doc.off('click.editor-out-click');
      outClick.bound = false;
    }
  }

};
var _default = {
  outClick: outClick,

  addOutClick(options) {
    return outClick.add(options);
  }

};
exports.default = _default;