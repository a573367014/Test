/**
 * @class 柱状位置
 */
export default class RectPoint {
    constructor(points, { range, coordParse }) {
        this.points = points;
        this.coordParse = coordParse;
        this.startRange = range[0];
        this.endRange = range[1];
        this.parsedPoints = coordParse.parsePoints(points);
        // init
        this._init();
    }

    _parsePoints(...args) {
        return this.coordParse.parsePoints(...args);
    }

    _parsePoint(...args) {
        return this.coordParse.parsePoint(...args);
    }

    // 减少计算
    _init() {
        this.shapeWidth = this.getShapeWidth();
        this.shapeHeight = this.getShapeHeight();
        this.shapeFullHeight = this.getShapeFullHeight();
    }

    /**
     * 获取宽度
     */
    getShapeWidth() {
        const points = this.parsedPoints;
        return Math.abs(points[2].x - points[1].x);
    }

    /**
     * 获取高度
     */
    getShapeHeight() {
        const points = this.parsedPoints;
        return Math.abs(points[1].y - points[0].y);
    }

    /**
     * 获取整个高度
     */
    getShapeFullHeight() {
        const { y: fullHeight } = this._parsePoint({
            y: this.endRange,
            x: 0,
        });
        const { y: minHeight } = this._parsePoint({
            y: this.startRange,
            x: 0,
        });
        return Math.abs(fullHeight - minHeight);
    }

    /**
     * 获取下中
     */
    getBottomPoint() {
        // 当前最小的项
        return this._parsePoint({
            x: getCenterXByRectPoints(this.points),
            // y0
            y: this.points[0].y,
        });
    }

    getStartBottomPoint() {
        return this._parsePoint({
            x: getCenterXByRectPoints(this.points),
            // y0
            y: this.startRange,
        });
    }
}

function getCenterXByRectPoints(points) {
    let sumX = 0;
    let minX = Infinity;
    points.forEach(function (p) {
        if (p.x < minX) {
            minX = p.x;
        }

        sumX += p.x;
    });
    return sumX / points.length;
}
