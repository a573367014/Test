/************************************************************************
 * 版权所有 (C)2018,厦门稿定科技。
 * 文件名称： bendForPaths
 * 文件标识： // 见配置管理计划书
 * 内容摘要： 本文算法为基于路径的逐字变换算法
 * 其它说明： paths为字体的路径，格式与THREE.js对其,
 * verbatimTransformationIntensity为变换的幅度,
 * type为变换的样式,
 * offsetScale为字间距,
 * lineOffsetScale为行间距
 * 当前版本： v1.0.0
 * 作 者： 豫闽
 * 完成日期： 2019/12/17
 ************************************************************************/

import { Vector2 } from '../math/Vector2.js';
import { TransformForPaths } from './TransformForPaths';
import {
    EllipseCurve,
    PolygonCurve,
    RectangularCurve,
    HeartCurve,
    CircleCurve,
} from '../extras/curves';

export class VerbatimForPaths extends TransformForPaths {
    // 错落 patchwork
    patchwork() {
        const funcPerChar = (i, charPosData) => {
            const { columnNum, fontSize } = charPosData;
            const diviate = 0.5 * Math.pow(-1, columnNum + 1) * this.intensitys[0] * fontSize;
            const translateVec = this.isHorizontal
                ? new Vector2(0, -diviate)
                : new Vector2(diviate, 0);
            return { translateVec };
        };
        const funcPerCurve = (point, data) => {
            point.add(data.translateVec);
        };
        this.baseTransform(funcPerCurve, funcPerChar);
    }

    // 楼梯 step
    step() {
        const funcPerChar = (i, charPosData) => {
            const { min } = this.boundingBox;
            const { centerPos } = charPosData;
            let translateVec;
            if (this.isHorizontal) {
                const diviate = (centerPos.x - min.x) * this.intensitys[0];
                translateVec = new Vector2(0, -diviate);
            } else {
                const diviate = (centerPos.y - min.y) * this.intensitys[0];
                translateVec = new Vector2(diviate, 0);
            }
            return { translateVec };
        };
        const funcPerCurve = (point, data) => {
            point.add(data.translateVec);
        };
        this.baseTransform(funcPerCurve, funcPerChar);
    }

    // 拱形 arch2
    arch2() {
        const funcPerChar = (i, charPosData) => {
            const intensity = this.intensitys[0];
            const { min } = this.boundingBox;
            const { centerPos } = charPosData;
            let t, translateVec;
            if (this.isHorizontal) {
                t = (centerPos.x - min.x) / this.baseWidth;
                const diviate = t * (1 - t) * intensity * this.baseWidth;
                translateVec = new Vector2(0, -diviate);
            } else {
                t = (centerPos.y - min.y) / this.baseWidth;
                const diviate = t * (1 - t) * intensity * this.baseWidth;
                translateVec = new Vector2(diviate, 0);
            }
            return { translateVec };
        };
        const funcPerCurve = (point, data) => {
            point.add(data.translateVec);
        };
        this.baseTransform(funcPerCurve, funcPerChar);
    }

    // 波浪形
    wave() {
        const funcPerChar = (i, charPosData) => {
            const intensity = this.intensitys[0];
            const { width, height, min } = this.boundingBox;
            const { centerPos } = charPosData;
            let t, translateVec;
            if (this.isHorizontal) {
                t = (centerPos.x - min.x) / width;
                t *= 2 * Math.PI;
                const diviate = 0.25 * Math.sin(t) * intensity * width;
                translateVec = new Vector2(0, -diviate);
            } else {
                t = (centerPos.y - min.y) / height;
                t *= 2 * Math.PI;
                const diviate = 0.25 * Math.sin(t) * intensity * height;
                translateVec = new Vector2(diviate, 0);
            }
            return { translateVec };
        };
        const funcPerCurve = (point, data) => {
            point.add(data.translateVec);
        };
        this.baseTransform(funcPerCurve, funcPerChar);
    }

    // 3D文字阶梯远近 实际为缩放效果
    stepFarAndNear() {
        const funcPerChar = (i, charPosData) => {
            const { centerPos } = charPosData;
            const k = this.intensitys[0];
            const { min, width, height } = this.boundingBox;
            let t, centerX, centerY;
            if (this.isHorizontal) {
                t = (centerPos.x - min.x) / width;
                // -k * t + 1 + k 为 y 关于 t 在 0-t 区间积分除以 t 得到的结果
                centerX = (centerPos.x - min.x) * (k * t + 1 - k) + min.x;
                centerY = centerPos.y;
            } else {
                t = (centerPos.y - min.y) / height;
                centerX = centerPos.x;
                centerY = (centerPos.y - min.y) * (k * t + 1 - k) + min.y;
            }
            const y = 2 * (t - 0.5) * k + 1;
            return { centerX, centerY, t: y, centerPos };
        };
        const funcPerCurve = (point, data) => {
            const { centerX, centerY, t, centerPos } = data;
            const x = (point.x - centerPos.x) * t + centerX;
            const y = (point.y - centerPos.y) * t + centerY;
            point.set(x, y);
        };
        this.baseTransform(funcPerCurve, funcPerChar);
    }

    // 模拟3D文字拱形远近效果 实际为中间放大两边缩小效果
    archFarAndNear() {
        const funcPreprocess = () => {
            const { width, height, min } = this.boundingBox;
            const boxCenter = new Vector2(min.x + 0.5 * width, min.y + 0.5 * height);
            return { width, height, min, boxCenter };
        };
        const funcPerChar = (i, charPosData, data) => {
            const k = this.intensitys[0];
            const { centerPos } = charPosData;
            const { boxCenter, width, height } = data;
            let t, centerX, centerY;
            if (this.isHorizontal) {
                t = (2 * Math.abs(centerPos.x - boxCenter.x)) / width;
                // -k * t + 1 + k 为 y 关于 t 在 0-t 区间积分除以 t 得到的结果
                centerX = (centerPos.x - boxCenter.x) * (-k * t + 1 + k) + boxCenter.x;
                centerY = centerPos.y;
            } else {
                t = (2 * Math.abs(centerPos.y - boxCenter.y)) / height;
                centerX = centerPos.x;
                centerY = (centerPos.y - boxCenter.y) * (-k * t + 1 + k) + boxCenter.y;
            }
            const y = -2 * (t - 0.5) * k + 1;
            return { centerX, centerY, t: y, centerPos };
        };
        const funcPerCurve = (point, data) => {
            const { centerX, centerY, t, centerPos } = data;
            const x = (point.x - centerPos.x) * t + centerX;
            const y = (point.y - centerPos.y) * t + centerY;
            point.set(x, y);
        };
        this.baseTransform(funcPerCurve, funcPerChar, funcPreprocess);
    }

    // 水平旋转 horizontalRotate
    horizontalRotate() {
        const funcPerChar = (i, charPosData) => {
            const { centerPos } = charPosData;
            const angle = 0.333 * this.intensitys[0] * Math.PI;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            return { cos, sin, centerPos };
        };
        const funcPerCurve = (point, data) => {
            const { cos, sin, centerPos } = data;
            const initx = point.x - centerPos.x;
            const inity = point.y - centerPos.y;

            const x = centerPos.x + initx * cos - inity * sin;
            const y = centerPos.y + initx * sin + inity * cos;
            point.set(x, y);
        };
        this.baseTransform(funcPerCurve, funcPerChar);
    }

    //  水平弧形路径 贝塞尔曲线模式
    horizontalCurvedRotate() {
        const funcPreprocess = () => {
            const { width, height, min } = this.boundingBox;
            // let point1, point2, point3;
            // if(this.isHorizontal) {
            //     point1 = new Vector2(min.x, min.y);
            //     point2 = new Vector2(min.x + width / 2, min.y - 0.05 / this.lineHeight * this.baseWidth * this.baseWidth * this.intensitys[0]);
            //     point3 = new Vector2(max.x, min.y);
            // }
            // else {
            //     point1 = new Vector2(min.x, min.y);
            //     point2 = new Vector2(min.x + 0.05 / this.lineHeight * this.baseWidth * this.baseWidth * this.intensitys[0], min.y + height / 2);
            //     point3 = new Vector2(min.x, max.y);
            // }
            // const bezierCurve = new QuadraticBezierCurve(point1, point2, point3);

            const center = new Vector2(min.x + width / 2, min.y + height / 2);
            // 保持半径不变
            const radius = (this.lineHeight * 2) / Math.sin(this.intensitys[0] * Math.PI * 0.5);
            const angle = (0.5 * this.baseWidth) / radius;
            const baseAngle = this.isHorizontal ? 0 : 0.5 * Math.PI;
            const curve = new CircleCurve(center, radius, baseAngle - angle, baseAngle + angle);
            return { width, min, height, curve, isHorizontal: this.isHorizontal };
        };
        const { funcPerChar, funcPerCurve } = this.getPerCharAndCurveFunc(true);
        this.baseTransform(funcPerCurve, funcPerChar, funcPreprocess);
    }

    arbitraryOffsetRotate() {
        const baseRandNum = this.options.randNum;
        const funcPerChar = (i, charPosData) => {
            const { fontSize, centerPos } = charPosData;
            let randNum = this.getRandom(baseRandNum + i * Math.E);
            const angle = 0.5 * this.intensitys[1] * Math.PI * randNum;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            randNum = this.getRandom(baseRandNum + i * i * Math.E);
            const diviate = 0.5 * this.intensitys[0] * randNum * fontSize;
            return { cos, sin, diviate, centerPos };
        };
        const funcPerCurve = (point, data) => {
            const { cos, diviate, sin, centerPos } = data;
            const initx = point.x - centerPos.x;
            const inity = point.y - centerPos.y;

            let x, y;
            if (this.isHorizontal) {
                x = centerPos.x + initx * cos - inity * sin;
                y = centerPos.y + diviate + initx * sin + inity * cos;
            } else {
                x = centerPos.x + diviate + initx * cos - inity * sin;
                y = centerPos.y + initx * sin + inity * cos;
            }
            point.set(x, y);
        };

        this.baseTransform(funcPerCurve, funcPerChar);
    }

    ellipse() {
        const funcPreprocess = () => {
            const { width, height, min } = this.boundingBox;
            const e = this.intensitys[3] || 0;
            let aX, aY, xRadius, yRadius;
            if (this.isHorizontal) {
                aX = min.x + 0.5 * width;
                aY = min.y;
                xRadius = 0.5 * width * this.intensitys[0];
                yRadius = Math.sqrt(1 - e * e) * xRadius;
            } else {
                aX = min.x;
                aY = min.y + 0.5 * height;
                yRadius = 0.5 * height * this.intensitys[0];
                xRadius = Math.sqrt(1 - e * e) * yRadius;
            }

            const aStartAngle =
                (this.intensitys[1] / 1.8 + (this.isHorizontal ? 1 : 1.5)) * Math.PI;
            const aEndAngle = aStartAngle + (this.intensitys[2] / 1.8) * Math.PI;
            const aClockwise = false;
            const ellipseCurve = new EllipseCurve(
                aX,
                aY,
                xRadius,
                yRadius,
                aStartAngle,
                aEndAngle,
                aClockwise,
            );
            return { width, min, height, curve: ellipseCurve, isHorizontal: this.isHorizontal };
        };
        const { funcPerChar, funcPerCurve } = this.getPerCharAndCurveFunc(
            this.options.isFollowTangent,
        );
        this.baseTransform(funcPerCurve, funcPerChar, funcPreprocess);
    }

    triangle() {
        this.polygon();
    }

    rectangular() {
        const funcPreprocess = () => {
            const { width, height, min } = this.boundingBox;
            // (center, size, num, rotation = 0, startNum = 0, endNum = 1);
            let rectangularCenter, size;
            if (this.isHorizontal) {
                rectangularCenter = new Vector2(min.x + 0.5 * width, min.y);
                size = 0.5 * this.intensitys[0] * width;
            } else {
                rectangularCenter = new Vector2(min.x, min.y + 0.5 * height);
                size = 0.5 * this.intensitys[0] * height;
            }
            const ratio = this.intensitys[1];
            const startNum = this.intensitys[2];
            const endNum = startNum + this.intensitys[3];

            const rectangularCurve = new RectangularCurve(
                rectangularCenter,
                size,
                ratio,
                startNum,
                endNum,
            );
            return { width, min, height, curve: rectangularCurve, isHorizontal: this.isHorizontal };
        };
        const { funcPerChar, funcPerCurve } = this.getPerCharAndCurveFunc(
            this.options.isFollowTangent,
        );
        this.baseTransform(funcPerCurve, funcPerChar, funcPreprocess);
    }

    pentagon() {
        this.polygon();
    }

    polygon() {
        const funcPreprocess = () => {
            const { width, height, min } = this.boundingBox;
            // (center, size, num, rotation = 0, startNum = 0, endNum = 1);
            let polygonCenter, size;
            if (this.isHorizontal) {
                polygonCenter = new Vector2(min.x + 0.5 * width, min.y);
                size = 0.5 * this.intensitys[0] * width;
            } else {
                polygonCenter = new Vector2(min.x, min.y + 0.5 * height);
                size = 0.5 * this.intensitys[0] * height;
            }
            const num = this.intensitys[1] * 100;
            const startNum = this.intensitys[2];
            const endNum = startNum + this.intensitys[3];

            const polygonCurve = new PolygonCurve(polygonCenter, size, num, startNum, endNum);
            return {
                width,
                min,
                height,
                curve: polygonCurve,
                isHorizontal: this.isHorizontal,
                needExpandAlongNormal: true,
            };
        };
        const { funcPerChar, funcPerCurve } = this.getPerCharAndCurveFunc(
            this.options.isFollowTangent,
        );
        this.baseTransform(funcPerCurve, funcPerChar, funcPreprocess);
    }

    heart() {
        const funcPreprocess = () => {
            const { width, height, min } = this.boundingBox;
            // (center, size, num, rotation = 0, startNum = 0, endNum = 1);
            let center, size;
            if (this.isHorizontal) {
                center = new Vector2(min.x + 0.5 * width, min.y);
                size = 0.5 * this.intensitys[0] * width;
            } else {
                center = new Vector2(min.x, min.y + 0.5 * height);
                size = 0.5 * this.intensitys[0] * height;
            }
            const startNum = this.intensitys[1];
            const endNum = startNum + this.intensitys[2];

            const curve = new HeartCurve(center, size, startNum, endNum);
            return { width, min, height, curve, isHorizontal: this.isHorizontal };
        };
        const { funcPerChar, funcPerCurve } = this.getPerCharAndCurveFunc(
            this.options.isFollowTangent,
        );
        this.baseTransform(funcPerCurve, funcPerChar, funcPreprocess);
    }

    getPerCharAndCurveFunc(isFollowTangent) {
        let funcPerChar, funcPerCurve;
        if (isFollowTangent) {
            funcPerChar = this.calculateNewCenter;
            funcPerCurve = this.resetPointPos;
        } else {
            funcPerChar = this.calculateNewCenterWithoutRotate;
            funcPerCurve = this.resetPointPosWithoutRotate;
        }
        return { funcPerChar, funcPerCurve };
    }

    calculateNewCenter(i, charPosData, data) {
        const { width, height, min, curve, isHorizontal, needExpandAlongNormal = false } = data;
        const { centerPos, centerDiviation } = charPosData;
        const t = isHorizontal ? (centerPos.x - min.x) / width : (centerPos.y - min.y) / height;

        const diviateVec = isHorizontal
            ? new Vector2(0, centerPos.y - min.y)
            : new Vector2(centerPos.x - min.x, 0);

        if (needExpandAlongNormal) {
            const normalVec = curve.getNormal(t);
            diviateVec.addScaledVector(normalVec, -centerDiviation);
        }

        const newCenterPos = curve.getPointAt(t).add(diviateVec);
        const tangentVec = curve.getTangent(t);

        const cos = tangentVec.x;
        const sin = tangentVec.y;

        return { cos, sin, newCenterPos, centerPos };
    }

    calculateNewCenterWithoutRotate(i, charPosData, data) {
        const { width, height, min, curve, isHorizontal } = data;
        const { centerPos } = charPosData;
        const t = isHorizontal ? (centerPos.x - min.x) / width : (centerPos.y - min.y) / height;

        const diviateVec = isHorizontal
            ? new Vector2(0, centerPos.y - min.y)
            : new Vector2(centerPos.x - min.x, 0);

        const newCenterPos = curve.getPointAt(t).add(diviateVec);
        return { newCenterPos, centerPos };
    }

    resetPointPos(point, data) {
        const { newCenterPos, cos = 1, sin = 0, centerPos } = data;
        const dx = point.x - centerPos.x;
        const dy = point.y - centerPos.y;
        const x = newCenterPos.x + dx * cos - dy * sin;
        const y = newCenterPos.y + dx * sin + dy * cos;
        point.set(x, y);
    }

    resetPointPosWithoutRotate(point, data) {
        const { newCenterPos, centerPos } = data;
        const x = point.x - centerPos.x + newCenterPos.x;
        const y = point.y - centerPos.y + newCenterPos.y;
        point.set(x, y);
    }

    transform(paths, options) {
        if (Math.hypot(...options.intensitys)) {
            super.transform(paths, options);

            const type = this.options.type.replace(/-byWord$/, '');
            this[type] && this[type]();
        }

        return this.getBoundingBoxOfPaths(paths);
    }
}
