"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _point = _interopRequireDefault(require("./point"));

class Matrix {
  constructor(a = 1, b = 0, c = 0, d = 1, tx = 0, ty = 0) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    this.tx = tx;
    this.ty = ty;
    this.array = null;
  }

  fromArray(array) {
    this.a = array[0];
    this.b = array[1];
    this.c = array[3];
    this.d = array[4];
    this.tx = array[2];
    this.ty = array[5];
  }

  set(a, b, c, d, tx, ty) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    this.tx = tx;
    this.ty = ty;
    return this;
  }

  toArray(transpose, out) {
    if (!this.array) {
      this.array = new Float32Array(9);
    }

    const array = out || this.array;

    if (transpose) {
      array[0] = this.a;
      array[1] = this.b;
      array[2] = 0;
      array[3] = this.c;
      array[4] = this.d;
      array[5] = 0;
      array[6] = this.tx;
      array[7] = this.ty;
      array[8] = 1;
    } else {
      array[0] = this.a;
      array[1] = this.c;
      array[2] = this.tx;
      array[3] = this.b;
      array[4] = this.d;
      array[5] = this.ty;
      array[6] = 0;
      array[7] = 0;
      array[8] = 1;
    }

    return array;
  }

  toString() {
    return `matrix(${this.a},${this.b},${this.c},${this.d},${this.tx},${this.ty})`;
  }

  apply(pos, newPos) {
    newPos = newPos || new _point.default();
    const x = pos.x;
    const y = pos.y;
    newPos.x = this.a * x + this.c * y + this.tx;
    newPos.y = this.b * x + this.d * y + this.ty;
    return newPos;
  }

  applyInverse(pos, newPos) {
    newPos = newPos || new _point.default();
    const id = 1 / (this.a * this.d + this.c * -this.b);
    const x = pos.x;
    const y = pos.y;
    newPos.x = this.d * id * x + -this.c * id * y + (this.ty * this.c - this.tx * this.d) * id;
    newPos.y = this.a * id * y + -this.b * id * x + (-this.ty * this.a + this.tx * this.b) * id;
    return newPos;
  }

  translate(x, y) {
    this.tx += x;
    this.ty += y;
    return this;
  }

  scale(x, y) {
    this.a *= x;
    this.d *= y;
    this.c *= x;
    this.b *= y;
    this.tx *= x;
    this.ty *= y;
    return this;
  }

  rotate(angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const a1 = this.a;
    const c1 = this.c;
    const tx1 = this.tx;
    this.a = a1 * cos - this.b * sin;
    this.b = a1 * sin + this.b * cos;
    this.c = c1 * cos - this.d * sin;
    this.d = c1 * sin + this.d * cos;
    this.tx = tx1 * cos - this.ty * sin;
    this.ty = tx1 * sin + this.ty * cos;
    return this;
  }

  append(matrix) {
    const a1 = this.a;
    const b1 = this.b;
    const c1 = this.c;
    const d1 = this.d;
    this.a = matrix.a * a1 + matrix.b * c1;
    this.b = matrix.a * b1 + matrix.b * d1;
    this.c = matrix.c * a1 + matrix.d * c1;
    this.d = matrix.c * b1 + matrix.d * d1;
    this.tx = matrix.tx * a1 + matrix.ty * c1 + this.tx;
    this.ty = matrix.tx * b1 + matrix.ty * d1 + this.ty;
    return this;
  }

  setTransform(x, y, pivotX, pivotY, scaleX, scaleY, rotation, skewX, skewY) {
    const sr = Math.sin(rotation);
    const cr = Math.cos(rotation);
    const cy = Math.cos(skewY);
    const sy = Math.sin(skewY);
    const nsx = -Math.sin(skewX);
    const cx = Math.cos(skewX);
    const a = cr * scaleX;
    const b = sr * scaleX;
    const c = -sr * scaleY;
    const d = cr * scaleY;
    this.a = cy * a + sy * c;
    this.b = cy * b + sy * d;
    this.c = nsx * a + cx * c;
    this.d = nsx * b + cx * d;
    this.tx = x + (pivotX * a + pivotY * c);
    this.ty = y + (pivotX * b + pivotY * d);
    return this;
  }

  prepend(matrix) {
    const tx1 = this.tx;

    if (matrix.a !== 1 || matrix.b !== 0 || matrix.c !== 0 || matrix.d !== 1) {
      const a1 = this.a;
      const c1 = this.c;
      this.a = a1 * matrix.a + this.b * matrix.c;
      this.b = a1 * matrix.b + this.b * matrix.d;
      this.c = c1 * matrix.a + this.d * matrix.c;
      this.d = c1 * matrix.b + this.d * matrix.d;
    }

    this.tx = tx1 * matrix.a + this.ty * matrix.c + matrix.tx;
    this.ty = tx1 * matrix.b + this.ty * matrix.d + matrix.ty;
    return this;
  }

  decompose(transform) {
    const pi = Math.PI;
    const acos = Math.acos;
    const atan = Math.atan;
    const sqrt = Math.sqrt;
    const a = this.a;
    const b = this.b;
    const c = this.c;
    const d = this.d;
    let rotation = 0;
    const skew = {
      x: 0,
      y: 0
    };
    let scale = {
      x: 1,
      y: 1
    };
    const determ = a * d - b * c;

    if (a || b) {
      const r = sqrt(a * a + b * b);
      rotation = b > 0 ? acos(a / r) : -acos(a / r);
      skew.x = atan((a * c + b * d) / (r * r));
      scale = {
        x: r,
        y: determ / r
      };
    } else if (c || d) {
      const s = sqrt(c * c + d * d);
      rotation = pi * 0.5 - (d > 0 ? acos(-c / s) : -acos(c / s));
      scale = {
        x: determ / s,
        y: s
      };
      skew.y = atan((a * c + b * d) / (s * s));
    } else {
      scale = {
        x: 0,
        y: 0
      };
    }

    transform.rotation = rotation || 0;
    transform.scale.x = scale.x;
    transform.scale.y = scale.y;
    transform.skew.x = skew.x;
    transform.skew.y = skew.y;
    transform.position.x = this.tx;
    transform.position.y = this.ty;
  }

  invert() {
    const a1 = this.a;
    const b1 = this.b;
    const c1 = this.c;
    const d1 = this.d;
    const tx1 = this.tx;
    const n = a1 * d1 - b1 * c1;
    this.a = d1 / n;
    this.b = -b1 / n;
    this.c = -c1 / n;
    this.d = a1 / n;
    this.tx = (c1 * this.ty - d1 * tx1) / n;
    this.ty = -(a1 * this.ty - b1 * tx1) / n;
    return this;
  }

  identity() {
    this.a = 1;
    this.b = 0;
    this.c = 0;
    this.d = 1;
    this.tx = 0;
    this.ty = 0;
    return this;
  }

  clone() {
    const matrix = new Matrix();
    matrix.a = this.a;
    matrix.b = this.b;
    matrix.c = this.c;
    matrix.d = this.d;
    matrix.tx = this.tx;
    matrix.ty = this.ty;
    return matrix;
  }

  copy(matrix) {
    matrix.a = this.a;
    matrix.b = this.b;
    matrix.c = this.c;
    matrix.d = this.d;
    matrix.tx = this.tx;
    matrix.ty = this.ty;
    return matrix;
  }

  static get IDENTITY() {
    return new Matrix();
  }

  static get TEMP_MATRIX() {
    return new Matrix();
  }

}

exports.default = Matrix;