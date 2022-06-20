import Shape from '@antv/g2/lib/geom//shape/shape';
import BasePie from '../../base/base-pie/base-pie';
import { parseColorToString } from '../../helpers/colors';

/**
 * 已知两点，半径，求两点夹角
 * @param {point} startPoint 开始点
 * @param {point} endPoint 结束点
 * @param {number} radius 半径
 */
function computedIncludedAngle(startPoint, endPoint, radius) {
    const x = Math.abs(endPoint.x - startPoint.x);
    const y = Math.abs(endPoint.y - startPoint.y);
    // 勾股定理: a^2 + b^2 = c^2
    const c = Math.pow(x, 2) + Math.pow(y, 2);
    // 余弦定理: cosC=(a^2+b^2-c^2)/2ab
    const cosC = (2 * Math.pow(radius, 2) - c) / (2 * radius * radius);
    // arccos
    let rg = (Math.acos(cosC) * 180) / Math.PI;
    // 确定项量
    if (endPoint.x < startPoint.x) {
        rg = 360 - rg;
    }
    return rg;
}

function ringShapeDraw(cfg, container) {
    const { points } = cfg;
    let path = [];
    const { headRadius, tailRadius, distance } = cfg.style;
    const coordInnerRadius = this._coord.innerRadius;
    // 是否只有一项
    const isOneScale = cfg.nextPoints === undefined && points[0].y === 0 && points[1].y === 1;

    // 1. 设置间隔
    if (distance > 0 && !isOneScale) {
        const sliceNumber = distance / 1000;
        points[1].y = points[1].y - sliceNumber;
        points[2].y = points[2].y - sliceNumber;
    }

    // 2. 矩形
    path.push(['M', points[0].x, points[0].y]);
    path.push(['L', points[1].x, points[1].y]);
    path.push(['L', points[2].x, points[2].y]);
    path.push(['L', points[3].x, points[3].y]);

    // 3. 解析
    path = this.parsePath(path);

    // 4. 设置圆角曲线
    if (!isOneScale || (headRadius !== 0 && tailRadius !== 0)) {
        const pointParsed = this.parsePoints(points);
        // 坐标
        const coord = this._coord;
        const radius = coord.radius;
        const startPoints = {
            x: coord.circleCentre.x,
            y: coord.circleCentre.y - radius,
        };

        // 获取椭圆形短半径
        let lowRadius = radius;
        if (coordInnerRadius !== 0) {
            lowRadius = ((1 - coordInnerRadius) * radius) / 2;
        }

        // 设置两个弧度
        if (headRadius !== 0) {
            const rg = computedIncludedAngle(startPoints, pointParsed[2], radius);
            path[2] = [
                'A',
                (lowRadius * headRadius) / 100,
                lowRadius,
                rg,
                0,
                0,
                path[2][1],
                path[2][2],
            ];
        }
        if (tailRadius !== 0) {
            const rg2 = computedIncludedAngle(startPoints, pointParsed[3], radius);
            path.push([
                'A',
                (lowRadius * tailRadius) / 100,
                lowRadius,
                rg2,
                0,
                1,
                path[0][1],
                path[0][2],
            ]);
        }

        path.push('Z');
    }
    const style = cfg.style;
    return container.addShape('path', {
        attrs: {
            path,
            fill: cfg.color,
            fillOpacity: cfg.opacity,
            lineWidth: style.lineWidth,
            stroke: style.stroke,
        },
    });
}

// 是否已经注册
const registerRingShape = false;
// 图形名称
const RING_SHAPE_NAME = 'ring';
/**
 * 环图
 * @class Ring
 */
export default class Ring extends BasePie {
    getDefaultModel() {
        return {
            settings: {
                startAngle: 90,
                allAngle: 360,
                coordRadius: 1,
                coordInnerRadius: 0.72,
                tailRadius: 100,
                headRadius: 100,
                distance: 0,
            },
            label: {
                offset: -0.23,
            },
            yAxis: {
                startRange: 0, // 从哪里开始
                endRange: 1, // 从哪里结束
            },
        };
    }

    // hook ---------------
    beforeInit() {
        super.beforeInit();
        this.registerSliceShape();
    }

    /**
     * SliceShapeName
     * 注册图形
     */
    registerSliceShape() {
        if (registerRingShape) return;

        Shape.registerShape('interval', RING_SHAPE_NAME, {
            draw: ringShapeDraw,
        });
    }

    // 初始化图形
    _initGeom() {
        super._initGeom();
        this.geom.shape(RING_SHAPE_NAME);
    }

    _initGeomStyle() {
        super._initGeomStyle();
        const { borderColor, borderWidth, headRadius, tailRadius, distance, coordInnerRadius } =
            this.model.settings;
        this.geom.style({
            headRadius,
            tailRadius,
            distance,
            coordInnerRadius,
            lineWidth: borderWidth,
            stroke: parseColorToString(borderColor),
        });
    }
}
