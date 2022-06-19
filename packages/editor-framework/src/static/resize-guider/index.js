import utils from '../../utils/utils';
import { transformResize } from '../../utils/resize-element';
import template from './template.html';

export default {
    name: 'resize-guider',
    template,
    props: ['global', 'model', 'layout', 'options'],
    data() {
        return {
            offset: 5,
            ySideStyles: [],
            xSideStyles: [],
        };
    },
    watch: {
        model(v) {
            !v && this.clear();
        },
    },
    computed: {
        editor() {
            return this.$parent;
        },
        zoom() {
            return this.global.zoom;
        },
    },
    methods: {
        clear() {
            // reset
            if (this.model && this.model.$guider) {
                delete this.model.$guider.resizeActive;
                delete this.model.$guider.dx;
                delete this.model.$guider.dy;
            }

            this.alignIndexs = null;
            this.bboxList = null;
            this.bboxListCache = null;

            this.xSideStyles = [];
            this.ySideStyles = [];
        },
        getOffset({ width, height }) {
            const offset = {};
            offset.y = width * this.zoom > 40 ? 5 : 4;
            offset.x = height * this.zoom > 40 ? 5 : 4;

            offset.y /= this.zoom;
            offset.x /= this.zoom;

            return offset;
        },
        getBBox(_rect) {
            const rect = utils.getBBox(_rect);
            rect.right = rect.left + rect.width;
            rect.bottom = rect.top + rect.height;
            rect.id = _rect.$id || Math.random();
            rect.type = _rect.type;
            return rect;
        },
        getPoints(bbox) {
            const height = bbox.height;
            const width = bbox.width;
            const left = bbox.left;
            const top = bbox.top;

            // 上 中 下 左 中 右 共六条线
            return {
                dataX: [left, left + width / 2, left + width],
                dataY: [top, top + height / 2, top + height],
            };
        },
        getBBoxList() {
            const { model, layout } = this;
            const elements = this.editor._getOperateModeElements(layout).filter((el) => !el.hidden);

            if (!model || !elements || !elements.length) {
                return;
            }

            // 剔除自身 && 剔除选中
            return elements
                .filter((element) => element !== model && !element.$selected)
                .map((element) => this.getBBox(element));
        },
        isText(rect) {
            return rect.type === 'text' || rect.type === 'threeText';
        },
        getGuideStates(boxA, boxB, bboxIndex, axis) {
            const isAllText = this.isText(boxA) && this.isText(boxB);
            const positionsA = this.getPoints(boxA);
            const positionsB = this.getPoints(boxB);
            // 4 个数据分别表示 最小水平距离差值 最小竖直距离差值 水平线的背景依赖 竖直线的背景依赖
            const guiderStates = [];
            const offset = this.offset / this.zoom;
            let distance;

            // 因为元素包含在 layout 矩形中，所以结果一直都是0
            // 所以需要用 layout 的中心点去计算距离
            if (bboxIndex === 0) {
                distance = utils.getMinDistanceByPoint(
                    {
                        x: boxB.width / 2,
                        y: boxB.height / 2,
                    },
                    boxA,
                );
            } else {
                distance = utils.getMinDistanceByPoint(
                    {
                        x: boxA.left + boxA.width / 2,
                        y: boxA.top + boxA.height / 2,
                    },
                    boxB,
                );
            }

            const i = this.alignIndexs[axis === 'x' ? 0 : 1];

            // 0-左/上 | 1=中 | 2=右/下
            for (let j = 0; j < 3; j++) {
                const xMinDiff = positionsA.dataX[i] - positionsB.dataX[j];
                const yMinDiff = positionsA.dataY[i] - positionsB.dataY[j];

                // 文本的四边界线，不与其他文本的中心线对齐
                const valid = !isAllText || (j !== 1 && i !== 1) || (j === 1 && i === 1);

                if (valid && (Math.abs(xMinDiff) < offset || Math.abs(yMinDiff) < offset)) {
                    guiderStates.push({
                        distance,
                        xMinDiff,
                        yMinDiff,
                        xAlignIndex: j,
                        yAlignIndex: j,
                        bboxIndex,
                    });
                }
            }

            return guiderStates;
        },
        getModelBBox(drag) {
            let { dx, dy, left, top } = drag;

            if (drag.dir.indexOf('w') > -1) {
                dx *= -1;
                left -= dx;
            }
            if (drag.dir.indexOf('n') > -1) {
                dy *= -1;
                top -= dy;
            }

            const rect = {
                left,
                top,
                width: drag.width + dx,
                height: drag.height + dy,
                right: left + drag.width + dx,
                bottom: top + drag.height + dy,
            };

            return rect;
        },
        getValidInfo(modelBBox, axis) {
            let i = 0;
            const result = {};
            const { bboxList } = this;
            const offset = this.offset / this.zoom;
            const guiderStates = bboxList.reduce((r, bbox) => {
                return r.concat(this.getGuideStates(modelBBox, bbox, i++, axis));
            }, []);

            guiderStates
                .sort((a, b) => a.distance - b.distance)
                .some((state) => {
                    const points = this.getPoints(bboxList[state.bboxIndex]);

                    if (axis === 'x' && Math.abs(state.xMinDiff) < offset) {
                        result.hitBBox = bboxList[state.bboxIndex];
                        result.linePoint = points.dataX[state.xAlignIndex];
                        result.diff = state.xMinDiff;
                        return true;
                    }

                    if (axis === 'y' && Math.abs(state.yMinDiff) < offset) {
                        result.hitBBox = bboxList[state.bboxIndex];
                        result.linePoint = points.dataY[state.yAlignIndex];
                        result.diff = state.yMinDiff;
                        return true;
                    }

                    return false;
                });

            return result;
        },

        checkAxisGuidePoints(modelBBox, drag, axis) {
            const { model } = this;
            const { hitBBox, linePoint, diff } = this.getValidInfo(modelBBox, axis);

            if (!hitBBox) return;

            if (axis === 'x') {
                model.$guider.resizeActive = true;

                // 避免过多小数位导致精度计算问题, 导致抖动
                model.$guider.dx = drag.dx.toFixed(3) - diff.toFixed(3);

                // 同比放大时需按比例计算出 $guider.dx
                if (drag.dir.length > 1) {
                    const radio = drag.height / drag.width;
                    const height = (model.$guider.dx + drag.width) * radio;
                    const dy = (height - drag.height) * (['sw', 'ne'].includes(drag.dir) ? -1 : 1);
                    model.$guider.dy = drag.noSyncRatio ? drag.dy : dy;
                }

                return { hitBBox, linePoint, diff };
            }

            if (axis === 'y') {
                model.$guider.resizeActive = true;
                // 避免过多小数位导致精度计算问题, 导致抖动
                model.$guider.dy = drag.dy.toFixed(3) - diff.toFixed(3);

                // 同比放大时需按比例计算出 $guider.dx
                if (drag.dir.length > 1) {
                    const radio = drag.width / drag.height;
                    const width = (model.$guider.dy + drag.height) * radio;
                    const dx = (width - drag.width) * (['sw', 'ne'].includes(drag.dir) ? -1 : 1);
                    model.$guider.dx = drag.noSyncRatio ? drag.dx : dx;
                }

                return { hitBBox, linePoint, diff };
            }
        },
        setLineData(hitBBox, linePoint, axis) {
            const layout = this.layout;
            const modelBBox = this.getBBox(this.model);
            let styles = [];

            if (hitBBox.isSide && axis === 'x') {
                const width = Math.max(0, (layout.width - modelBBox.width) / 2);
                const data = {
                    width,
                    top: modelBBox.top,
                    height: modelBBox.height,
                    isSide: true,
                };

                styles = [
                    {
                        left: 0,
                        value: Math.round(width / this.global.zoom),
                        ...data,
                    },
                    {
                        left: modelBBox.right,
                        ...data,
                    },
                ];

                this.xSideStyles = styles;
            } else if (hitBBox.isSide && axis === 'y') {
                const height = Math.max(0, (layout.height - modelBBox.height) / 2);
                const data = {
                    height,
                    width: modelBBox.width,
                    left: modelBBox.left,
                    isSide: true,
                };

                styles = [
                    {
                        top: 0,
                        value: Math.round(height / this.global.zoom),
                        ...data,
                    },
                    {
                        top: modelBBox.bottom,
                        ...data,
                    },
                ];

                this.ySideStyles = styles;
            } else if (axis === 'x') {
                const lineStart = Math.min(hitBBox.top, modelBBox.top);
                const lineEnd = Math.max(hitBBox.bottom, modelBBox.bottom);

                styles = [
                    {
                        height: lineEnd - lineStart,
                        left: linePoint,
                        top: layout.top + lineStart,
                    },
                ];

                this.ySideStyles = styles;
            } else if (axis === 'y') {
                const lineStart = Math.min(hitBBox.left, modelBBox.left);
                const lineEnd = Math.max(hitBBox.right, modelBBox.right);

                styles = [
                    {
                        width: lineEnd - lineStart,
                        left: lineStart,
                        top: layout.top + linePoint,
                    },
                ];

                this.xSideStyles = styles;
            }

            styles.forEach((item) => {
                for (const k in item) {
                    if (k === 'isSide' || k === 'value') {
                        continue;
                    }
                    item[k] = item[k] * this.zoom + 'px';
                }
            });
        },
        addBothSideLine(modelBBox, drag) {
            const layout = this.layout;
            const left = layout.width - modelBBox.right;
            const right = layout.width - modelBBox.left;
            const top = layout.height - modelBBox.bottom;
            const bottom = layout.height - modelBBox.top;
            const bboxs = [];

            const isE = drag.dir === 'e';
            const isW = drag.dir === 'w';
            const isN = drag.dir === 's';
            const isS = drag.dir === 'n';

            if (isE || isW) {
                const bbox = this.getBBox({
                    left: isE ? right : left,
                    width: 0,
                    top: modelBBox.top,
                    height: modelBBox.height,
                    rotate: 0,
                });
                bbox.isSide = true;
                bboxs.push(bbox);
            } else if (isS || isN) {
                const bbox = this.getBBox({
                    top: isN ? bottom : top,
                    height: 0,
                    left: modelBBox.left,
                    width: modelBBox.width,
                    rotate: 0,
                });
                bbox.isSide = true;
                bboxs.push(bbox);
            }

            return bboxs;
        },
        checkGuidePoints(drag) {
            const { bboxList, alignIndexs, model } = this;
            const offset = this.offset / this.zoom;
            const modelBBox = this.getModelBBox(drag);

            if (modelBBox.width <= offset || modelBBox.height <= offset) {
                return;
            }

            const bboxs = this.addBothSideLine(modelBBox, drag);
            this.bboxList = bboxList.concat(bboxs);

            this.xSideStyles = [];
            this.ySideStyles = [];

            // 为true时全局的 transformResize 将被阻断
            this.model.$guider.resizeActive = false;
            this.model.$guider.dx = drag.dir.length > 1 ? 0 : null;
            this.model.$guider.dy = drag.dir.length > 1 ? 0 : null;

            const xResult =
                alignIndexs[0] !== -1 && this.checkAxisGuidePoints(modelBBox, drag, 'x');
            const yResult =
                alignIndexs[1] !== -1 && this.checkAxisGuidePoints(modelBBox, drag, 'y');

            if (model.$guider && model.$guider.resizeActive) {
                drag = Object.assign({}, drag);
                drag.dx = model.$guider.dx !== null ? model.$guider.dx : drag.dx;
                drag.dy = model.$guider.dy !== null ? model.$guider.dy : drag.dy;
                transformResize.call(this.editor, model, drag, this.options);
            }

            !yResult && xResult && this.setLineData(xResult.hitBBox, xResult.linePoint, 'x');
            yResult && this.setLineData(yResult.hitBBox, yResult.linePoint, 'y');
        },
    },
    events: {
        'element.transformStart'(model, { action, dir }) {
            if (
                action !== 'resize' ||
                !model.$guider.show ||
                model.rotate !== 0 ||
                ['arrow', 'line'].includes(model.type)
            )
                return;

            // [x, y]
            // 0, 1, 2 上中下、左中右, -1代表无效的值
            this.alignIndexs = {
                s: [-1, 2],
                n: [-1, 0],
                e: [2, -1],
                w: [0, -1],
                se: [2, 2],
                sw: [0, 2],
                nw: [0, 0],
                ne: [2, 0],
            }[dir];

            this.bboxListCache = this.getBBoxList();
        },
        'element.transformResizeBefore'(drag, model) {
            if (model.type === 'text' && drag.dir.length === 2) return;
            if (!this.bboxListCache) return;
            if (model === this.model && model.$guider.resizeShow && !drag.event.shiftKey) {
                this.bboxList = this.bboxListCache;
                this.checkGuidePoints(drag);
            } else {
                this.clear();
            }
        },
        'element.transformEnd'() {
            this.clear();
        },
    },
    beforeDestroy() {
        this.$emit('destroy');
    },
};
