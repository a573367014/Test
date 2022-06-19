import Matrix from '@gaoding/editor-utils/matrix';
import Transform from '@gaoding/editor-utils/transform';

export function angle(angle) {
    angle = Math.round(angle) % 360;
    angle = angle >= 180 ? angle - 360 : angle;
    return angle + '°';
}

export function getResizeCursor(rotate = 0) {
    const sin = Math.abs(Math.sin((rotate / 180) * Math.PI));
    if (sin > 0.924) {
        return 'ns-resize';
    } else if (sin < 0.383) {
        return 'ew-resize';
    }
    const tan = Math.tan((rotate / 180) * Math.PI);
    return tan > 0 ? 'nwse-resize' : 'nesw-resize';
}

// 通过逆矩阵使得控制点始终保持水平，角度显示也保持水平
export function transformInvert(model) {
    const { transform, scaleX, scaleY } = model;
    let { a, b, c, d, tx, ty } = transform.localTransform;
    if (scaleX < 0) {
        a = -a;
        b = -b;
    }
    if (scaleY < 0) {
        c = -c;
        d = -d;
    }
    const matrix = new Matrix(a, b, c, d, tx, ty);
    matrix.invert();

    const invertTransform = new Transform();
    invertTransform.setFromMatrix(matrix);
    return invertTransform.toString();
}

export function getMetaKey(e) {
    const isWindows = /windows/i.test(navigator.userAgent);
    return isWindows ? e.key === 'Control' : e.metaKey;
}
