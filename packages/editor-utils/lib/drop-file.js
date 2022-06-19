"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function loadImage(url, loaded = () => {}) {
  const image = new Image();
  image.crossOrigin = 'Anonymous';

  image.onload = function () {
    loaded(image);
  };

  image.src = url;
  return image;
}

function createImage(file, success = () => {}) {
  const reader = new FileReader();

  if (file.type.match(/image\/(jpeg|gif|png)/)) {
    reader.onload = function (e) {
      loadImage(e.target.result, success);
    };

    reader.readAsDataURL(file);
  } else {}
}

function DropFile(elem, events) {
  const dragover = function (e) {
    (events.dragover || function () {}).call(elem, e);
  };

  const drop = function (e) {
    e.preventDefault();
    const files = e.dataTransfer.files;

    for (let i = 0, len = files.length; i < len; i++) {
      createImage(files[i], events.drop || function () {});
    }
  };

  this.destory = function () {
    elem = this.elem;
    elem.removeEventListener('dragover', dragover);
    elem.removeEventListener('drop', drop);
  };

  this.init = function (elem, events) {
    this.elem = elem;
    this.events = events;
    elem.addEventListener('dragover', dragover, false);
    elem.addEventListener('drop', drop, false);
  };

  this.init(elem);
}

var _default = DropFile;
exports.default = _default;