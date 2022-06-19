import utils from '../../utils/utils';

export default {
    data() {
        return {
            margin: {
                yStyles: [],
                xStyles: [],
                xStates: [],
                yStates: [],
                bboxList: [],
            },
        };
    },
    methods: {
        clearMarginStyles() {
            this.margin.xStyles = [];
            this.margin.yStyles = [];
        },
        clearMarginGuider() {
            this.margin.bboxList = [];
            this.margin.yStates = [];
            this.margin.xStates = [];
            this.margin.xStyles = [];
            this.margin.yStyles = [];

            if (this.model && this.model.$guider) {
                delete this.model.$guider.marginActive;
            }
        },

        getMarginBBoxList() {
            const { model, layout } = this;
            const elements = this.editor._getOperateModeElements(layout).filter((el) => !el.hidden);

            if (!model || !elements || !elements.length) {
                return;
            }

            const layoutElements = [
                {
                    type: 'layout',
                    id: Math.random(),
                    width: layout.width,
                    height: 0,
                    left: 0,
                    top: 0,
                    rotate: 0,
                },
                {
                    type: 'layout',
                    id: Math.random(),
                    width: layout.width,
                    top: layout.height,
                    height: 0,
                    left: 0,
                    rotate: 0,
                },
                {
                    type: 'layout',
                    id: Math.random(),
                    height: layout.height,
                    width: 0,
                    left: 0,
                    top: 0,
                    rotate: 0,
                },
                {
                    type: 'layout',
                    id: Math.random(),
                    height: layout.height,
                    left: layout.width,
                    width: 0,
                    top: 0,
                    rotate: 0,
                },
            ];

            // const isText = this.isText(this.model);
            const rects = elements
                .concat(layoutElements)
                // 剔除自身 && 剔除选中
                .filter((element) => {
                    if (element === model || element.$selected) return false;
                    if (
                        element.type !== 'layout' &&
                        !(
                            element.top < layout.height &&
                            element.top + element.height > 0 &&
                            element.left < layout.width &&
                            element.left + element.width > 0
                        )
                    )
                        return false;

                    return true;
                })
                // .filter(element => isText ? this.isText(element) : !this.isText(element))
                .map((element) => this.getBBox(element));

            return rects;
        },

        getBBoxByRects(rects) {
            let top = Infinity;
            let left = Infinity;
            let right = -Infinity;
            let bottom = -Infinity;

            rects.forEach((bbox) => {
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
                height: bottom - top,
                width: right - left,
                left: left,
                top: top,
                right,
                bottom,
            };
        },

        // 等边距吸附的所有可能位置
        getMayMarginStates(axis) {
            const bboxList = this.margin.bboxList;
            const modelRect = this.getBBox(this.model);

            const cache = {};
            const rects = [];
            const MIN_NUM = 10;

            const alignKey = axis === 'x' ? 'left' : 'top';
            const alignKey2 = axis === 'x' ? 'right' : 'bottom';
            const sizeKey = axis === 'x' ? 'width' : 'height';

            const resetModelRect = (rect1, rect2) => {
                const alignKey = axis === 'x' ? 'top' : 'left';
                const alignKey2 = axis === 'x' ? 'bottom' : 'right';
                const sizeKey = axis === 'x' ? 'height' : 'width';

                const maxRight = Math.max(rect1[alignKey2], rect2[alignKey2]);
                const minLeft = Math.min(rect1[alignKey], rect2[alignKey]);

                modelRect[alignKey] = (maxRight - minLeft - modelRect[sizeKey]) / 2 + minLeft;
                modelRect[alignKey2] = modelRect[alignKey] + modelRect[sizeKey];
            };

            bboxList.forEach((rect1) => {
                bboxList.forEach((rect2) => {
                    if (cache[rect1.id + '-' + rect2.id]) return;
                    cache[rect1.id + '-' + rect2.id] = true;
                    cache[rect2.id + '-' + rect1.id] = true;

                    resetModelRect(rect1, rect2);
                    const isCollide = utils.checkRectCollide(rect1, rect2, axis);
                    // 判断上下又不满足交叉，但是 modelRect 出现在中间三者满足交叉的情况
                    const isCollide2 = utils.checkRectCollide(rect1, modelRect, axis);
                    const isCollide3 = utils.checkRectCollide(rect2, modelRect, axis);

                    if (isCollide || isCollide2 || isCollide3) {
                        const minRight = Math.min(rect1[alignKey2], rect2[alignKey2]);
                        const maxRight = Math.max(rect1[alignKey2], rect2[alignKey2]);
                        const minLeft = Math.min(rect1[alignKey], rect2[alignKey]);
                        const maxLeft = Math.max(rect1[alignKey], rect2[alignKey]);

                        const distance = maxLeft - minRight;
                        const middleDistance = (distance - modelRect[sizeKey]) / 2;
                        const canAddMiddle = distance - modelRect[sizeKey] >= MIN_NUM;

                        isCollide &&
                            rects.push(
                                {
                                    // point: modelRect位于两者左侧时 model.left 对应的值
                                    distance,
                                    position: minLeft - distance - modelRect[sizeKey],
                                    rect: rect1[alignKey] === minLeft ? rect1 : rect2,
                                    check: (modelRect) =>
                                        utils.checkRectCollide(
                                            modelRect,
                                            rect1[alignKey] === minLeft ? rect1 : rect2,
                                            axis,
                                        ),
                                },
                                {
                                    // point: modelRect位于两者右侧时 model.left 对应的值
                                    distance,
                                    position: maxRight + distance,
                                    rect: rect1[alignKey2] === maxRight ? rect1 : rect2,
                                    check: (modelRect) =>
                                        utils.checkRectCollide(
                                            modelRect,
                                            rect1[alignKey2] === maxRight ? rect1 : rect2,
                                            axis,
                                        ),
                                },
                            );

                        canAddMiddle &&
                            rects.push({
                                isMiddle: true,
                                // point: modelRect位于两者中间时 model.left 对应的值
                                distance: middleDistance,
                                position: minRight + middleDistance,
                                rects: [rect1, rect2],
                                check: (modelRect) =>
                                    utils.checkRectCollide(modelRect, rect1, axis) &&
                                    utils.checkRectCollide(modelRect, rect2, axis),
                            });
                    }
                });
            });

            return rects;
        },

        // 获取最佳的吸附位置
        getBestMarginState(axis) {
            const modelRect = this._marginModelRect;
            const offsetValue = this.getOffset(modelRect)[axis];
            const statesKey = axis === 'x' ? 'xStates' : 'yStates';
            const alignKey = axis === 'x' ? 'left' : 'top';
            let bestState = null;

            // 获取匹配度最高的吸附位置
            this.margin[statesKey].forEach((item) => {
                const isCollide = item.check(modelRect);
                const curDistance = Math.abs(item.position - modelRect[alignKey]);
                if (!isCollide || curDistance > offsetValue) return;

                const minDistance = bestState
                    ? Math.abs(bestState.position - modelRect[alignKey])
                    : 0;

                if (!bestState || minDistance > curDistance) {
                    bestState = item;
                } else if (bestState && minDistance === curDistance) {
                    bestState = bestState.distance > item.distance ? item : bestState;
                }
            });

            if (!bestState) return {};

            return {
                distance: bestState.position - modelRect[alignKey],
                bestState,
            };
        },

        addMarginGuiderStyles(rect1, rect2, distance, axis) {
            if (axis === 'x') {
                let minTop = Math.min(rect1.top, rect2.top);
                let maxBottom = Math.max(rect1.bottom, rect2.bottom);
                const minRight = Math.min(rect1.right, rect2.right);

                if (rect1.type === 'layout') {
                    minTop = rect2.top;
                    maxBottom = rect2.bottom;
                } else if (rect2.type === 'layout') {
                    minTop = rect1.top;
                    maxBottom = rect1.bottom;
                }

                const style = {
                    top: minTop,
                    height: maxBottom - minTop,
                    left: minRight,
                    width: distance,
                    value: Math.round(distance),
                };
                style.right = style.left + style.width;
                style.bottom = style.top + style.height;

                this.margin.xStyles.push(style);
            } else {
                let maxRight = Math.max(rect1.right, rect2.right);
                const minBottom = Math.min(rect1.bottom, rect2.bottom);
                let minLeft = Math.min(rect1.left, rect2.left);

                if (rect1.type === 'layout') {
                    minLeft = rect2.left;
                    maxRight = rect2.right;
                } else if (rect2.type === 'layout') {
                    minLeft = rect1.left;
                    maxRight = rect1.right;
                }

                const style = {
                    left: minLeft,
                    top: minBottom,
                    width: maxRight - minLeft,
                    height: distance,
                    value: Math.round(distance),
                };
                style.right = style.left + style.width;
                style.bottom = style.top + style.height;

                this.margin.yStyles.push(style);
            }
        },

        // 将同一位置的参考线合并BBox
        mergeMarginGuiderStyles(axis) {
            const alignKey = axis === 'x' ? 'left' : 'top';
            const sizeKey = axis === 'x' ? 'width' : 'height';
            const styleKey = axis + 'Styles';
            const styles = this.margin[styleKey];
            this.margin[styleKey] = [];
            const newStylesMap = {};

            styles.forEach((styleA) => {
                const key = parseInt(styleA[alignKey]) + parseInt(styleA[sizeKey]);
                if (newStylesMap[key]) return;
                newStylesMap[key] = styles.filter(
                    (styleB) =>
                        parseInt(styleA[sizeKey]) === parseInt(styleB[sizeKey]) &&
                        parseInt(styleA[alignKey]) === parseInt(styleB[alignKey]),
                );
            });

            let minDistance = Infinity;
            let preRect = {};

            this.margin[styleKey] = Object.values(newStylesMap).map((rects) => {
                const rect = this.getBBoxByRects(rects);
                const distance = utils.getMinDistanceByPoint(
                    {
                        x: this._marginModelRect.left + this._marginModelRect.width / 2,
                        y: this._marginModelRect.top + this._marginModelRect.height / 2,
                    },
                    rect,
                );

                // 距离model最近的方可显示距离数值
                if (minDistance > distance) {
                    rect.value = rects[0].value;
                    minDistance = distance;
                    delete preRect.value;
                    preRect = rect;
                }
                return rect;
            });

            if (styles.length > 0) {
                this.model.$guider.marginActive = true;
            }
        },
        // 排序后，以 modelRect 为基准递减校验
        decrementCheckMarginGuider(bestState, preRect, startIndex, axis) {
            const {
                _marginSortRects: rects,
                decrementCheckMarginGuider,
                incrementalCheckMarginGuider,
            } = this;

            const alignKey = axis === 'x' ? 'left' : 'top';
            const alignKey2 = axis === 'x' ? 'right' : 'bottom';
            const curRect = rects[startIndex];

            if (!curRect) return;

            if (this._marginCacheMap[preRect.id + '' + curRect.id]) {
                decrementCheckMarginGuider(bestState, preRect, startIndex - 1, axis);
                return;
            }

            const distance = preRect[alignKey] - curRect[alignKey2];
            this._marginCacheMap[preRect.id + '' + curRect.id] = true;
            this._marginCacheMap[curRect.id + '' + preRect.id] = true;

            const isCollide = utils.checkRectCollide(preRect, curRect, axis);
            const isDistanceValid = Math.abs(distance - bestState.distance) < 0.5;

            // 允许 0.5 的误差
            if (
                isDistanceValid &&
                isCollide &&
                ((curRect.preRects && curRect.preRects.includes(preRect)) ||
                    (preRect.preRects && preRect.preRects.includes(curRect)))
            ) {
                this.addMarginGuiderStyles(curRect, preRect, distance, axis);

                incrementalCheckMarginGuider(bestState, curRect, startIndex + 1, axis);
                decrementCheckMarginGuider(bestState, curRect, startIndex - 1, axis);
            }
            decrementCheckMarginGuider(bestState, preRect, startIndex - 1, axis);
        },
        // 排序后，以 modelRect 为基准递增校验
        incrementalCheckMarginGuider(bestState, preRect, startIndex, axis) {
            const {
                _marginSortRects: rects,
                decrementCheckMarginGuider,
                incrementalCheckMarginGuider,
            } = this;

            const alignKey = axis === 'x' ? 'left' : 'top';
            const alignKey2 = axis === 'x' ? 'right' : 'bottom';

            const curRect = rects[startIndex];

            if (!curRect) return;

            if (this._marginCacheMap[preRect.id + '' + curRect.id]) {
                incrementalCheckMarginGuider(bestState, preRect, startIndex + 1, axis);
                return;
            }

            const distance = curRect[alignKey] - preRect[alignKey2];
            this._marginCacheMap[preRect.id + '' + curRect.id] = true;
            this._marginCacheMap[curRect.id + '' + preRect.id] = true;

            const isCollide = utils.checkRectCollide(preRect, curRect, axis);
            const isDistanceValid = Math.abs(distance - bestState.distance) < 0.5;

            if (
                isDistanceValid &&
                isCollide &&
                ((curRect.preRects && curRect.preRects.includes(preRect)) ||
                    (preRect.preRects && preRect.preRects.includes(curRect)))
            ) {
                this.addMarginGuiderStyles(curRect, preRect, distance, axis);

                decrementCheckMarginGuider(bestState, curRect, startIndex - 1, axis);
                incrementalCheckMarginGuider(bestState, curRect, startIndex + 1, axis);
            }
            incrementalCheckMarginGuider(bestState, preRect, startIndex + 1, axis);
        },

        getMarginSortRects(axis) {
            const alignKey = axis === 'x' ? 'left' : 'top';
            const alignKey2 = axis === 'x' ? 'right' : 'bottom';
            const modelRect = this._marginModelRect;
            const bboxList = this.margin.bboxList;

            // rects1: 处于model上方
            // rects2: 处于model下方
            const [rects1, rects2] = this.getMarginNearRectsList(modelRect, axis);
            const floatDiff = (a, b) => {
                return Math.abs(a.toFixed(3) - b.toFixed(3)) < 0.5;
            };

            const fn = (rects, dir) => {
                let nearRects = [modelRect];
                for (let i = 0; i < rects.length; i++) {
                    const curRect = rects[i];
                    // 两个元素平行时，push 到 nearRects
                    const isEqual = floatDiff(curRect[dir], nearRects[0][dir]);
                    const validPreRects = nearRects.filter((rect) =>
                        utils.checkRectCollide(curRect, rect, axis),
                    );

                    if (!validPreRects.length) {
                        isEqual && nearRects.push(curRect);
                        delete curRect.preRects;
                        continue;
                    }

                    curRect.preRects = validPreRects;
                    nearRects = isEqual ? nearRects.concat(curRect) : [curRect];
                }
            };

            fn(rects1, alignKey2);
            fn(rects2, alignKey);

            const rects = bboxList.concat(modelRect).sort((a, b) => a[alignKey2] - b[alignKey2]);
            return rects;
        },
        checkAxisMarginGuider(bestState, axis) {
            this._marginCacheMap = {};
            this._marginSortRects = [];

            const alignKey = axis === 'x' ? 'left' : 'top';
            const alignKey2 = axis === 'x' ? 'right' : 'bottom';
            const modelRect = this._marginModelRect;
            const distance = bestState.position - modelRect[alignKey];

            modelRect[alignKey] += distance;
            modelRect[alignKey2] += distance;

            const rects = this.getMarginSortRects(axis);
            this._marginSortRects = rects;
            const modelRectIndex = rects.indexOf(modelRect);

            this.decrementCheckMarginGuider(bestState, modelRect, modelRectIndex - 1, axis);
            this.incrementalCheckMarginGuider(bestState, modelRect, modelRectIndex + 1, axis);

            const styleKey = axis + 'Styles';
            if (this.margin[styleKey].length > 1) {
                this.model[alignKey] += distance;
            } else {
                this.margin[styleKey] = [];
            }
        },
        checkMarginGuider({ xBestState, yBestState }) {
            if (!this.margin.bboxListCache) return;
            // 更新 modelRect，lineGuider 在这之前可能进行吸附了
            const modelRect = (this._marginModelRect = this.getBBox(this.model));

            // 忽略与 model 产生重叠的元素
            this.margin.bboxList = this.margin.bboxListCache.filter((item) => {
                return !utils.checkRectAllCollide(item, modelRect);
            });

            this.margin.xStyles = [];
            if (xBestState) {
                this.checkAxisMarginGuider(xBestState, 'x');
                this.mergeMarginGuiderStyles('x');
            }

            this.margin.yStyles = [];
            if (yBestState) {
                this.checkAxisMarginGuider(yBestState, 'y');
                this.mergeMarginGuiderStyles('y');
            }
        },
        // 获取按两端距离排序的 rects
        getMarginNearRectsList(rect, axis, needCheckCollide = true) {
            const alignKey = axis === 'x' ? 'left' : 'top';
            const alignKey2 = axis === 'x' ? 'right' : 'bottom';
            // 处于model上方
            const rects1 = [];
            // 处于model下方
            const rects2 = [];

            this.margin.bboxList.forEach((item) => {
                if (needCheckCollide && !utils.checkRectCollide(rect, item, axis)) return;

                if (item[alignKey] > rect[alignKey]) {
                    item._distance = item[alignKey] - rect[alignKey2];
                    rects2.push(item);
                } else {
                    item._distance = rect[alignKey] - item[alignKey2];
                    rects1.push(item);
                }
            });

            rects1.sort((a, b) => a._distance - b._distance);
            rects2.sort((a, b) => a._distance - b._distance);

            return [rects1, rects2];
        },
        // 获取两端距离 rect 最近的参照元素
        getMarginNearRects(rect, axis) {
            const result = [];
            const rectLists = this.getMarginNearRectsList(rect, axis);
            rectLists[0][0] && result.push(rectLists[0][0]);
            rectLists[1][0] && result.push(rectLists[1][0]);
            return result;
        },
        getMarginGuiderInfo() {
            this.model.$guider.marginActive = false;
            const modelRect = (this._marginModelRect = this.getBBox(this.model));

            // 必须以同轴最接近的元素为起始点
            const xNearRects = this.getMarginNearRects(modelRect, 'x');
            const yNearRects = this.getMarginNearRects(modelRect, 'y');

            const filterStates = (states, minDistanceRects) => {
                return states.filter((state) => {
                    let { rects, rect } = state;
                    rects = rects || [rect];
                    // model 在两个 rect 之间，必须保证这两个都满足 model 两端最为接近
                    return state.isMiddle
                        ? minDistanceRects.every((item) => rects.includes(item))
                        : minDistanceRects.some((item) => rects.includes(item));
                });
            };

            let xDistance, xBestState, yDistance, yBestState;
            if (xNearRects.length && xNearRects.find((item) => item.type !== 'layout')) {
                this.margin.xStates = filterStates(this.margin.xStatesCache, xNearRects);
                const { distance, bestState } = this.getBestMarginState('x');
                xDistance = distance;
                xBestState = bestState;
            }

            if (yNearRects.length && yNearRects.find((item) => item.type !== 'layout')) {
                this.margin.yStates = filterStates(this.margin.yStatesCache, yNearRects);
                const { distance, bestState } = this.getBestMarginState('y');

                yDistance = distance;
                yBestState = bestState;
            }

            return {
                distance: {
                    x: xDistance,
                    y: yDistance,
                },
                xBestState,
                yBestState,
            };
        },
    },
};
