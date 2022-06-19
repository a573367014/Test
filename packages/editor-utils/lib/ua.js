"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isWebkit = exports.isMobile = exports.isIOS = exports.isIE = exports.isFox = exports.isFireFox = exports.isAndorid = exports.getBrowserZoom = exports.default = void 0;
const ua = navigator.userAgent;
const rIOS = /\(i[^;]+;( U;)? CPU.+Mac OS X/i;

const isIOS = () => {
  return rIOS.test(navigator.userAgent);
};

exports.isIOS = isIOS;

const isWebkit = () => {
  const reg = /webkit/i;
  return reg.test(ua);
};

exports.isWebkit = isWebkit;

const isFox = () => {
  const reg = /Firefox/i;
  return reg.test(ua);
};

exports.isFox = isFox;
const isFireFox = isFox;
exports.isFireFox = isFireFox;

const isIE = () => {
  return 'ActiveXObject' in window;
};

exports.isIE = isIE;

const isAndorid = () => {
  return ua.indexOf('Android') > -1 || ua.indexOf('Linux') > -1;
};

exports.isAndorid = isAndorid;

const isMobile = () => {
  return Object.prototype.hasOwnProperty.call(window, 'ontouchstart') || isAndorid() || isIOS();
};

exports.isMobile = isMobile;

const getBrowserZoom = () => {
  let ratio = 0;

  if (window.outerWidth !== undefined && window.innerWidth !== undefined) {
    ratio = Math.round(window.outerWidth / window.innerWidth * 100);
  }

  if (ratio !== 100) {
    if (ratio >= 95 && ratio <= 105) {
      ratio = 100;
    }
  }

  return ratio;
};

exports.getBrowserZoom = getBrowserZoom;
var _default = {
  isMobile,
  isWebkit,
  isFireFox,
  isFox,
  isIE,
  isAndorid,
  getBrowserZoom
};
exports.default = _default;