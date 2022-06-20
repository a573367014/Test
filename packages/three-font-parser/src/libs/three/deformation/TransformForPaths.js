import { QuadraticBezierCurve } from '../extras/curves';
import { Vector2 } from '../math/Vector2';

export class TransformForPaths {
    breakLine(paths, boundingBox, isVertical = false) {
        const { min, max } = boundingBox;
        const centerX = 0.5 * (min.x + max.x);
        const centerY = 0.5 * (min.y + max.y);
        for (let i = 0; i < paths.length; i++) {
            const { subPaths } = paths[i];
            for (let j = 0; j < subPaths.length; j++) {
                const { curves } = subPaths[j];
                const newCurves = [];
                for (let k = 0; k < curves.length; k++) {
                    const curve = curves[k];
                    const option = isVertical ? { y: centerY } : { x: centerX };
                    const newCurve = curve.split(option);
                    newCurves.push(...newCurve);
                }
                paths[i].subPaths[j].curves = newCurves;
            }
        }
    }

    getBoundingBoxOfPaths(paths, signal = 0) {
        const max = new Vector2(-Infinity, -Infinity);
        const min = new Vector2(Infinity, Infinity);

        // 遍历所有控制点，找到包围核
        for (let i = 0; i < paths.length; i++) {
            const { subPaths } = paths[i];
            const { max: maxPos, min: minPos } = this.getExtremumOfSubPaths(subPaths, signal);
            max.x = Math.max(max.x, maxPos.x);
            max.y = Math.max(max.y, maxPos.y);
            min.x = Math.min(min.x, minPos.x);
            min.y = Math.min(min.y, minPos.y);
        }

        const width = max.x - min.x;
        const height = max.y - min.y;
        const boundingBox = { max, min, width, height };
        return boundingBox;
    }

    boundingBoxOfAFont(subPaths) {
        const { max, min } = this.getExtremumOfSubPaths(subPaths);
        return [max.x - min.x, max.y - min.y];
    }

    centreOfAFont(subPaths) {
        const { max, min } = this.getExtremumOfSubPaths(subPaths);
        const midX = 0.5 * (max.x + min.x);
        const midY = 0.5 * (max.y + min.y);
        return [midX, midY];
    }

    // 计算两段直线的交点
    caculateCrossPoint(point1, point2, point3, point4) {
        const { x: x0, y: y0 } = point1;
        const { x: x1, y: y1 } = point2;
        const { x: x2, y: y2 } = point3;
        const { x: x3, y: y3 } = point4;

        const y =
            ((y0 - y1) * (y3 - y2) * x0 +
                (y3 - y2) * (x1 - x0) * y0 +
                (y1 - y0) * (y3 - y2) * x2 +
                (x2 - x3) * (y1 - y0) * y2) /
            ((x1 - x0) * (y3 - y2) + (y0 - y1) * (x3 - x2));
        const x = x2 + ((x3 - x2) * (y - y2)) / (y3 - y2);
        return new Vector2(x, y);
    }

    // 将变形后的bezier曲线间光顺的连接
    makeTheJointSmooth(paths) {
        for (let i = 0; i < paths.length; i++) {
            const { subPaths } = paths[i];
            for (let j = 0; j < subPaths.length; j++) {
                const { curves } = subPaths[j];
                for (let k = 0; k < curves.length; k++) {
                    if (curves[k].type === 'QuadraticBezierCurve' && curves[k].isFromLine) {
                        // 3重循环内部，尽量不调用函数，创建对象，写法越简单越好
                        const { v0, v1, v2 } = curves[k];
                        v1.x = 2 * v1.x - 0.5 * (v0.x + v2.x);
                        v1.y = 2 * v1.y - 0.5 * (v0.y + v2.y);
                    }
                }
                paths[i].subPaths[j].curves = curves;
            }
        }
    }

    // 将直线转化成二次bezier曲线，同时标记
    lineToQuadraticBezier(paths) {
        for (let i = 0; i < paths.length; i++) {
            const { subPaths } = paths[i];
            for (let j = 0; j < subPaths.length; j++) {
                const { curves } = subPaths[j];
                const newCurves = [];
                for (let k = 0; k < curves.length; k++) {
                    const curve = curves[k];
                    if (curve.type === 'LineCurve' && curve.getLength() > 5) {
                        const { v1, v2 } = curve;
                        const midPoint = new Vector2(0.5 * (v1.x + v2.x), 0.5 * (v1.y + v2.y));
                        const newCurve = new QuadraticBezierCurve(v1, midPoint, v2);
                        newCurve.isFromLine = true;
                        newCurves.push(newCurve);
                    } else {
                        newCurves.push(curve);
                    }
                }
                paths[i].subPaths[j].curves = newCurves;
            }
        }
    }

    // 计算两条直线是否共线 叉乘判断
    getWhetherParallel(p1, p2, p3, p4) {
        const vec1 = p2.clone().sub(p1);
        const vec2 = p4.clone().sub(p3);

        return vec1.cross(vec2) < 1;
    }

    getExtremumOfSubPaths(subPaths, signal = 0) {
        const max = new Vector2(-Infinity, -Infinity);
        const min = new Vector2(Infinity, Infinity);
        // 后3个 path 分别是 删除线 下划线 方形点击区域线
        const l = subPaths.length - signal;

        for (let j = 0; j < l; j++) {
            const curves = subPaths[j].curves;
            for (let k = 0; k < curves.length; k++) {
                curves[k].getPole(min, max);
            }
        }
        return { max, min };
    }

    // 根据一个数返回（-1，1之间的伪随机数）
    getRandom(num) {
        // 我也不明白为什么要用这样一个数,看别人这么用的；
        const tempNum = Math.sin(num) * 43758.5453123;
        return tempNum - Math.trunc(tempNum);
    }

    baseTransform(funcPerCurve, funcPerChar, funcPreprocess) {
        const { paths } = this;
        const { charPosDatas } = this.options;
        const extraData = funcPreprocess && funcPreprocess();
        for (let i = 0; i < paths.length; i++) {
            const { subPaths } = paths[i];
            const data = funcPerChar && funcPerChar(i, charPosDatas[i], extraData);
            for (let j = 0; j < subPaths.length; j++) {
                const { curves } = subPaths[j];
                for (let k = 0; k < curves.length; k++) {
                    curves[k].pointApplyFunc((point) => {
                        funcPerCurve(point, data);
                    });
                }
            }
        }
    }

    transform(paths, options) {
        this.paths = paths;
        this.options = options;
        this.intensitys = Object.assign([], options.intensitys);
        this.intensitys.forEach((element, index, array) => {
            array[index] = element / 100;
        });

        this.boundingBox = this.getBoundingBoxOfPaths(paths);
        const { width, height } = this.boundingBox;
        this.isHorizontal = /^hor/.test(options.writingMode);

        this.baseWidth = this.isHorizontal ? width : height;
        this.baseHeight = this.isHorizontal ? height : width;
        this.lineHeight = options.maxFontSize;
    }
}
