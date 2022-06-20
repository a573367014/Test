/************************************************************************
 * 版权所有 (C)2018,厦门稿定科技。
 * 文件名称： bendForPaths
 * 文件标识： // 见配置管理计划书
 * 内容摘要： 本文算法为基于路径的逐字变换算法
 * 其它说明： paths为字体的路径，格式与THREE.js对其,
 * verbatimTransformationIntensity为变换的幅度,
 * verbatimTransformationPattern为变换的样式,
 * offsetScale为字间距,
 * lineOffsetScale为行间距
 * 当前版本： v1.0.0
 * 作 者： 豫闽
 * 完成日期： 2019/12/17
 *
 * 修改记录1：// 修改历史记录，包括修改日期、修改者及修改内容
 * 修改日期：
 * 版 本 号：
 * 修 改 人：
 * 修改内容：
 * 修改记录2：…
 ************************************************************************/

import { Vector2 } from '../math/Vector2.js';

import { TransformForPaths } from './TransformForPaths';

export class FFDForPaths extends TransformForPaths {
    // 生成FFD变形的控制点 x和y分别为向x方向和y方向插入点的个数
    creatFFDControlPoints(boundingBox, addPointInX, addPointInY) {
        const { min, max, width, height } = boundingBox;
        const controlPoints = [];
        if (this.isHorizontal) {
            const dx = width / (addPointInX + 1);
            const dy = height / (addPointInY + 1);
            for (let i = 0; i < addPointInX + 2; i++) {
                for (let j = 0; j < addPointInY + 2; j++) {
                    const controlPoint = new Vector2(min.x + i * dx, min.y + j * dy);
                    controlPoints.push(controlPoint);
                }
            }
        } else {
            const dx = width / (addPointInY + 1);
            const dy = height / (addPointInX + 1);
            for (let i = 0; i < addPointInX + 2; i++) {
                for (let j = 0; j < addPointInY + 2; j++) {
                    const controlPoint = new Vector2(max.x - j * dx, min.y + i * dy);
                    controlPoints.push(controlPoint);
                }
            }
        }
        return controlPoints;
    }

    adjustControlPoints(point, vec) {
        const { x, y } = vec;
        if (this.isHorizontal) {
            point.x += x;
            point.y += y;
        } else {
            point.x -= y;
            point.y += x;
        }
    }

    // 计算阶乘
    factorialForFFD(n) {
        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }

    // 计算组合数，从N个中取M个
    combineForFFD(N, M) {
        const a = this.factorialForFFD(N) / this.factorialForFFD(N - M) / this.factorialForFFD(M);
        return a;
    }

    // bezier ffd 计算
    caculateForBezierFFD(paths, boundingBox, controlPoints, addPointInX, addPointInY) {
        const getWeight = (addPointInX, i, s) =>
            this.combineForFFD(addPointInX + 1, i) *
            Math.pow(1 - s, addPointInX + 1 - i) *
            Math.pow(s, i);
        this.caculateForFFD(getWeight, paths, boundingBox, controlPoints, addPointInX, addPointInY);
    }

    linearBasis(l, i, s) {
        const k = i < s * l ? i + 1 - s * l : s * l - i + 1;
        return Math.max(0, k);
    }

    // linear ffd 计算
    caculateForLinearFFD(paths, boundingBox, controlPoints, addPointInX, addPointInY) {
        const getWeight = (addPointInX, i, s) => this.linearBasis(addPointInX + 1, i, s);
        this.caculateForFFD(getWeight, paths, boundingBox, controlPoints, addPointInX, addPointInY);
    }

    caculateForFFD(getWeight, paths, boundingBox, controlPoints, addPointInX, addPointInY) {
        const { min, max, width, height } = boundingBox;
        let funcPerCurve;
        if (this.isHorizontal) {
            funcPerCurve = (point) => {
                const kx = (point.x - min.x) / width;
                const ky = (point.y - min.y) / height;
                let [sumOfX, sumOfY] = [0, 0];
                for (let i = 0; i < addPointInX + 2; i++) {
                    const sOfV = getWeight(addPointInX, i, kx);
                    for (let j = 0; j < addPointInY + 2; j++) {
                        const tOfV = getWeight(addPointInY, j, ky);
                        const controlPoint = controlPoints[i * (addPointInY + 2) + j];
                        sumOfX += sOfV * tOfV * controlPoint.x;
                        sumOfY += sOfV * tOfV * controlPoint.y;
                    }
                }
                point.set(sumOfX, sumOfY);
            };
        } else {
            funcPerCurve = (point) => {
                const kx = (max.x - point.x) / width;
                const ky = (point.y - min.y) / height;
                let [sumOfX, sumOfY] = [0, 0];
                for (let i = 0; i < addPointInX + 2; i++) {
                    const sOfV = getWeight(addPointInX, i, ky);
                    for (let j = 0; j < addPointInY + 2; j++) {
                        const tOfV = getWeight(addPointInY, j, kx);
                        const controlPoint = controlPoints[i * (addPointInY + 2) + j];
                        sumOfX += sOfV * tOfV * controlPoint.x;
                        sumOfY += sOfV * tOfV * controlPoint.y;
                    }
                }
                point.set(sumOfX, sumOfY);
            };
        }
        this.baseTransform(funcPerCurve);
    }

    // 接口与类型判断
    transform(
        paths,
        { type, intensitys, maxFontSize = 100, charPosDatas, writingMode = 'horizontal-tb' },
    ) {
        super.transform(paths, { intensitys, maxFontSize, charPosDatas, writingMode });
        if (Math.hypot(...intensitys) > 0) {
            const MAXANGLE = Math.PI / 3;
            const { baseHeight, baseWidth, boundingBox, isHorizontal } = this;
            const [intensity1, intensity2] = this.intensitys;
            let isNeedToBreak = false;

            const needToBreakTypes = [
                'bevel',
                'upperRoof',
                'lowerRoof',
                'angledProjection',
                'foldedCorner',
                'flagCurve',
            ];
            if (needToBreakTypes.find((name) => name === type)) {
                isNeedToBreak = true;
            }

            if (isNeedToBreak) {
                this.breakLine(paths, this.boundingBox, !isHorizontal);
            }

            if (/Curve$/.test(type)) {
                this.lineToQuadraticBezier(paths);
            }

            let controlPoints, diviation1, diviation2, k, vec;
            let addPointInX = 0;
            let addPointInY = 0;
            let needToSmooth = false;

            // 控制点
            // 0--2--4
            // |  |  |
            // 1--3--5
            switch (type) {
                case 'archCurve':
                    needToSmooth = true; // 拱形
                    diviation1 = (0.05 / maxFontSize) * baseWidth * baseWidth * intensity1;
                    addPointInX = 1;
                    addPointInY = 0;
                    controlPoints = this.creatFFDControlPoints(
                        boundingBox,
                        addPointInX,
                        addPointInY,
                    );
                    vec = new Vector2(0, -diviation1);
                    this.adjustControlPoints(controlPoints[2], vec);
                    this.adjustControlPoints(controlPoints[3], vec);
                    break;
                case 'concaveCurve':
                    needToSmooth = true; // 内凹
                    diviation1 = baseHeight * intensity1;
                    addPointInX = 1;
                    addPointInY = 0;
                    controlPoints = this.creatFFDControlPoints(
                        boundingBox,
                        addPointInX,
                        addPointInY,
                    );
                    this.adjustControlPoints(controlPoints[0], new Vector2(0, -diviation1));
                    this.adjustControlPoints(controlPoints[2], new Vector2(0, 2 * diviation1));
                    this.adjustControlPoints(controlPoints[4], new Vector2(0, -diviation1));
                    this.adjustControlPoints(controlPoints[1], new Vector2(0, diviation1));
                    this.adjustControlPoints(controlPoints[3], new Vector2(0, -2 * diviation1));
                    this.adjustControlPoints(controlPoints[5], new Vector2(0, diviation1));
                    break;
                case 'upperArchCurve':
                    needToSmooth = true; // 上拱形
                    diviation1 = (intensity1 > 0 ? 0.5 * baseWidth : 2 * baseHeight) * intensity1;
                    addPointInX = 1;
                    addPointInY = 0;
                    controlPoints = this.creatFFDControlPoints(
                        boundingBox,
                        addPointInX,
                        addPointInY,
                    );
                    this.adjustControlPoints(controlPoints[2], new Vector2(0, -diviation1));
                    break;
                case 'lowerArchCurve':
                    needToSmooth = true; // 下拱形
                    controlPoints = this.creatFFDControlPoints(
                        boundingBox,
                        addPointInX,
                        addPointInY,
                    );
                    diviation1 = (intensity1 > 0 ? 0.5 * baseWidth : 2 * baseHeight) * intensity1;
                    addPointInX = 1;
                    addPointInY = 0;
                    controlPoints = this.creatFFDControlPoints(
                        boundingBox,
                        addPointInX,
                        addPointInY,
                    );
                    this.adjustControlPoints(controlPoints[3], new Vector2(0, +diviation1));
                    break;
                case 'bulbCurve':
                    needToSmooth = true; // 凸出
                    diviation1 = -baseHeight * intensity1;
                    addPointInX = 1;
                    addPointInY = 0;
                    controlPoints = this.creatFFDControlPoints(
                        boundingBox,
                        addPointInX,
                        addPointInY,
                    );
                    this.adjustControlPoints(controlPoints[0], new Vector2(0, -0.5 * diviation1));
                    this.adjustControlPoints(controlPoints[2], new Vector2(0, 2 * diviation1));
                    this.adjustControlPoints(controlPoints[4], new Vector2(0, -0.5 * diviation1));
                    this.adjustControlPoints(controlPoints[1], new Vector2(0, 0.5 * diviation1));
                    this.adjustControlPoints(controlPoints[3], new Vector2(0, -2 * diviation1));
                    this.adjustControlPoints(controlPoints[5], new Vector2(0, 0.5 * diviation1));
                    break;
                case 'skew':
                    needToSmooth = false; // 斜切
                    addPointInX = 0;
                    addPointInY = 0;
                    controlPoints = this.creatFFDControlPoints(
                        boundingBox,
                        addPointInX,
                        addPointInY,
                    );
                    diviation1 = baseHeight * Math.tan(intensity1 * MAXANGLE);
                    diviation2 = baseWidth * Math.tan(intensity2 * MAXANGLE);
                    this.adjustControlPoints(controlPoints[0], new Vector2(diviation1, 0));
                    this.adjustControlPoints(
                        controlPoints[2],
                        new Vector2(diviation1, -diviation2),
                    );
                    this.adjustControlPoints(controlPoints[3], new Vector2(0, -diviation2));
                    break;
                case 'flagCurve':
                    needToSmooth = true; // 旗形
                    diviation1 = 0.5 * baseWidth * intensity1;
                    addPointInX = 3;
                    addPointInY = 0;
                    controlPoints = this.creatFFDControlPoints(
                        boundingBox,
                        addPointInX,
                        addPointInY,
                    );
                    this.adjustControlPoints(controlPoints[2], new Vector2(0, -diviation1));
                    this.adjustControlPoints(controlPoints[3], new Vector2(0, -diviation1));
                    this.adjustControlPoints(controlPoints[6], new Vector2(0, diviation1));
                    this.adjustControlPoints(controlPoints[7], new Vector2(0, diviation1));
                    break;
                case 'trapezoid':
                    needToSmooth = true; // 梯形
                    diviation1 = 0.25 * baseWidth * intensity1;
                    diviation2 = 0.5 * baseHeight * intensity2;
                    k = 0.5 * (intensity1 + 1);
                    addPointInX = 0;
                    addPointInY = 1;
                    controlPoints = this.creatFFDControlPoints(
                        boundingBox,
                        addPointInX,
                        addPointInY,
                    );

                    this.adjustControlPoints(
                        controlPoints[0],
                        new Vector2(+diviation1, -diviation2),
                    );
                    this.adjustControlPoints(
                        controlPoints[2],
                        new Vector2(-diviation1, +diviation2),
                    );
                    this.adjustControlPoints(
                        controlPoints[3],
                        new Vector2(-diviation1, -diviation2),
                    );
                    this.adjustControlPoints(
                        controlPoints[5],
                        new Vector2(+diviation1, +diviation2),
                    );

                    controlPoints[1] = new Vector2().lerpVectors(
                        controlPoints[2],
                        controlPoints[0],
                        k,
                    );
                    controlPoints[4] = new Vector2().lerpVectors(
                        controlPoints[5],
                        controlPoints[3],
                        k,
                    );
                    break;
                case 'lowerTrapezoid':
                    needToSmooth = true; // 下梯形
                    diviation1 = baseWidth * Math.tan(intensity1 * MAXANGLE);
                    diviation2 = baseHeight * intensity2;
                    k = 0.5 * (intensity1 + 1);

                    addPointInX = 1;
                    addPointInY = 0;
                    controlPoints = this.creatFFDControlPoints(
                        boundingBox,
                        addPointInX,
                        addPointInY,
                    );
                    this.adjustControlPoints(controlPoints[0], new Vector2(0, -diviation2));
                    this.adjustControlPoints(controlPoints[4], new Vector2(0, -diviation2));
                    this.adjustControlPoints(
                        controlPoints[intensity1 > 0 ? 1 : 5],
                        new Vector2(0, +Math.abs(diviation1)),
                    );

                    controlPoints[2] = new Vector2().lerpVectors(
                        controlPoints[0],
                        controlPoints[4],
                        k,
                    );
                    controlPoints[3] = new Vector2().lerpVectors(
                        controlPoints[1],
                        controlPoints[5],
                        k,
                    );
                    break;

                case 'topTrapezoid':
                    needToSmooth = true; // 上梯形
                    diviation1 = baseWidth * Math.tan(intensity1 * MAXANGLE);
                    diviation2 = baseHeight * intensity2;
                    k = 0.5 * (intensity1 + 1);

                    addPointInX = 1;
                    addPointInY = 0;
                    controlPoints = this.creatFFDControlPoints(
                        boundingBox,
                        addPointInX,
                        addPointInY,
                    );
                    this.adjustControlPoints(controlPoints[1], new Vector2(0, +diviation2));
                    this.adjustControlPoints(controlPoints[5], new Vector2(0, +diviation2));
                    this.adjustControlPoints(
                        controlPoints[intensity1 > 0 ? 4 : 0],
                        new Vector2(0, -Math.abs(diviation1)),
                    );

                    controlPoints[2] = new Vector2().lerpVectors(
                        controlPoints[4],
                        controlPoints[0],
                        k,
                    );
                    controlPoints[3] = new Vector2().lerpVectors(
                        controlPoints[5],
                        controlPoints[1],
                        k,
                    );
                    break;
                case 'horizontalTrapezoid':
                    needToSmooth = true; // 横向梯形 为了营造横向透视效果，需要用贝塞尔曲线模式
                    diviation1 = 0.5 * baseWidth * Math.tan(intensity1 * MAXANGLE);
                    diviation2 = 0.5 * baseHeight * intensity2;
                    k = 0.5 + intensity1 * 0.5;
                    addPointInX = 1;
                    addPointInY = 0;
                    controlPoints = this.creatFFDControlPoints(
                        boundingBox,
                        addPointInX,
                        addPointInY,
                    );

                    this.adjustControlPoints(
                        controlPoints[intensity1 > 0 ? 0 : 4],
                        new Vector2(0, -Math.sign(intensity1) * diviation1),
                    );
                    this.adjustControlPoints(
                        controlPoints[intensity1 > 0 ? 1 : 5],
                        new Vector2(0, +Math.sign(intensity1) * diviation1),
                    );
                    this.adjustControlPoints(controlPoints[0], new Vector2(0, -diviation2));
                    this.adjustControlPoints(controlPoints[1], new Vector2(0, +diviation2));
                    this.adjustControlPoints(controlPoints[4], new Vector2(0, -diviation2));
                    this.adjustControlPoints(controlPoints[5], new Vector2(0, +diviation2));

                    controlPoints[2] = new Vector2().lerpVectors(
                        controlPoints[0],
                        controlPoints[4],
                        k,
                    );
                    controlPoints[3] = new Vector2().lerpVectors(
                        controlPoints[1],
                        controlPoints[5],
                        k,
                    );
                    break;
                case 'bevel':
                    needToSmooth = false; // 折角
                    diviation1 = 0.5 * baseWidth * Math.tan(intensity1 * MAXANGLE);
                    diviation2 = 0.5 * baseHeight * intensity2;
                    addPointInX = 1;
                    addPointInY = 0;
                    controlPoints = this.creatFFDControlPoints(
                        boundingBox,
                        addPointInX,
                        addPointInY,
                    );
                    this.adjustControlPoints(controlPoints[0], new Vector2(0, -diviation2));
                    this.adjustControlPoints(
                        controlPoints[2],
                        new Vector2(0, -diviation1 - diviation2),
                    );
                    this.adjustControlPoints(controlPoints[4], new Vector2(0, -diviation2));
                    this.adjustControlPoints(controlPoints[1], new Vector2(0, +diviation2));
                    this.adjustControlPoints(
                        controlPoints[3],
                        new Vector2(0, -diviation1 + diviation2),
                    );
                    this.adjustControlPoints(controlPoints[5], new Vector2(0, +diviation2));
                    break;
                case 'upperRoof':
                    needToSmooth = false; // 上屋顶
                    diviation1 = 0.5 * baseWidth * Math.tan(intensity1 * MAXANGLE);
                    diviation2 = baseHeight * intensity2;
                    addPointInX = 1;
                    addPointInY = 0;
                    controlPoints = this.creatFFDControlPoints(
                        boundingBox,
                        addPointInX,
                        addPointInY,
                    );

                    this.adjustControlPoints(
                        controlPoints[0],
                        new Vector2(0, +intensity1 * baseHeight - diviation2),
                    );
                    this.adjustControlPoints(
                        controlPoints[2],
                        new Vector2(0, -diviation1 - diviation2),
                    );
                    this.adjustControlPoints(
                        controlPoints[4],
                        new Vector2(0, +intensity1 * baseHeight - diviation2),
                    );
                    break;
                case 'lowerRoof':
                    needToSmooth = false; // 下屋顶
                    diviation1 = 0.5 * baseWidth * Math.tan(intensity1 * MAXANGLE);
                    diviation2 = baseHeight * intensity2;
                    addPointInX = 1;
                    addPointInY = 0;
                    controlPoints = this.creatFFDControlPoints(
                        boundingBox,
                        addPointInX,
                        addPointInY,
                    );

                    this.adjustControlPoints(
                        controlPoints[1],
                        new Vector2(0, -intensity1 * baseHeight + diviation2),
                    );
                    this.adjustControlPoints(
                        controlPoints[3],
                        new Vector2(0, +diviation1 + diviation2),
                    );
                    this.adjustControlPoints(
                        controlPoints[5],
                        new Vector2(0, -intensity1 * baseHeight + diviation2),
                    );
                    break;
                case 'angledProjection':
                    needToSmooth = false; // 折角凸出
                    diviation1 = 0.5 * baseWidth * Math.tan(intensity1 * 0.5 * MAXANGLE);
                    diviation2 = 0.5 * baseHeight * intensity2;
                    addPointInX = 1;
                    addPointInY = 0;
                    controlPoints = this.creatFFDControlPoints(
                        boundingBox,
                        addPointInX,
                        addPointInY,
                    );

                    this.adjustControlPoints(
                        controlPoints[0],
                        new Vector2(0, +0.5 * diviation1 - diviation2),
                    );
                    this.adjustControlPoints(
                        controlPoints[2],
                        new Vector2(0, -2 * diviation1 - diviation2),
                    );
                    this.adjustControlPoints(
                        controlPoints[4],
                        new Vector2(0, 0.5 * diviation1 - diviation2),
                    );
                    this.adjustControlPoints(
                        controlPoints[1],
                        new Vector2(0, -0.5 * diviation1 + diviation2),
                    );
                    this.adjustControlPoints(
                        controlPoints[3],
                        new Vector2(0, 2 * diviation1 + diviation2),
                    );
                    this.adjustControlPoints(
                        controlPoints[5],
                        new Vector2(0, -0.5 * diviation1 + diviation2),
                    );
                    break;
                case 'foldedCorner':
                    needToSmooth = false; // 折角内凹
                    diviation1 = 0.5 * baseWidth * Math.tan(intensity1 * 0.5 * MAXANGLE);
                    diviation2 = 0.5 * baseHeight * intensity2;
                    addPointInX = 1;
                    addPointInY = 0;
                    controlPoints = this.creatFFDControlPoints(
                        boundingBox,
                        addPointInX,
                        addPointInY,
                    );

                    this.adjustControlPoints(
                        controlPoints[0],
                        new Vector2(0, -diviation1 - diviation2),
                    );
                    this.adjustControlPoints(
                        controlPoints[2],
                        new Vector2(0, +0.5 * diviation1 - diviation2),
                    );
                    this.adjustControlPoints(
                        controlPoints[4],
                        new Vector2(0, -diviation1 - diviation2),
                    );
                    this.adjustControlPoints(
                        controlPoints[1],
                        new Vector2(0, +diviation1 + diviation2),
                    );
                    this.adjustControlPoints(
                        controlPoints[3],
                        new Vector2(0, -0.5 * diviation1 + diviation2),
                    );
                    this.adjustControlPoints(
                        controlPoints[5],
                        new Vector2(0, +diviation1 + diviation2),
                    );
                    break;
                case 'lateralStretching':
                    needToSmooth = false; // 横向拉伸
                    addPointInX = 0;
                    addPointInY = 0;
                    controlPoints = this.creatFFDControlPoints(
                        boundingBox,
                        addPointInX,
                        addPointInY,
                    );
                    diviation1 = 0.5 * baseWidth * intensity1;

                    this.adjustControlPoints(controlPoints[0], new Vector2(-diviation1, 0));
                    this.adjustControlPoints(controlPoints[2], new Vector2(diviation1, 0));
                    this.adjustControlPoints(controlPoints[1], new Vector2(-diviation1, 0));
                    this.adjustControlPoints(controlPoints[3], new Vector2(diviation1, 0));
                    break;
                case 'verticalStretching':
                    needToSmooth = false; // 纵向拉伸
                    addPointInX = 0;
                    addPointInY = 0;
                    controlPoints = this.creatFFDControlPoints(
                        boundingBox,
                        addPointInX,
                        addPointInY,
                    );
                    diviation1 = 0.5 * baseHeight * intensity1;

                    this.adjustControlPoints(controlPoints[0], new Vector2(0, -diviation1));
                    this.adjustControlPoints(controlPoints[2], new Vector2(0, -diviation1));
                    this.adjustControlPoints(controlPoints[1], new Vector2(0, +diviation1));
                    this.adjustControlPoints(controlPoints[3], new Vector2(0, +diviation1));
                    break;
            }

            if (needToSmooth) {
                this.caculateForBezierFFD(
                    paths,
                    boundingBox,
                    controlPoints,
                    addPointInX,
                    addPointInY,
                );
                this.makeTheJointSmooth(paths);
            } else {
                this.caculateForLinearFFD(
                    paths,
                    boundingBox,
                    controlPoints,
                    addPointInX,
                    addPointInY,
                );
            }
        }

        return this.getBoundingBoxOfPaths(paths);
    }
}
