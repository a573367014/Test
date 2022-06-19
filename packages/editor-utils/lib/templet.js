"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.checkEditorType = checkEditorType;
exports.default = void 0;
exports.getElementsByWalkTemplet = getElementsByWalkTemplet;
exports.isAnimationTemplet = isAnimationTemplet;
exports.isApngTemplet = isApngTemplet;
exports.isGifTemplet = isGifTemplet;
exports.isVideoTemplet = isVideoTemplet;
exports.walkTemplet = void 0;

var _get2 = _interopRequireDefault(require("lodash/get"));

var _element = require("./element");

const walkTemplet = _element.walkLayouts;
exports.walkTemplet = walkTemplet;

function getElementsByWalkTemplet(elements) {
  elements = [].concat(elements);
  const newElements = [];
  walkTemplet(el => {
    el.type && newElements.push(el);
  }, true, [{
    elements
  }]);
  return newElements;
}

function isVideoTemplet(layouts) {
  layouts = [].concat(layouts);
  let isVideo = false;
  walkTemplet(element => {
    if (element.type === 'video') {
      isVideo = true;
      return false;
    }
  }, true, layouts);
  return isVideo;
}

function isAnimationTemplet(layouts) {
  layouts = [].concat(layouts);
  let isAnimation = false;
  walkTemplet(element => {
    var _element$animations;

    if ((_element$animations = element.animations) !== null && _element$animations !== void 0 && _element$animations.length) {
      isAnimation = true;
      return false;
    }
  }, true, layouts);
  return isAnimation;
}

function isGifTemplet(layouts) {
  layouts = [].concat(layouts);
  let isGif = false;
  isGif = layouts.some(layout => {
    return (0, _get2.default)(layout, 'background.image.resourceType') === 'gif' || (0, _get2.default)(layout, 'background.image.resourceType') === 'apng';
  });
  !isGif && walkTemplet(element => {
    if ((0, _element.isGifElement)(element) || element.resourceType === 'apng') {
      isGif = true;
      return false;
    }
  }, true, layouts);
  return isGif;
}

function isApngTemplet(layouts) {
  layouts = [].concat(layouts);
  let isApng = false;
  isApng = layouts.some(layout => {
    return (0, _get2.default)(layout, 'background.image.resourceType') === 'apng';
  });
  !isApng && walkTemplet(element => {
    if ((0, _element.isApngElement)(element)) {
      isApng = true;
      return false;
    }
  }, true, layouts);
  return isApng;
}

function checkEditorType(type) {
  const odysseyTypes = ['web_page', 'h5_bargraph'];
  const videoTypes = ['movie', 'video'];
  const imageTypes = ['image', 'plog'];
  const clipperTypes = ['clipper'];
  const docTypes = ['doc'];

  if (odysseyTypes.includes(type)) {
    return 'odyssey';
  }

  if (videoTypes.includes(type)) {
    return 'video';
  }

  if (clipperTypes.includes(type)) {
    return 'clipper';
  }

  if (imageTypes.includes(type)) {
    return 'image';
  }

  if (docTypes.includes(type)) {
    return 'doc';
  }

  return 'design';
}

var _default = {
  walkTemplet,
  isVideoTemplet,
  isAnimationTemplet,
  isGifTemplet,
  getElementsByWalkTemplet,
  checkEditorType
};
exports.default = _default;