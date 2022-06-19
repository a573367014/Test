"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _bluebird = _interopRequireDefault(require("bluebird"));

const slice = Array.prototype.slice;

const pickFile = ({
  multiple = false,
  accept = '*/*'
} = {}) => {
  const doc = document;
  const body = doc.body || doc.documentElement;
  return new _bluebird.default(resolve => {
    const input = doc.createElement('input');

    const clearInput = () => {
      body.removeEventListener('mousedown', clearInput, false);
      body.removeChild(input);
      input.onchange = null;
    };

    multiple && input.setAttribute('multiple', multiple);
    input.setAttribute('type', 'file');
    input.setAttribute('accept', accept);
    input.style.cssText = 'position:absolute;top:-199px;height:0;opacity:0';

    input.onchange = () => {
      const files = slice.call(input.files);

      if (!files[0]) {
        return;
      }

      resolve(multiple ? files : files[0]);
    };

    body.appendChild(input);
    input.click();
    body.addEventListener('mousedown', clearInput, false);
  });
};

var _default = pickFile;
exports.default = _default;