"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getNearestIntersection = exports.getCropIntersection = void 0;

var _sat = _interopRequireDefault(require("sat"));

var _rect = _interopRequireDefault(require("./rect"));

var _transformMath = _interopRequireDefault(require("./transform-math"));

const V = _sat.default.Vector;
const B = _sat.default.Box;
const P = _sat.default.Polygon;

const rotatePolygon = (polygon, angle) => {
  const center = polygon.center;
  polygon.points = polygon.points.map(point => _rect.default.getPointPosition(point, center, _transformMath.default.radToDeg(angle)));
  return polygon;
};

const functionUtils = {
  MIN: -100000,
  MAX: 100000,

  getSlope(pointA, pointB) {
    return (pointB.y - pointA.y) / (pointB.x - pointA.x);
  },

  getPointsByPointOblique(point, k) {
    const getPoint = x => ({
      x,
      y: point.y - k * point.x + k * x
    });

    const pointA = getPoint(functionUtils.MIN);
    const pointB = getPoint(functionUtils.MAX);
    return [pointA, pointB];
  },

  getIntersection(pointA, pointB, pointC, pointD) {
    const z1 = pointA.x - pointB.x;
    const z2 = pointC.x - pointD.x;
    const z3 = pointA.y - pointB.y;
    const z4 = pointC.y - pointD.y;
    const dist = z1 * z4 - z3 * z2;

    if (dist === 0) {
      return null;
    }

    const tempA = pointA.x * pointB.y - pointA.y * pointB.x;
    const tempB = pointC.x * pointD.y - pointC.y * pointD.x;
    const x = (tempA * z2 - z1 * tempB) / dist;
    const y = (tempA * z4 - z3 * tempB) / dist;

    if (x < Math.min(pointA.x, pointB.x) || x > Math.max(pointA.x, pointB.x) || x < Math.min(pointC.x, pointD.x) || x > Math.max(pointC.x, pointD.x)) {
      return null;
    }

    if (y < Math.min(pointA.y, pointB.y) || y > Math.max(pointA.y, pointB.y) || y < Math.min(pointC.y, pointD.y) || y > Math.max(pointC.y, pointD.y)) {
      return null;
    }

    return {
      x,
      y
    };
  }

};

const getEdgesOfRect = rect => {
  const orders = [[0, 1], [1, 2], [2, 3], [3, 0]];
  return orders.map(dirs => {
    return dirs.map(dir => rect.points[dir]);
  });
};

const getNearestIntersection = (rectA, rectB) => {
  const rectACenter = rectA.center;
  const rectBCenter = rectB.center;
  const slope = functionUtils.getSlope(rectACenter, rectBCenter);
  const linesThroughPoints = rectB.points.map(point => {
    return functionUtils.getPointsByPointOblique(point, slope);
  });
  const rectBEdges = getEdgesOfRect(rectA);
  const intersections = linesThroughPoints.map(lineEnds => {
    return rectBEdges.map(edge => {
      return functionUtils.getIntersection(...lineEnds, ...edge);
    }).filter(val => val);
  });
  const OFFSET = 0.1;
  const polygonA = new P(new V(), rectA.points);
  intersections.forEach((points, index) => {
    const processes = [point => point, point => ({
      x: point.x - rectB.width,
      y: point.y
    }), point => ({
      x: point.x - rectB.width,
      y: point.y - rectB.height
    }), point => ({
      x: point.x,
      y: point.y - rectB.height
    })];
    const offsetX = [0, 3].includes(index) ? OFFSET : -OFFSET;
    const offsetY = [0, 1].includes(index) ? OFFSET : -OFFSET;
    points.forEach(point => {
      const leftTopPoint = processes[index](point);
      const polygonB = new B(new V(leftTopPoint.x + offsetX, leftTopPoint.y + offsetY), rectB.width - OFFSET, rectB.height - OFFSET).toPolygon();
      const response = new _sat.default.Response();

      _sat.default.testPolygonPolygon(polygonA, polygonB, response);

      point.collided = response.b && response.bInA;
      point.x = leftTopPoint.x;
      point.y = leftTopPoint.y;
    });
  });
  const validIntersections = intersections.flat().filter(point => point.collided);
  const dists = validIntersections.map(point => {
    const centerX = point.x + rectB.width / 2;
    const centerY = point.y + rectB.height / 2;
    const dx = centerX - rectB.center.x;
    const dy = centerY - rectB.center.y;
    return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
  });
  const minDist = Math.min(...dists);
  const minDistIndex = dists.indexOf(minDist);
  const intersection = validIntersections[minDistIndex];
  return intersection || {
    x: rectA.center.x - rectB.width / 2,
    y: rectA.center.y - rectB.height / 2
  };
};

exports.getNearestIntersection = getNearestIntersection;

const getRect = ({
  position,
  width,
  height,
  rotation
}) => {
  const rect = {
    width,
    height,
    center: {
      x: width / 2 + position.x,
      y: height / 2 + position.y
    },
    points: [{
      x: 0,
      y: 0
    }, {
      x: width,
      y: 0
    }, {
      x: width,
      y: height
    }, {
      x: 0,
      y: height
    }].map(point => ({
      x: point.x + position.x,
      y: point.y + position.y
    }))
  };
  rotatePolygon(rect, rotation);
  return rect;
};

const getCropIntersection = model => {
  const {
    imageTransform,
    $imageWidth,
    $imageHeight,
    $imageLeft,
    $imageTop
  } = model;
  const imageRect = getRect({
    position: {
      x: 0,
      y: 0
    },
    width: $imageWidth,
    height: $imageHeight,
    rotation: imageTransform.rotation
  });
  const cropRect = getRect({
    position: {
      x: -$imageLeft,
      y: -$imageTop
    },
    width: model.width,
    height: model.height,
    rotation: 0
  });
  const intersection = getNearestIntersection(imageRect, cropRect);
  return {
    x: -intersection.x,
    y: -intersection.y
  };
};

exports.getCropIntersection = getCropIntersection;