import utils from '../../utils/utils';

const HIDE_OFFSET = -10;
const resetData = function (dir) {
    if (!dir || dir === 'x') {
        this.xLines = {
            0: [HIDE_OFFSET, 0, 0],
            1: [HIDE_OFFSET, 0, 0],
            2: [HIDE_OFFSET, 0, 0],
        };

        this.xIsLayouts = { 0: false, 1: false, 2: false };
    }

    if (!dir || dir === 'y') {
        // 垂直线三个参数分别表示 线到画布左边界距离 起始点距上边界距离 长度
        this.yLines = {
            0: [HIDE_OFFSET, 0, 0],
            1: [HIDE_OFFSET, 0, 0],
            2: [HIDE_OFFSET, 0, 0],
        };

        this.yIsLayouts = { 0: false, 1: false, 2: false };
    }
};

export default {
    data() {
        const obj = {
            // 水平线三个参数分别表示 线到画布上边界距离 起始点距左边界距离 长度
            xLines: {},
            // 垂直线三个参数分别表示 线到画布左边界距离 起始点距上边界距离 长度
            yLines: {},
            // 水平线对齐的是否是画布
            xIsLayouts: {
                0: false,
                1: false,
                2: false,
            },
            // 垂直线对齐的是否是画布
            yIsLayouts: {
                0: false,
                1: false,
                2: false,
            },
        };
        resetData.call(obj);
        return obj;
    },
    computed: {
        // 水平线样式
        xStyles() {
            return Object.keys(this.xLines).map((key, i) => {
                const xLine = this.xLines[key];
                // layout为参考线时，右两侧保证吸血线不多出1px
                const selfHeight =
                    this.xIsLayouts[i] && xLine[0] > this.layout.width / 2 + 1 ? 1 : 0;
                return {
                    display: xLine[0] >= 0 ? 'block' : 'none',
                    top: this.zoom * xLine[0] - selfHeight + 'px',
                    left: this.zoom * xLine[1] + 'px',
                    width: this.zoom * xLine[2] + 'px',
                };
            });
        },
        // 垂直线样式
        yStyles() {
            return Object.keys(this.yLines).map((key, i) => {
                const yLine = this.yLines[key];
                // layout为参考线时，下侧保证吸血线不多出1px
                const selfWidth =
                    this.xIsLayouts[i] && yLine[0] > this.layout.height / 2 + 1 ? 1 : 0;
                return {
                    display: yLine[0] >= 0 ? 'block' : 'none',
                    left: this.zoom * yLine[0] - selfWidth + 'px',
                    top: this.zoom * yLine[1] + 'px',
                    height: this.zoom * yLine[2] + 'px',
                };
            });
        },
    },
    methods: {
        getLineOffset(rect) {
            const result = {};
            const offset = this.getOffset(rect);
            result.x = offset.y;
            result.y = offset.x;
            return result;
        },
        clearLineStyles() {
            resetData.call(this);
        },
        clearLineGuider() {
            // reset
            this.bboxList = [];
            resetData.call(this);
        },
        getLineBBoxList() {
            const { model, layout, currentElement } = this;
            const elements = this.editor._getOperateModeElements(layout).filter((el) => !el.hidden);
            if (!model || !elements || !elements.length) {
                return;
            }

            // 加上画布中线和边线
            const list = [
                {
                    rotate: 0,
                    height: layout.height,
                    width: layout.width,
                    left: 0,
                    top: 0,
                },
            ];

            const selector =
                currentElement && currentElement.type === '$selector' ? [currentElement] : [];

            return (
                list
                    .concat(elements)
                    .concat(selector)
                    // 剔除自身 && 剔除选中
                    .filter((element) => element !== model && !element.$selected)
                    .map((element) => {
                        const bbox = this.getBBox(element);
                        return bbox;
                    })
            );
        },
        getPoints(bbox) {
            const height = bbox.height;
            const width = bbox.width;
            const left = bbox.left;
            const top = bbox.top;

            // 上 中 下 左 中 右 共六条线
            return {
                dataX: [top, top + height / 2, top + height],
                dataY: [left, left + width / 2, left + width],
            };
        },
        getMayLineStates(modelBBox, boxB, bboxIndex) {
            const boxA = modelBBox;
            const isAllText = this.isText(boxA) && this.isText(boxB);
            const positionsA = this.getPoints(boxA);
            const positionsB = this.getPoints(boxB);
            // 4 个数据分别表示 最小水平距离差值 最小竖直距离差值 水平线的背景依赖 竖直线的背景依赖
            const guiderStates = [];
            const offset = this.getLineOffset(modelBBox);
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

            // 0-左/上 | 1=中 | 2=右/下
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    const xMinDiff = positionsA.dataX[i] - positionsB.dataX[j];
                    const yMinDiff = positionsA.dataY[i] - positionsB.dataY[j];

                    // 文本的四边界线，不与其他文本的中心线对齐
                    const valid = !isAllText || (j !== 1 && i !== 1) || (j === 1 && i === 1);
                    if (valid && (Math.abs(xMinDiff) < offset.x || Math.abs(yMinDiff) < offset.y)) {
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
            }

            return guiderStates;
        },
        getBestLineStates() {
            let i = 0;
            const { bboxList } = this;
            const modelBBox = this._lineModelRect;
            const offset = this.getLineOffset(modelBBox);
            const guiderStates = bboxList.reduce((r, bbox) => {
                return r.concat(this.getMayLineStates(modelBBox, bbox, i++));
            }, []);

            this.guiderLineStates = guiderStates;

            // 根据两者距离升序排列
            guiderStates.sort((a, b) => {
                const bboxA = bboxList[a.bboxIndex];
                const bboxB = bboxList[b.bboxIndex];
                let distanceA = a.distance;
                let distanceB = b.distance;

                // type 不存在说明是画布线
                // 画布 x、y 的中心线优先吸附
                if (!bboxA.type && a.yAlignIndex === 1) {
                    distanceA = 0;
                }
                if (!bboxB.type && a.yAlignIndex === 1) {
                    distanceB = 0;
                }
                return distanceA - distanceB;
            });

            const getStates = (axis) => {
                const uniqMap = {};
                return guiderStates.filter((state) => {
                    const points = this.getPoints(bboxList[state.bboxIndex]);
                    const minDiff = state[axis + 'MinDiff'];
                    const alignIndex = state[axis + 'AlignIndex'];
                    // dataX/dataY
                    const dataKey = 'data' + axis.toLocaleUpperCase();
                    const value = Math.round(points[dataKey][alignIndex]);

                    state[axis + 'PixelValue'] = value;

                    if (Math.abs(minDiff) >= offset[axis]) return false;

                    // 去重，同一位置不允许多条线
                    if (!uniqMap[value]) {
                        uniqMap[value] = state;
                        return true;
                    }

                    return false;
                });
            };

            const xBestStates = getStates('x');
            const yBestStates = getStates('y');

            return {
                xBestStates,
                yBestStates,
            };
        },
        checkLineGuider({ xBestStates, yBestStates }) {
            const modelBBox = this._lineModelRect;
            const offset = this.getLineOffset(modelBBox);

            const guiderXState = xBestStates && xBestStates[0];
            const guiderYState = yBestStates && yBestStates[0];

            const xValid = guiderXState && Math.abs(guiderXState.xMinDiff) < offset.x;
            const yValid = guiderYState && Math.abs(guiderYState.yMinDiff) < offset.y;

            const { bboxList, layout, model } = this;

            model.top -= xValid ? guiderXState.xMinDiff : 0;
            model.left -= yValid ? guiderYState.yMinDiff : 0;

            // 设置样式位置时，交由外部控制
            // 可能 marginGuider 吸附之后 modelBBox 被更新，
            // 此时计算线的位置就不够准确
            return () => {
                const modelBBox = this.getBBox(model);

                if (xValid) {
                    xBestStates.forEach((item, i) => {
                        const hitBox = bboxList[item.bboxIndex];
                        // 延长线段
                        const lefts = [modelBBox.left, hitBox.left];
                        const rights = [modelBBox.right, hitBox.right];

                        this.guiderLineStates.forEach((state) => {
                            if (item.xPixelValue === state.xPixelValue) {
                                const box = bboxList[state.bboxIndex];
                                lefts.push(box.left);
                                rights.push(box.right);
                            }
                        });

                        if (Math.abs(item.xMinDiff - guiderXState.xMinDiff) < 0.5) {
                            const lineStart = Math.min(...lefts);
                            const lineEnd = Math.max(...rights);
                            const top = this.getPoints(hitBox).dataX[item.xAlignIndex];

                            this.xLines[i] = [top + layout.top, lineStart, lineEnd - lineStart];
                            this.xIsLayouts[i] = item.bboxIndex === 0;
                        }
                    });
                }

                if (yValid) {
                    yBestStates.forEach((item, i) => {
                        const hitBox = bboxList[item.bboxIndex];
                        const tops = [modelBBox.top, hitBox.top];
                        const bottoms = [modelBBox.bottom, hitBox.bottom];
                        // 延长线段
                        this.guiderLineStates.forEach((state) => {
                            if (item.yPixelValue === state.yPixelValue) {
                                const box = bboxList[state.bboxIndex];
                                tops.push(box.top);
                                bottoms.push(box.bottom);
                            }
                        });

                        if (Math.abs(item.yMinDiff - guiderYState.yMinDiff) < 0.5) {
                            const lineStart = Math.min(...tops);
                            const lineEnd = Math.max(...bottoms);
                            const left = this.getPoints(hitBox).dataY[item.yAlignIndex];

                            this.yLines[i] = [left, lineStart + layout.top, lineEnd - lineStart];
                            this.yIsLayouts[i] = item.bboxIndex === 0;
                        }
                    });
                }
            };
        },
        getLineGuiderInfo() {
            resetData.call(this);
            this._lineModelRect = this.getBBox(this.model);
            let { xBestStates, yBestStates } = this.getBestLineStates();
            xBestStates = xBestStates.slice(0, 3);
            yBestStates = yBestStates.slice(0, 3);

            const distance = {
                y: xBestStates[0] && xBestStates[0].xMinDiff,
                x: yBestStates[0] && yBestStates[0].yMinDiff,
            };

            return {
                distance,
                xBestStates,
                yBestStates,
            };
        },
    },
};
