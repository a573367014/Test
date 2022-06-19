/**
 * PIXI.Transform
 *
 * @follow PIXI V4.x
 */

import { pick, cloneDeep } from 'lodash';

import Matrix from './matrix';
import Point from './point';
import ObservablePoint from './observable-point';
import rectUtils from './rect';
import transformMath from './transform-math';

// Transform
function Transform() {
    this._worldID = 0;
    this.localTransform = new Matrix();

    this.position = new Point(0.0);

    this.scale = new Point(1, 1);

    this.skew = new ObservablePoint(this.updateSkew.bind(this), 0, 0);

    this.pivot = new Point(0.0);

    this._rotation = 0;

    this._sr = Math.sin(0);
    this._cr = Math.cos(0);
    this._cy = Math.cos(0); // skewY);
    this._sy = Math.sin(0); // skewY);
    this._nsx = Math.sin(0); // skewX);
    this._cx = Math.cos(0); // skewX);
}

// https://github.com/pixijs/pixi.js/issues/4417#issuecomment-343356983
Transform.prototype.updateSkew = function () {
    // PIXI Skew
    /*
    this._cy = Math.cos(this.skew.y);
    this._sy = Math.sin(this.skew.y);
    this._nsx = Math.sin(this.skew.x);
    this._cx = Math.cos(this.skew.x);
    */

    // CSS Skew
    this._nsx = Math.tan(this.skew.x);
    this._sy = Math.tan(this.skew.y);
};

/**
 * Updates only local matrix
 */
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

/**
 * Updates the values of the object and applies the parent's transform.
 * @param parentTransform {PIXI.Transform} The transform of the parent of this object
 */
Transform.prototype.updateTransform = function () {};

/**
 * Decomposes a matrix and sets the transforms properties based on it.
 */
Transform.prototype.setFromMatrix = function (matrix) {
    matrix.decompose(this);
};

Object.defineProperties(Transform.prototype, {
    /**
     * The rotation of the object in radians.
     *
     * @member {number}
     */
    rotation: {
        get() {
            return this._rotation;
        },
        set(value) {
            this._rotation = value;
            this._sr = Math.sin(value);
            this._cr = Math.cos(value);
        },
    },

    rotate: {
        get() {
            return transformMath.radToDeg(this.rotation);
        },
        set(deg) {
            this.rotation = transformMath.degToRad(deg);
        },
    },
});

// Transform toJSON shim
Transform.prototype.toJSON = function () {
    this.updateLocalTransform();

    return pick(this.localTransform, ['a', 'b', 'c', 'd', 'tx', 'ty']);
};

// Transform toArray shim
Transform.prototype.toArray = function () {
    this.updateLocalTransform();

    const localTransform = this.localTransform;

    return [
        localTransform.a,
        localTransform.b,
        localTransform.c,
        localTransform.d,
        localTransform.tx,
        localTransform.ty,
    ];
};

// Transform toString shim
Transform.prototype.toString = function () {
    const rZeroEnd = /\.?0+$/;
    let arr = this.toArray();

    // 小数位数过长时 js 会自动将数字转换为科学计数法
    // 但是 Phantom css 解析不支持
    arr = arr.map((n) => {
        n = n.toFixed(20);

        return n.replace(rZeroEnd, '');
    });

    return 'matrix(' + arr.join(', ') + ')';
};

export function parseTransform(matrixData) {
    let transform = new Transform();
    matrixData = matrixData || { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };

    // matrixData 可能为 Transform 实例
    if (matrixData.localTransform) {
        transform = cloneDeep(matrixData);
    } else {
        const matrix = new Matrix();
        matrix.copy.call(matrixData, matrix);
        matrix.decompose(transform);
    }

    return transform;
}

export function mergeTransform(parent, element) {
    // default data
    const result = {
        left: element.left,
        top: element.top,
        transform: element.transform,
    };

    const center = {
        x: element.left + element.width / 2,
        y: element.top + element.height / 2,
    };

    const parentTransform = parent.transform.toArray
        ? parent.transform
        : parseTransform(parent.transform);
    const point = rectUtils.getPointPosition(
        center,
        {
            x: parent.width / 2,
            y: parent.height / 2,
        },
        transformMath.radToDeg(parentTransform.rotation),
    );

    const dx = point.x - center.x;
    const dy = point.y - center.y;

    result.left = element.left + parent.left + dx;
    result.top = element.top + parent.top + dy;

    const cloneTransform = parseTransform(element.transform);
    cloneTransform.rotation += parentTransform.rotation;
    result.transform = cloneTransform;

    return result;
}

export default Transform;
