"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = {
  clamp(val, lower = -Infinity, upper = Infinity) {
    return Math.max(lower, Math.min(val, upper));
  },

  getVectorRotator(a) {
    const [sinA, cosA] = [Math.sin(a / 180 * Math.PI), Math.cos(a / 180 * Math.PI)];
    return (x, y, invert = false) => invert ? [x * cosA - y * sinA, x * sinA + y * cosA] : [x * cosA + y * sinA, -x * sinA + y * cosA];
  },

  radToDeg(rad) {
    return rad * 180 / Math.PI;
  },

  degToRad(deg) {
    return deg * Math.PI / 180;
  },

  intLimit(int, circle) {
    return (int % circle + circle) % circle;
  },

  getAngle(x2, y2, x1, y1, degOffset) {
    const rad = Math.atan2(y2 - y1, x2 - x1);
    let deg = rad * 180 / Math.PI;
    deg -= degOffset;
    return this.intLimit(deg, 360);
  },

  getRadius(dx, dy) {
    return Math.sqrt(dx * dx + dy * dy);
  },

  getDxyByAngle(dx, dy, angle, scale = {
    x: 1,
    y: 1
  }) {
    const dis = this.getRadius(dx, dy);
    const theta = Math.atan2(dy, dx) - angle * Math.PI / 180;
    return {
      dx: scale.x * dis * Math.cos(theta),
      dy: scale.y * dis * Math.sin(theta)
    };
  },

  getRotationPoint(point, radian) {
    const x = point.x;
    const y = point.y;
    const sin = Math.sin(radian);
    const cos = Math.cos(radian);
    return {
      x: x * cos - y * sin,
      y: x * sin + y * cos
    };
  },

  getSkewPoint(point, base, skewX, skewY) {
    const dx = point.x - base.x;
    const dy = point.y - base.y;
    return {
      x: base.x + (dx + Math.tan(skewX) * dy),
      y: base.y + (dy + Math.tan(skewY) * dx)
    };
  },

  getScalePoint(point, base, scaleX, scaleY) {
    const x = scaleX < 0 ? base.x - point.x + base.x : point.x;
    const y = scaleY < 0 ? base.y - point.y + base.y : point.y;
    return {
      x: x * Math.abs(scaleX),
      y: y * Math.abs(scaleY)
    };
  }

};
exports.default = _default;