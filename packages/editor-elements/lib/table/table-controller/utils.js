import Matrix from "@gaoding/editor-utils/lib/matrix";
import Transform from "@gaoding/editor-utils/lib/transform";
export function angle(angle) {
  angle = Math.round(angle) % 360;
  angle = angle >= 180 ? angle - 360 : angle;
  return angle + '°';
}
export function getResizeCursor(rotate) {
  if (rotate === void 0) {
    rotate = 0;
  }

  var sin = Math.abs(Math.sin(rotate / 180 * Math.PI));

  if (sin > 0.924) {
    return 'ns-resize';
  } else if (sin < 0.383) {
    return 'ew-resize';
  }

  var tan = Math.tan(rotate / 180 * Math.PI);
  return tan > 0 ? 'nwse-resize' : 'nesw-resize';
} // 通过逆矩阵使得控制点始终保持水平，角度显示也保持水平

export function transformInvert(model) {
  var transform = model.transform,
      scaleX = model.scaleX,
      scaleY = model.scaleY;
  var _transform$localTrans = transform.localTransform,
      a = _transform$localTrans.a,
      b = _transform$localTrans.b,
      c = _transform$localTrans.c,
      d = _transform$localTrans.d,
      tx = _transform$localTrans.tx,
      ty = _transform$localTrans.ty;

  if (scaleX < 0) {
    a = -a;
    b = -b;
  }

  if (scaleY < 0) {
    c = -c;
    d = -d;
  }

  var matrix = new Matrix(a, b, c, d, tx, ty);
  matrix.invert();
  var invertTransform = new Transform();
  invertTransform.setFromMatrix(matrix);
  return invertTransform.toString();
}
export function getMetaKey(e) {
  var isWindows = /windows/i.test(navigator.userAgent);
  return isWindows ? e.key === 'Control' : e.metaKey;
}