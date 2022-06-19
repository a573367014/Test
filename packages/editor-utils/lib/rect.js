"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _isArray2 = _interopRequireDefault(require("lodash/isArray"));

var _values2 = _interopRequireDefault(require("lodash/values"));

var _forEach2 = _interopRequireDefault(require("lodash/forEach"));

var _transformMath = _interopRequireDefault(require("./transform-math"));

const Vector = function (x = 0, y = 0) {
  this.x = x;
  this.y = y;
};

Vector.prototype = {
  getMagnitude() {
    return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
  },

  subtract(vector) {
    const v = new Vector();
    v.x = this.x - vector.x;
    v.y = this.y - vector.y;
    return v;
  },

  dotProduct(vector) {
    return this.x * vector.x + this.y * vector.y;
  },

  edge(vector) {
    return this.subtract(vector);
  },

  perpendicular() {
    const v = new Vector();
    v.x = this.y;
    v.y = 0 - this.x;
    return v;
  },

  normalize() {
    const v = new Vector(0, 0);
    const m = this.getMagnitude();

    if (m !== 0) {
      v.x = this.x / m;
      v.y = this.y / m;
    }

    return v;
  },

  normal() {
    const p = this.perpendicular();
    return p.normalize();
  }

};

const Projection = function (min, max) {
  this.min = min;
  this.max = max;
};

Projection.prototype = {
  overlaps(projection) {
    return this.max > projection.min && projection.max > this.min;
  }

};
var _default = {
  getBBox(rect, zoom) {
    const rectRotate = _transformMath.default.intLimit(rect.rotate || 0, 360);

    const rectHeight = rect.height;
    const rectWidth = rect.width;
    const rotate = rectRotate > 90 && rectRotate < 180 || rectRotate > 270 && rectRotate < 360 ? 180 - rectRotate : rectRotate;

    const rad = _transformMath.default.degToRad(rotate);

    const height = Math.abs(Math.sin(rad) * rectWidth + Math.cos(rad) * rectHeight);
    const width = Math.abs(Math.sin(rad) * rectHeight + Math.cos(rad) * rectWidth);
    const dotX = rect.left + rectWidth / 2;
    const dotY = rect.top + rectHeight / 2;
    const left = dotX - width / 2;
    const top = dotY - height / 2;
    zoom = zoom || 1;
    return {
      rotate: rotate,
      height: height * zoom,
      width: width * zoom,
      left: left * zoom,
      top: top * zoom,
      right: left * zoom + width * zoom,
      bottom: top * zoom + height * zoom
    };
  },

  getElementRect(element, zoom) {
    if (!zoom) {
      zoom = 1;
    }

    const rect = {
      padding: [0, 0, 0, 0],
      height: Math.max(zoom * element.height, 1),
      width: Math.max(zoom * element.width, 1),
      left: zoom * element.left,
      top: zoom * element.top,
      clip: {
        bottom: 0,
        right: 0,
        left: 0,
        top: 0
      }
    };

    if (element.padding) {
      (0, _forEach2.default)(element.padding, (val, i) => {
        rect.padding[i] = zoom * val;
      });
    }

    if (element.clip) {
      (0, _forEach2.default)(element.clip, (val, k) => {
        rect.clip[k] = zoom * val;
      });
    }

    rect.rotate = element.rotate || 0;
    rect.skewX = element.skewX || 0;
    rect.skewY = element.skewY || 0;
    return rect;
  },

  getBBoxByElement(element, zoom) {
    const rect = this.getElementRect(element, zoom);
    return this.getBBox(rect);
  },

  getBBoxByBBoxs(bboxs) {
    let top = Infinity;
    let left = Infinity;
    let right = -Infinity;
    let bottom = -Infinity;
    bboxs.forEach(bbox => {
      if (bbox.top < top) {
        top = bbox.top;
      }

      if (bbox.left < left) {
        left = bbox.left;
      }

      if (bbox.left + bbox.width > right) {
        right = bbox.left + bbox.width;
      }

      if (bbox.top + bbox.height > bottom) {
        bottom = bbox.top + bbox.height;
      }
    });
    return {
      rotate: 0,
      height: bottom - top,
      width: right - left,
      left: left,
      top: top
    };
  },

  getBBoxByElements(elements, zoom) {
    const bboxs = elements.map(element => {
      return this.getBBoxByElement(element, zoom);
    });
    return this.getBBoxByBBoxs(bboxs);
  },

  getRectIntersection(rectA, rectB) {
    const self = this;
    const pointsA = this.getRectPoints(rectA);
    const pointsB = this.getRectPoints(rectB);

    if ((rectB.rotate === 0 || rectB.rotate === 360) && rectB.skewX === 0 && rectB.skewY === 0) {
      if (rectA.left < rectB.left + rectB.width && rectA.left + rectA.width > rectB.left && rectA.top < rectB.top + rectB.height && rectA.height + rectA.top > rectB.top) {
        return true;
      } else {
        return false;
      }
    }

    const polygonsCollide = (polygon1, polygon2) => {
      let projection1, projection2;
      const axes = self.getAxes(polygon1).concat(self.getAxes(polygon2));

      for (const axis of axes) {
        projection1 = self.project(axis, polygon1);
        projection2 = self.project(axis, polygon2);
        if (!projection1.overlaps(projection2)) return false;
      }

      return true;
    };

    return polygonsCollide(pointsA, pointsB);
  },

  project(axis, points) {
    const scalars = [];
    const v = new Vector();
    points = (0, _values2.default)(points);
    points.forEach(point => {
      v.x = point.x;
      v.y = point.y;
      scalars.push(v.dotProduct(axis));
    });
    return new Projection(Math.min.apply(Math, scalars), Math.max.apply(Math, scalars));
  },

  getAxes(points) {
    const v1 = new Vector();
    const v2 = new Vector();
    const axes = [];
    points = (0, _values2.default)(points);

    for (let i = 0, len = points.length - 1; i < len; i++) {
      v1.x = points[i].x;
      v1.y = points[i].y;
      v2.x = points[i + 1].x;
      v2.y = points[i + 1].y;
      axes.push(v1.edge(v2).normal());
    }

    v1.x = points[points.length - 1].x;
    v1.y = points[points.length - 1].y;
    v2.x = points[0].x;
    v2.y = points[0].y;
    axes.push(v1.edge(v2).normal());
    return axes;
  },

  getPointPosition(point, pivot, angle = 0, skewX = 0, skewY = 0, scaleX = 1, scaleY = 1) {
    let points = [].concat(point);
    const radian = -angle / 180 * Math.PI;
    const pivotX = pivot.x;
    const pivotY = pivot.y;

    if (scaleX !== 1 || scaleY !== 1) {
      points = points.map(point => {
        point = _transformMath.default.getScalePoint({
          x: point.x,
          y: point.y
        }, {
          x: pivotX,
          y: pivotY
        }, scaleX, scaleY);
        return point;
      });
    }

    if (skewX !== 0 || skewY !== 0) {
      points = points.map(point => {
        point = _transformMath.default.getSkewPoint({
          x: point.x,
          y: point.y
        }, {
          x: pivotX,
          y: pivotY
        }, skewX, skewY);
        return point;
      });
    }

    points = points.map(point => {
      const dx = point.x - pivotX;
      const dy = -(point.y - pivotY);
      point = _transformMath.default.getRotationPoint({
        x: dx,
        y: dy
      }, radian);
      return {
        x: pivotX + point.x,
        y: pivotY - point.y
      };
    });

    if ((0, _isArray2.default)(point)) {
      return points;
    } else {
      return points[0];
    }
  },

  getRectPoints(rect, pivot) {
    const {
      left,
      top,
      width,
      height,
      rotate,
      skewX = 0,
      skewY = 0
    } = rect;
    return this.newGetRectPoints({
      left,
      top,
      width,
      height,
      rotate,
      skewX,
      skewY
    }, pivot);
  },

  newGetRectPoints(rect, pivot) {
    const {
      left,
      top,
      width,
      height,
      rotate,
      skewX = 0,
      skewY = 0,
      scaleX = 1,
      scaleY = 1
    } = rect;
    pivot = pivot || {
      x: left + width / 2,
      y: top + height / 2
    };
    let points = [{
      x: left,
      y: top
    }, {
      x: left + width,
      y: top
    }, {
      x: left + width,
      y: top + height
    }, {
      x: left,
      y: top + height
    }];
    points = this.getPointPosition(points, pivot, rotate, skewX, skewY, scaleX, scaleY);
    return {
      nw: points[0],
      ne: points[1],
      se: points[2],
      sw: points[3]
    };
  },

  getRectByPoints(points) {
    points = (0, _isArray2.default)(points) ? points : Object.values(points);
    const pointsX = points.map(point => point.x);
    const pointsY = points.map(point => point.y);
    const left = Math.min(...pointsX);
    const top = Math.min(...pointsY);
    const right = Math.max(...pointsX);
    const bottom = Math.max(...pointsY);
    return {
      width: right - left,
      height: bottom - top,
      left,
      top,
      right,
      bottom
    };
  },

  getPointsByElement(element, zoom = 1) {
    const rect = this.getElementRect(element, zoom);
    return this.getRectPoints(rect);
  },

  pointInRect(x, y, rect) {
    const pointRect = {
      height: 1,
      width: 1,
      top: y,
      left: x,
      padding: [0, 0, 0, 0],
      rotate: 0,
      skewX: 0,
      skewY: 0,
      clip: {
        bottom: 0,
        right: 0,
        left: 0,
        top: 0
      }
    };
    return this.getRectIntersection(pointRect, rect);
  },

  getRectCover(rectA, rectB) {
    const ratio = Math.max(rectB.width / rectA.width, rectB.height / rectA.height);
    const width = rectA.width * ratio;
    const height = rectA.height * ratio;
    const left = (Math.round(rectB.width) - Math.round(width)) / 2;
    const top = (Math.round(rectB.height) - Math.round(height)) / 2;
    return {
      width,
      height,
      left,
      top,
      right: left,
      bottom: top
    };
  },

  getRectContain(rectA, rectB) {
    const ratio = Math.min(rectB.width / rectA.width, rectB.height / rectA.height);
    const width = rectA.width * ratio;
    const height = rectA.height * ratio;
    const left = (Math.round(rectB.width) - Math.round(width)) / 2;
    const top = (Math.round(rectB.height) - Math.round(height)) / 2;
    return {
      width,
      height,
      left,
      top
    };
  },

  checkRectCollide(rect1, rect2, axis) {
    const maxX = rect1.right >= rect2.right ? rect1.right : rect2.right;
    const maxY = rect1.bottom >= rect2.bottom ? rect1.bottom : rect2.bottom;
    const minX = rect1.left <= rect2.left ? rect1.left : rect2.left;
    const minY = rect1.top <= rect2.top ? rect1.top : rect2.top;

    if (axis === 'y' && maxX - minX <= rect1.width + rect2.width && !(maxY - minY <= rect1.height + rect2.height)) {
      return true;
    } else if (axis === 'y') {
      return false;
    }

    if (axis === 'x' && !(maxX - minX <= rect1.width + rect2.width) && maxY - minY <= rect1.height + rect2.height) {
      return true;
    } else {
      return false;
    }
  },

  checkRectAllCollide(rect1, rect2) {
    const maxX = rect1.right >= rect2.right ? rect1.right : rect2.right;
    const maxY = rect1.bottom >= rect2.bottom ? rect1.bottom : rect2.bottom;
    const minX = rect1.left <= rect2.left ? rect1.left : rect2.left;
    const minY = rect1.top <= rect2.top ? rect1.top : rect2.top;

    if (maxX - minX <= rect1.width + rect2.width && maxY - minY <= rect1.height + rect2.height) {
      return true;
    }

    return false;
  },

  getMinDistanceByPoint(point, rect) {
    const box = {
      max: {
        x: rect.right,
        y: rect.bottom
      },
      min: {
        x: rect.left,
        y: rect.top
      }
    };
    const dx = Math.max(box.min.x - point.x, 0, point.x - box.max.x);
    const dy = Math.max(box.min.y - point.y, 0, point.y - box.max.y);
    return Math.sqrt(dx * dx + dy * dy);
  }

};
exports.default = _default;