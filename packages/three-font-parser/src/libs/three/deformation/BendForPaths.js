/************************************************************************
 * 版权所有 (C)2018,厦门稿定科技。
 * 文件名称： bendForPaths
 * 文件标识： // 见配置管理计划书
 * 内容摘要： 本文算法为基于轮廓的弯曲变形算法
 * 其它说明： paths为字体的路径，格式与THREE.js对其, bendForPathsType为变形类型，分为level和vertical,
 * bendForPathsIntersity为变形灵敏度，范围为（-2，2），步长为0.1（一般变化精度）和0.01较高的变化精度
 * 当前版本： v1.0.0
 * 作 者： 豫闽
 * 完成日期： 2019/12/17
 ************************************************************************/

import { TransformForPaths } from './TransformForPaths';

export class BendForPaths extends TransformForPaths {
    bend(paths, options) {
        const { type } = options;
        const baseRadius = (this.lineHeight * 2) / Math.sin(this.intensitys[0] * Math.PI * 0.5);
        const isVertical = /^bend/.test(type) ? /Vertical$/.test(type) : !this.isHorizontal;

        const { boundingBox } = this;
        const { max, min, width, height } = boundingBox;
        const angle = (isVertical ? height : width) / 2 / baseRadius;
        const boxCenter = min.clone().lerp(max, 0.5);
        let baseAngle;
        const circleCenter = boxCenter.clone();

        if (isVertical) {
            baseAngle = 0;
            circleCenter.x += this.baseWidth / 2 / Math.tan(angle) + (Math.sign(angle) * width) / 2;
        } else {
            baseAngle = 1.5 * Math.PI;
            circleCenter.y +=
                this.baseWidth / 2 / Math.tan(angle) + (Math.sign(angle) * height) / 2;
        }

        // 上下方向的扇形变形
        const setNewPos1 = (pos) => {
            const r = baseRadius + (Math.sign(angle) * height) / 2 - (pos.y - boxCenter.y);
            const currentAngle = baseAngle + ((pos.x - circleCenter.x) / width) * 2 * angle;
            const x = circleCenter.x + r * Math.cos(currentAngle);
            const y = circleCenter.y + r * Math.sin(currentAngle);
            pos.set(x, y);
        };

        // 纵向不偏移 上下方向的扇形变形
        const setNewPos2 = (pos) => {
            const currentAngle = baseAngle + ((pos.x - circleCenter.x) / width) * 2 * angle;
            const x = circleCenter.x + baseRadius * Math.cos(currentAngle);
            const y =
                circleCenter.y +
                baseRadius * Math.sin(currentAngle) -
                (Math.sign(angle) * height) / 2 +
                (pos.y - boxCenter.y);
            pos.set(x, y);
        };

        // 水平方向的扇形变形
        const setNewPos3 = (pos) => {
            const r = baseRadius + (Math.sign(angle) * width) / 2 + (pos.x - boxCenter.x);
            const currentAngle = baseAngle + ((pos.y - circleCenter.y) / height) * 2 * angle;
            const x = circleCenter.x + r * Math.cos(currentAngle);
            const y = circleCenter.y + r * Math.sin(currentAngle);
            pos.set(x, y);
        };

        // 横向不偏移 水平方向的扇形变形
        const setNewPos4 = (pos) => {
            const currentAngle = baseAngle + ((pos.y - circleCenter.y) / height) * 2 * angle;
            const x =
                circleCenter.x +
                baseRadius * Math.cos(currentAngle) +
                (Math.sign(angle) * width) / 2 +
                (pos.x - boxCenter.x);
            const y = circleCenter.y + baseRadius * Math.sin(currentAngle);
            pos.set(x, y);
        };

        let setNewPos;
        switch (type) {
            case 'bend':
                setNewPos = setNewPos1;
                break;
            case 'bendVertical':
                setNewPos = setNewPos3;
                break;
            case 'archCurve':
                setNewPos = this.isHorizontal ? setNewPos2 : setNewPos4;
        }

        const funcPerCurve = (point) => {
            setNewPos(point);
        };
        this.baseTransform(funcPerCurve);
    }

    transform(paths, options) {
        super.transform(paths, options);
        if (Math.hypot(...options.intensitys)) {
            this.lineToQuadraticBezier(paths);
            this.bend(paths, options);
            this.makeTheJointSmooth(paths);
        }
        return this.getBoundingBoxOfPaths(paths);
    }
}
