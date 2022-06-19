/**
 * utils/rect
 */

import { forEach, values, isArray } from 'lodash';
import tranformMathUtils from './transform-math';

// 向量对象
const Vector = function (x = 0, y = 0) {
    this.x = x;
    this.y = y;
};

Vector.prototype = {
    // 获取向量大小（即向量的模），即两点间距离
    getMagnitude() {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    },
    // 向量相减，得到边
    subtract(vector) {
        const v = new Vector();
        v.x = this.x - vector.x;
        v.y = this.y - vector.y;
        return v;
    },
    dotProduct(vector) {
        return this.x * vector.x + this.y * vector.y;
    },
    // 由两点生成边
    edge(vector) {
        return this.subtract(vector);
    },
    // 获取当前向量的法向量（垂直）
    perpendicular() {
        const v = new Vector();
        v.x = this.y;
        v.y = 0 - this.x;
        return v;
    },
    // 获取单位向量（即向量大小为 1，用于表示向量方向）
    // 一个非零向量除以它的模即可得到单位向量
    normalize() {
        const v = new Vector(0, 0);
        const m = this.getMagnitude();
        if (m !== 0) {
            v.x = this.x / m;
            v.y = this.y / m;
        }
        return v;
    },
    // 获取边缘法向量的单位向量，即投影轴
    normal() {
        const p = this.perpendicular();
        return p.normalize();
    },
};

// 封装的投影轴对象
// 用最大和最小值表示某一多边形在某一投影轴上的投影位置
const Projection = function (min, max) {
    this.min = min;
    this.max = max;
};
Projection.prototype = {
    // 判断两投影是否重叠
    overlaps(projection) {
        return this.max > projection.min && projection.max > this.min;
    },
};

export default {
    getBBox(rect, zoom) {
        const rectRotate = tranformMathUtils.intLimit(rect.rotate || 0, 360);
        const rectHeight = rect.height;
        const rectWidth = rect.width;
        const rotate =
            // 第二象限
            (rectRotate > 90 && rectRotate < 180) ||
            // 第四象限
            (rectRotate > 270 && rectRotate < 360)
                ? 180 - rectRotate
                : rectRotate;

        // size
        // http://jsfiddle.net/oscarpalacious/ZdQKg/
        const rad = tranformMathUtils.degToRad(rotate);
        const height = Math.abs(Math.sin(rad) * rectWidth + Math.cos(rad) * rectHeight);
        const width = Math.abs(Math.sin(rad) * rectHeight + Math.cos(rad) * rectWidth);

        // position
        const dotX = rect.left + rectWidth / 2;
        const dotY = rect.top + rectHeight / 2;
        const left = dotX - width / 2;
        const top = dotY - height / 2;

        // fix zoom
        zoom = zoom || 1;

        return {
            rotate: rotate,
            height: height * zoom,
            width: width * zoom,
            left: left * zoom,
            top: top * zoom,
            right: left * zoom + width * zoom,
            bottom: top * zoom + height * zoom,
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
                top: 0,
            },
        };

        // padding
        if (element.padding) {
            forEach(element.padding, (val, i) => {
                rect.padding[i] = zoom * val;
            });
        }

        // clip
        if (element.clip) {
            forEach(element.clip, (val, k) => {
                rect.clip[k] = zoom * val;
            });
        }

        // rotate
        rect.rotate = element.rotate || 0;

        // skew
        rect.skewX = element.skewX || 0;
        rect.skewY = element.skewY || 0;

        return rect;
    },

    getBBoxByElement(element, zoom) {
        const rect = this.getElementRect(element, zoom);

        // with padding
        // rect.width += rect.padding[1] + rect.padding[3];
        // rect.height += rect.padding[0] + rect.padding[2];

        return this.getBBox(rect);
    },

    getBBoxByBBoxs(bboxs) {
        let top = Infinity;
        let left = Infinity;
        let right = -Infinity;
        let bottom = -Infinity;

        bboxs.forEach((bbox) => {
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
            top: top,
        };
    },
    getBBoxByElements(elements, zoom) {
        const bboxs = elements.map((element) => {
            return this.getBBoxByElement(element, zoom);
        });

        return this.getBBoxByBBoxs(bboxs);
    },

    // 矩形相交检测
    // 更多碰撞检测知识点参见 https://github.com/JChehe/blog/issues/8
    getRectIntersection(rectA, rectB) {
        const self = this;
        // 获取矩形坐标点
        const pointsA = this.getRectPoints(rectA); // maskRect
        const pointsB = this.getRectPoints(rectB); // element object

        // 对不存在旋转和斜切的情形，直接通过轴对称包围盒判断以减少运算量
        // maskRect 矩形 rectA 不存在旋转与斜切，故不需判断
        if (
            (rectB.rotate === 0 || rectB.rotate === 360) &&
            rectB.skewX === 0 &&
            rectB.skewY === 0
        ) {
            // 轴对称包围盒判别法
            // 判断任意两个无旋转、斜切变换矩形的任意一边是否无间距，从而判断是否碰撞
            if (
                rectA.left < rectB.left + rectB.width &&
                rectA.left + rectA.width > rectB.left &&
                rectA.top < rectB.top + rectB.height &&
                rectA.height + rectA.top > rectB.top
            ) {
                return true;
            } else {
                return false;
            }
        }

        // 如果矩形有一定的旋转角度的话，就用分离轴定理进一步做判断
        // 分离轴定理：通过判断任意两个凸多边形在任意角度下的投影是否均存在重叠，来判断是否发生碰撞
        // 若在某一角度光源下，两物体的投影存在间隙则为不碰撞，否则为发生碰撞
        const polygonsCollide = (polygon1, polygon2) => {
            let projection1, projection2;
            // 根据多边形获取所有投影轴
            const axes = self.getAxes(polygon1).concat(self.getAxes(polygon2));
            // 遍历所有投影轴，获取多边形在每条投影轴上的投影
            for (const axis of axes) {
                projection1 = self.project(axis, polygon1);
                projection2 = self.project(axis, polygon2);
                // 判断投影轴上的投影是否存在重叠，若检测到存在间隙则立刻退出判断，消除不必要的运算。
                if (!projection1.overlaps(projection2)) return false;
            }
            return true;
        };
        return polygonsCollide(pointsA, pointsB);
    },

    // 获得投影长度
    project(axis, points) {
        const scalars = [];
        const v = new Vector();
        // cover to array
        points = values(points);
        points.forEach((point) => {
            v.x = point.x;
            v.y = point.y;
            scalars.push(v.dotProduct(axis));
        });
        return new Projection(Math.min.apply(Math, scalars), Math.max.apply(Math, scalars));
    },

    // 获取投影轴 - 矩形有四条交叉轴
    getAxes(points) {
        const v1 = new Vector();
        const v2 = new Vector();
        const axes = [];
        // cover to array
        points = values(points);
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

    // 输入变换前的单点或多点，返回其在画布上经变换后的位置
    getPointPosition(point, pivot, angle = 0, skewX = 0, skewY = 0, scaleX = 1, scaleY = 1) {
        let points = [].concat(point);
        const radian = (-angle / 180) * Math.PI;
        const pivotX = pivot.x;
        const pivotY = pivot.y;

        if (scaleX !== 1 || scaleY !== 1) {
            points = points.map((point) => {
                point = tranformMathUtils.getScalePoint(
                    { x: point.x, y: point.y },
                    { x: pivotX, y: pivotY },
                    scaleX,
                    scaleY,
                );

                return point;
            });
        }

        if (skewX !== 0 || skewY !== 0) {
            points = points.map((point) => {
                point = tranformMathUtils.getSkewPoint(
                    { x: point.x, y: point.y },
                    { x: pivotX, y: pivotY },
                    skewX,
                    skewY,
                );
                return point;
            });
        }

        points = points.map((point) => {
            const dx = point.x - pivotX;
            const dy = -(point.y - pivotY);
            point = tranformMathUtils.getRotationPoint({ x: dx, y: dy }, radian);

            return {
                x: pivotX + point.x,
                y: pivotY - point.y,
            };
        });

        if (isArray(point)) {
            return points;
        } else {
            return points[0];
        }
    },

    getRectPoints(rect, pivot) {
        const { left, top, width, height, rotate, skewX = 0, skewY = 0 } = rect;

        return this.newGetRectPoints(
            {
                left,
                top,
                width,
                height,
                rotate,
                skewX,
                skewY,
            },
            pivot,
        );
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
            scaleY = 1,
        } = rect;

        pivot = pivot || {
            x: left + width / 2,
            y: top + height / 2,
        };

        let points = [
            { x: left, y: top },
            { x: left + width, y: top },
            { x: left + width, y: top + height },
            { x: left, y: top + height },
        ];

        // use canvas coordinate system
        // with rotate angle
        points = this.getPointPosition(points, pivot, rotate, skewX, skewY, scaleX, scaleY);

        return { nw: points[0], ne: points[1], se: points[2], sw: points[3] };
    },

    getRectByPoints(points) {
        points = isArray(points) ? points : Object.values(points);
        const pointsX = points.map((point) => point.x);
        const pointsY = points.map((point) => point.y);
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
            bottom,
        };
    },

    getPointsByElement(element, zoom = 1) {
        const rect = this.getElementRect(element, zoom);
        return this.getRectPoints(rect);
    },

    // 判断点是否在矩形内
    pointInRect(x, y, rect) {
        // 将点作为特殊矩形处理
        const pointRect = {
            height: 1,
            width: 1,
            top: y,
            left: x,
            padding: [0, 0, 0, 0],
            rotate: 0,
            skewX: 0,
            skewY: 0,
            clip: { bottom: 0, right: 0, left: 0, top: 0 },
        };
        return this.getRectIntersection(pointRect, rect);
    },

    // 短边放大，cover，并居中
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
            bottom: top,
        };
    },

    // 长边放大，contain，并居中
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
            top,
        };
    },

    // 检测x、y轴单方向交叉情况
    checkRectCollide(rect1, rect2, axis) {
        const maxX = rect1.right >= rect2.right ? rect1.right : rect2.right;
        const maxY = rect1.bottom >= rect2.bottom ? rect1.bottom : rect2.bottom;
        const minX = rect1.left <= rect2.left ? rect1.left : rect2.left;
        const minY = rect1.top <= rect2.top ? rect1.top : rect2.top;

        // 满足 y 相交，x 轴不相交
        if (
            axis === 'y' &&
            maxX - minX <= rect1.width + rect2.width &&
            !(maxY - minY <= rect1.height + rect2.height)
        ) {
            return true;
        } else if (axis === 'y') {
            return false;
        }

        // 满足 x 相交，y 轴不相交
        if (
            axis === 'x' &&
            !(maxX - minX <= rect1.width + rect2.width) &&
            maxY - minY <= rect1.height + rect2.height
        ) {
            return true;
        } else {
            return false;
        }
    },
    // 矩形相交
    checkRectAllCollide(rect1, rect2) {
        const maxX = rect1.right >= rect2.right ? rect1.right : rect2.right;
        const maxY = rect1.bottom >= rect2.bottom ? rect1.bottom : rect2.bottom;
        const minX = rect1.left <= rect2.left ? rect1.left : rect2.left;
        const minY = rect1.top <= rect2.top ? rect1.top : rect2.top;

        // 满足 y 相交 x 也相交
        if (
            maxX - minX <= rect1.width + rect2.width &&
            maxY - minY <= rect1.height + rect2.height
        ) {
            return true;
        }
        return false;
    },
    // 点到矩形最近的距离
    getMinDistanceByPoint(point, rect) {
        // http://www.it1352.com/36901.html
        const box = {
            max: {
                x: rect.right,
                y: rect.bottom,
            },
            min: {
                x: rect.left,
                y: rect.top,
            },
        };

        const dx = Math.max(box.min.x - point.x, 0, point.x - box.max.x);
        const dy = Math.max(box.min.y - point.y, 0, point.y - box.max.y);
        return Math.sqrt(dx * dx + dy * dy);
    },
};
