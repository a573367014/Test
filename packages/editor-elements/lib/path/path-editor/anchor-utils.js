export function toSharp(anchor) {
  anchor.setHandleIn(null);
  anchor.setHandleOut(null);
}
/**
 * 从尖角换其他类型锚点
 * 默认以相邻顶点之间角度、距离为参考，切线角度相等、长度为距离1/2。(参考sketch)
 */

export function sharpToCurve(anchor, anchors, i) {
  var p0 = anchors[i - 1 < 0 ? anchors.length - 1 : i - 1].point.position;
  var p1 = anchor.point.position;
  var p2 = anchors[(i + 1) % anchors.length].point.position;
  var angle = p2.subtract(p0).angle + 180;
  var len = p2.getDistance(p0) / 4;
  var p02p1 = p0.subtract(p1);
  var h1 = p02p1.normalize(len).rotate(angle - p02p1.angle, null);
  var h2 = h1.rotate(180, null);
  anchor.setHandleIn(h1);
  anchor.setHandleOut(h2);
}
/**
 * 从其他锚点类型转成完全对称
 */

export function toFullMirror(anchor) {
  formatNoMirror(anchor, function (refPoint, point) {
    return refPoint.subtract(point).rotate(180, null);
  });
}
/**
 * 从其他锚点类型转成角度对称
 */

export function toAngleMirror(anchor) {
  formatNoMirror(anchor, function (refPoint, point) {
    var followHandle = refPoint.equals(anchor.handleOut.position) ? anchor.handleIn : anchor.handleOut;
    if (followHandle.position.isZero()) return followHandle.position;
    return refPoint.subtract(point).normalize(followHandle.position.getDistance(point)).rotate(180, null);
  });
}
/**
 * 从无限制锚点类型转换成其他锚点类型的通用方法
 * @param anchor 锚点
 * @param getUpdatePointFunc 计算handleIn和handleOut的方法
 */

function formatNoMirror(anchor, getUpdatePointFunc) {
  var p1 = anchor.point.position;
  var handles = [anchor.handleIn, anchor.handleOut];
  if (handles[0].position.getDistance(p1) < handles[1].position.getDistance(p1)) handles.reverse();
  if (handles[0].position.isZero()) handles.reverse();
  var updatedPoint = getUpdatePointFunc(handles[0].position, p1);
  handles[0] === anchor.handleOut ? anchor.setHandleIn(updatedPoint) : anchor.setHandleOut(updatedPoint);
}