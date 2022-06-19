"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fixOldTransitionType = fixOldTransitionType;
exports.getTransition = getTransition;
exports.isOverlayerTransition = isOverlayerTransition;
exports.transitionOptionToType = transitionOptionToType;
exports.transitionTypeToOption = transitionTypeToOption;
const transitionTypeMap = {
  none: 0,
  fade: 6000,
  diffusion: 6001,
  musselOpen: 6002,
  musselClose: 6003,
  sweepUp: 6004,
  sweepDown: 6005,
  sweepLeft: 6006,
  sweepRight: 6007,
  colorBlack: 6011,
  colorWhite: 6010,
  zoomOut: 6012,
  zoomIn: 6013
};
const oldTransitionTypeMap = {
  200: transitionTypeMap.fade,
  201: transitionTypeMap.diffusion,
  202: transitionTypeMap.musselOpen,
  203: transitionTypeMap.musselClose,
  212: transitionTypeMap.sweepUp,
  213: transitionTypeMap.sweepLeft,
  214: transitionTypeMap.sweepDown,
  215: transitionTypeMap.sweepRight,
  216: transitionTypeMap.zoomIn,
  217: transitionTypeMap.zoomOut,
  5000: transitionTypeMap.colorBlack,
  5002: transitionTypeMap.colorWhite
};
const transitionOptionMap = {
  0: 'none',
  6000: 'fade',
  6001: 'diffusion',
  6002: 'musselOpen',
  6003: 'musselClose',
  6004: 'sweepUp',
  6005: 'sweepDown',
  6006: 'sweepLeft',
  6007: 'sweepRight',
  6011: 'colorBlack',
  6010: 'colorWhite',
  6012: 'zoomOut',
  6013: 'zoomIn'
};

function isOverlayerTransition(transitionType) {
  return +transitionType >= transitionTypeMap.fade && +transitionType <= transitionTypeMap.sweepRight;
}

function fixOldTransitionType(transitionType) {
  const fixedType = oldTransitionTypeMap[transitionType];
  return fixedType || transitionType;
}

function transitionTypeToOption(transitionType) {
  return transitionOptionMap[transitionType] || 'none';
}

function transitionOptionToType(transitionOption) {
  return transitionTypeMap[transitionOption] || 0;
}

function getTransition(transitionOption) {
  const transitionType = transitionOptionToType(transitionOption);
  const isZoomType = [transitionTypeMap.zoomOut, transitionTypeMap.zoomIn].includes(transitionType);

  if (isOverlayerTransition(transitionType)) {
    return {
      type: transitionType,
      inOffset: 0,
      inDuration: 1000,
      outOffset: -1000,
      outDuration: 1000,
      elementInDelay: -1000,
      elementInDuration: 0,
      elementOutDelay: 0,
      elementOutDuration: 0,
      isOverlayer: true
    };
  } else if (transitionType) {
    return {
      type: transitionType,
      inOffset: 0,
      inDuration: isZoomType ? 300 : 500,
      outOffset: isZoomType ? -300 : -500,
      outDuration: isZoomType ? 300 : 500,
      elementInDelay: 0,
      elementInDuration: 0,
      elementOutDelay: 0,
      elementOutDuration: 0,
      isOverlayer: false
    };
  } else {
    return {
      type: 0,
      inOffset: 0,
      inDuration: 0,
      outOffset: 0,
      outDuration: 0,
      elementInDelay: 0,
      elementInDuration: 0,
      elementOutDelay: 0,
      elementOutDuration: 0,
      isOverlayer: false
    };
  }
}