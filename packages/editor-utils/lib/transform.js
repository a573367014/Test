"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
exports.mergeTransform = mergeTransform;
exports.parseTransform = parseTransform;

var _cloneDeep2 = _interopRequireDefault(require("lodash/cloneDeep"));

var _pick2 = _interopRequireDefault(require("lodash/pick"));

var _matrix = _interopRequireDefault(require("./matrix"));

var _point = _interopRequireDefault(require("./point"));

var _observablePoint = _interopRequireDefault(require("./observable-point"));

var _rect = _interopRequireDefault(require("./rect"));

var _transformMath = _interopRequireDefault(require("./transform-math"));

function Transform() {
  this._worldID = 0;
  this.localTransform = new _matrix.default();
  this.position = new _point.default(0.0);
  this.scale = new _point.default(1, 1);
  this.skew = new _observablePoint.default(this.updateSkew.bind(this), 0, 0);
  this.pivot = new _point.default(0.0);
  this._rotation = 0;
  this._sr = Math.sin(0);
  this._cr = Math.cos(0);
  this._cy = Math.cos(0);
  this._sy = Math.sin(0);
  this._nsx = Math.sin(0);
  this._cx = Math.cos(0);
}

Transform.prototype.updateSkew = function () {
  this._nsx = Math.tan(this.skew.x);
  this._sy = Math.tan(this.skew.y);
};

Transform.prototype.updateLocalTransform = function () {
  const lt = this.localTransform;
  const a = this._cr * this.scale.x;
  const b = this._sr * this.scale.x;
  const c = -this._sr * this.scale.y;
  const d = this._cr * this.scale.y;
  lt.a = this._cy * a + this._sy * c;
  lt.b = this._cy * b + this._sy * d;
  lt.c = this._nsx * a + this._cx * c;
  lt.d = this._nsx * b + this._cx * d;
  lt.tx = this.position.x;
  lt.ty = this.position.y;
};

Transform.prototype.updateTransform = function () {};

Transform.prototype.setFromMatrix = function (matrix) {
  matrix.decompose(this);
};

Object.defineProperties(Transform.prototype, {
  rotation: {
    get() {
      return this._rotation;
    },

    set(value) {
      this._rotation = value;
      this._sr = Math.sin(value);
      this._cr = Math.cos(value);
    }

  },
  rotate: {
    get() {
      return _transformMath.default.radToDeg(this.rotation);
    },

    set(deg) {
      this.rotation = _transformMath.default.degToRad(deg);
    }

  }
});

Transform.prototype.toJSON = function () {
  this.updateLocalTransform();
  return (0, _pick2.default)(this.localTransform, ['a', 'b', 'c', 'd', 'tx', 'ty']);
};

Transform.prototype.toArray = function () {
  this.updateLocalTransform();
  const localTransform = this.localTransform;
  return [localTransform.a, localTransform.b, localTransform.c, localTransform.d, localTransform.tx, localTransform.ty];
};

Transform.prototype.toString = function () {
  const rZeroEnd = /\.?0+$/;
  let arr = this.toArray();
  arr = arr.map(n => {
    n = n.toFixed(20);
    return n.replace(rZeroEnd, '');
  });
  return 'matrix(' + arr.join(', ') + ')';
};

function parseTransform(matrixData) {
  let transform = new Transform();
  matrixData = matrixData || {
    a: 1,
    b: 0,
    c: 0,
    d: 1,
    tx: 0,
    ty: 0
  };

  if (matrixData.localTransform) {
    transform = (0, _cloneDeep2.default)(matrixData);
  } else {
    const matrix = new _matrix.default();
    matrix.copy.call(matrixData, matrix);
    matrix.decompose(transform);
  }

  return transform;
}

function mergeTransform(parent, element) {
  const result = {
    left: element.left,
    top: element.top,
    transform: element.transform
  };
  const center = {
    x: element.left + element.width / 2,
    y: element.top + element.height / 2
  };
  const parentTransform = parent.transform.toArray ? parent.transform : parseTransform(parent.transform);

  const point = _rect.default.getPointPosition(center, {
    x: parent.width / 2,
    y: parent.height / 2
  }, _transformMath.default.radToDeg(parentTransform.rotation));

  const dx = point.x - center.x;
  const dy = point.y - center.y;
  result.left = element.left + parent.left + dx;
  result.top = element.top + parent.top + dy;
  const cloneTransform = parseTransform(element.transform);
  cloneTransform.rotation += parentTransform.rotation;
  result.transform = cloneTransform;
  return result;
}

var _default = Transform;
exports.default = _default;