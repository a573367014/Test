"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DEFAULT_SHADOW = exports.DEFAULT_EFFECT = void 0;
const DEFAULT_EFFECT = {
  enable: true,
  excludeScale: [],
  offset: {
    enable: true,
    x: 0,
    y: 0
  },
  stroke: {
    enable: false,
    color: '#000000ff',
    width: 1,
    type: 'outer'
  },
  filling: {
    enable: false,
    type: 'color',
    color: '#000000ff'
  }
};
exports.DEFAULT_EFFECT = DEFAULT_EFFECT;
const DEFAULT_SHADOW = {
  base: {
    enable: true,
    type: 'base',
    color: '#00000080',
    offsetX: 6,
    offsetY: 6,
    blur: 4,
    opacity: 0.5
  },
  parallel: {
    enable: true,
    type: 'parallel',
    mask: '',
    offsetX: 6,
    offsetY: 6,
    opacity: 0.5,
    blurType: 'base',
    advancedBlur: {
      blurs: [{
        offset: 0,
        value: 4
      }, {
        offset: 1,
        value: 4
      }],
      opacities: [{
        offset: 0,
        value: 1
      }, {
        offset: 1,
        value: 1
      }]
    },
    color: '#00000080',
    scaleX: 1,
    scaleY: 1
  },
  skew: {
    enable: true,
    type: 'skew',
    mask: '',
    offsetX: 0,
    offsetY: 0,
    opacity: 0.5,
    blurType: 'base',
    advancedBlur: {
      blurs: [{
        offset: 0,
        value: 4
      }, {
        offset: 1,
        value: 4
      }],
      opacities: [{
        offset: 0,
        value: 1
      }, {
        offset: 1,
        value: 1
      }]
    },
    color: '#00000080',
    scaleX: 1,
    scaleY: 0.7,
    angle: 45,
    overlap: 0
  },
  contact: {
    enable: true,
    type: 'contact',
    mask: '',
    offsetX: 0,
    offsetY: 0,
    angle: -90,
    fieldAngle: 45,
    opacity: 0.8,
    blurType: 'advanced',
    advancedBlur: {
      blurs: [{
        offset: 0,
        value: 3
      }, {
        offset: 1,
        value: 0
      }],
      opacities: [{
        offset: 0,
        value: 1
      }, {
        offset: 0.1,
        value: 0
      }]
    },
    color: '#000000cc'
  },
  reflect: {
    enable: true,
    type: 'reflect',
    mask: '',
    offsetX: 0,
    offsetY: 0,
    opacity: 0.5,
    blurType: 'base',
    advancedBlur: {
      blurs: [{
        offset: 0,
        value: 4
      }, {
        offset: 1,
        value: 4
      }],
      opacities: [{
        offset: 0,
        value: 1
      }, {
        offset: 1,
        value: 1
      }]
    },
    direction: 'bottom'
  }
};
exports.DEFAULT_SHADOW = DEFAULT_SHADOW;