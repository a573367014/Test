"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.readSvgXml = exports.default = void 0;

var _bluebird = _interopRequireDefault(require("bluebird"));

var _ua = require("./ua");

const readSvgXml = xml => {
  const div = document.createElement('div');
  div.style.cssText = 'max-width: 500px; position: absolute; top: -10000px; left: -100000px';
  div.innerHTML = xml;
  document.body.appendChild(div);
  const svg = div.querySelector('svg');
  const {
    width,
    height
  } = svg.getBBox();

  if (!svg.getAttribute('width') && width && height) {
    svg.setAttribute('width', Math.round(width) + 'px');
    svg.setAttribute('height', Math.round(height) + 'px');
  }

  xml = div.innerHTML;
  document.body.removeChild(div);
  return xml;
};

exports.readSvgXml = readSvgXml;

const readFile = (file, dataType = 'DataURL') => {
  return new _bluebird.default((resolve, reject) => {
    const reader = new FileReader();
    const fnName = `readAs${dataType}`;

    if (!reader[fnName]) {
      throw new Error('File read error, dataType not support');
    }

    reader.onerror = () => {
      reject(new Error('File read error'));
    };

    reader.onload = () => {
      try {
        if ((0, _ua.isFireFox)() && file.type.includes('svg') && dataType === 'Text') {
          resolve(readSvgXml(reader.result));
          return;
        }
      } catch (e) {}

      resolve(reader.result);
    };

    reader[fnName](file);
  });
};

var _default = readFile;
exports.default = _default;