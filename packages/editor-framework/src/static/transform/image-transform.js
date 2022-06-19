import $ from '@gaoding/editor-utils/zepto';
import { assign, cloneDeep } from 'lodash';

import utils from '../../utils/utils';

import template from './image-transform.html';
import { setImageToFitRect, checkFullInclude } from '@gaoding/editor-utils/set-image-to-fit-rect';
import anime from 'animejs';
import { i18n } from '../../i18n';

const doc = $(document);
const MAX_RATIO = 3;
const MIN_RATIO = 0.5;

export default {
    name: 'image-transform',
    props: ['editor', 'model', 'parentModel', 'options'],
    template,
    data() {
        return {
            activeRotatorHeight: 0,
            action: {
                animation: false,
                draging: false,
                scale: false,
                rotate: false,
            },
            scaleInfo: {
                current: 1,
                default: 1,
                circle: 1,
            },
        };
    },
    computed: {
        elRadius() {
            return this.elWidth / 2;
        },
        elWidth() {
            return this.isSmallMode ? 28 : 38;
        },
        rotatorHeight() {
            const rotatorRadius = 11;
            const size = Math.min(this.model.width, this.model.height) * this.zoom;
            let lineH = size / 2 - rotatorRadius;
            lineH -= 0.1 * (lineH - this.elRadius);

            return Math.min(this.isSmallMode ? 33 : 53, lineH);
        },
        imageRotate() {
            const scaleVal = Math.round(
                this.model.transform.scale.x * this.model.transform.scale.y,
            );
            return (scaleVal * utils.radToDeg(this.model.imageTransform.rotation)) % 360;
        },
        rotate() {
            return this.mixModel.rotate + (this.imageRotate % 360);
        },

        zoom() {
            return this.editor.global.zoom;
        },
        isCrop() {
            return this.model.type.includes('$');
        },
        mixModel() {
            let { model } = this;

            // 可能存在多层嵌套，需拉平处理
            const parents = this.editor.getParentGroups(model);

            model = parents.concat(model).reduce((a, b) => {
                const result = utils.mergeTransform(a, b);
                return Object.assign({}, b, result);
            });

            model.parents = parents;
            model.rotate = (360 + utils.radToDeg(model.transform.rotation)) % 360;

            return model;
        },

        bgStyle() {
            const scaleInfo = this.scaleInfo;
            const zoom = this.action.scale ? scaleInfo.circle : 1;

            return {
                width: this.elWidth * zoom + 'px',
                height: this.elWidth * zoom + 'px',
                transform: `translate(-50%, -50%) rotate(${-this.mixModel.rotate}deg)`,
            };
        },

        // 用于抓握鼠标样式
        octant() {
            let rotate = 180 + this.rotate;
            rotate = ((rotate % 360) + 360) % 360;

            return Math.abs(Math.floor((rotate + 22.5) / 45)) % 8;
        },

        isMaxScaleLimit() {
            return this.scaleInfo.current >= MAX_RATIO;
        },
        isMinScaleLimit() {
            return this.scaleInfo.current <= MIN_RATIO;
        },

        scaleTip() {
            if (this.isMaxScaleLimit) {
                return i18n.$tsl('已达最大值');
            }

            if (this.scaleInfo.current < 1) {
                return i18n.$tsl('小于图框');
            }

            return Math.round(this.scaleInfo.current * 100) + '%';
        },

        isSmallMode() {
            const curElem = this.model;
            const width = curElem.width * this.zoom;
            const height = curElem.height * this.zoom;

            return width < 200 || height < 200;
        },
    },
    methods: {
        $tsl: i18n.$tsl,
        getCache() {
            const model = this.model;
            const cloneModel = Object.assign({}, cloneDeep(model), {
                $imageWidth: model.$imageWidth,
                $imageHeight: model.$imageHeight,
                $imageLeft: model.$imageLeft,
                $imageTop: model.$imageTop,
            });

            return {
                model: cloneModel,
                width: model.$imageWidth,
                height: model.$imageHeight,
                left: model.$imageLeft,
                top: model.$imageTop,
                rotate: utils.radToDeg(model.imageTransform.rotation),
            };
        },
        // 重置边界、宽高
        resetImageBounding(fn, drag, action) {
            const isRotating = drag && action === 'rotate';
            const setData = (data) => {
                this.model.$imageWidth = data.$imageWidth;
                this.model.$imageHeight = data.$imageHeight;
                this.model.$imageLeft = data.$imageLeft;
                this.model.$imageTop = data.$imageTop;
            };

            let model;
            if (isRotating) {
                const imageTransform = cloneDeep(drag.model.imageTransform);
                imageTransform.rotation = this.model.imageTransform.rotation;

                model = {
                    ...drag.model,
                    imageTransform,
                };

                // 改变旋转的中心点, 以框的中心点旋转
                const basePoint = { x: 0, y: 0 };
                const rotate = utils.radToDeg(imageTransform.rotation);

                const point = utils.getPointPosition(
                    basePoint,
                    {
                        x: drag.width / 2,
                        y: drag.height / 2,
                    },
                    rotate - drag.rotate,
                    0,
                    0,
                );

                const point2 = utils.getPointPosition(
                    basePoint,
                    {
                        x: -drag.left + model.width / 2,
                        y: -drag.top + model.height / 2,
                    },
                    rotate - drag.rotate,
                    0,
                    0,
                );

                model.$imageLeft = drag.left + point2.x - point.x;
                model.$imageTop = drag.top + point2.y - point.y;
            } else {
                model = Object.assign({}, this.model, {
                    $imageWidth: this.model.$imageWidth,
                    $imageHeight: this.model.$imageHeight,
                    $imageLeft: this.model.$imageLeft,
                    $imageTop: this.model.$imageTop,
                });
            }

            if (!isRotating && checkFullInclude(model)) {
                fn && fn();
                return;
            }

            const beforeModel = {
                finalScale: 1,
                height: model.$imageHeight,
                width: model.$imageWidth,
                left: model.$imageLeft,
                top: model.$imageTop,
            };
            setImageToFitRect(model, { ...beforeModel }, action);

            if (!fn) {
                setData(model);
                return;
            }

            this.action.animation = true;
            const time = Math.max(
                (Math.max(
                    Math.abs(model.$imageWidth - beforeModel.width),
                    Math.abs(model.$imageLeft - beforeModel.left),
                ) /
                    (model.$imageWidth / 2)) *
                    600,
                (Math.max(
                    Math.abs(model.$imageHeight - beforeModel.height),
                    Math.abs(model.$imageTop - beforeModel.top),
                ) /
                    (model.$imageHeight / 2)) *
                    600,
            );

            const update = () => {
                setData({
                    $imageWidth: beforeModel.width,
                    $imageHeight: beforeModel.height,
                    $imageLeft: beforeModel.left,
                    $imageTop: beforeModel.top,
                });
            };

            anime({
                targets: beforeModel,
                width: model.$imageWidth,
                height: model.$imageHeight,
                left: model.$imageLeft,
                top: model.$imageTop,
                duration: Math.min(600, Math.max(200, time)),
                delay: 0,
                easing: 'easeOutExpo',
                update,
                complete: () => {
                    update();
                    fn && fn();
                    this.action.animation = false;
                },
            });
        },
        initDrag(e) {
            const self = this;
            const { model, parentModel, mixModel, editor, zoom } = this;
            const parentsRotate = mixModel.rotate;

            if (e.button !== 0 || parentModel.$draging) {
                return;
            }

            const drag = (this.drag = {
                pageX: e.pageX,
                pageY: e.pageY,
                ...this.getCache(),
                move(e) {
                    e.preventDefault();

                    const dx = e.pageX - drag.pageX;
                    const dy = e.pageY - drag.pageY;
                    const dxy = utils.getDxyByAngle(dx, dy, parentsRotate);

                    // 修正某些小数时产生误差
                    dxy.dx = Math.round(dxy.dx) * model.scaleX;
                    dxy.dy = Math.round(dxy.dy) * model.scaleY;

                    // Set with zoom
                    drag.dx = dxy.dx / zoom;
                    drag.dy = dxy.dy / zoom;

                    self.model.$imageLeft = drag.left + drag.dx;
                    self.model.$imageTop = drag.top + drag.dy;

                    // event
                    if (!drag.draging) {
                        self.editor.$events.$emit('element.imageTransformStart', model, {
                            action: 'draging',
                        });
                        drag.draging = true;
                    }

                    editor.cursorController.fixedCursor('move');
                },
                cancel() {
                    editor.cursorController.cancelFixed();
                    doc.off('mousemove', drag.move);

                    self.resetImageBounding(() => {
                        // reset
                        self.drag = null;
                        parentModel.$draging = false;
                        model.$imageDraging = false;

                        // event
                        if (drag.draging) {
                            drag.draging = false;
                            self.editor.$events.$emit('element.imageTransformEnd', model, {
                                action: 'draging',
                            });
                        }
                    });
                },
            });

            // lock drag
            parentModel.$draging = true;
            model.$imageDraging = true;

            doc.on('mousemove', drag.move);
            doc.one('mouseup', drag.cancel);
        },
        initScale(e) {
            const self = this;
            const { model, parentModel, editor, elRadius } = this;

            if (e.button !== 0 || parentModel.$draging) {
                return;
            }

            const drag = (this.drag = {
                pageX: e.pageX,
                pageY: e.pageY,
                ...this.getCache(),
                move(e) {
                    e.preventDefault();
                    const progress =
                        Math.max(-elRadius, Math.min(elRadius * 2, e.pageX - drag.pageX)) /
                        elRadius;
                    const rightDiffRatio = Math.max(0, MAX_RATIO - self.scaleInfo.default);
                    const leftDiffRatio = self.scaleInfo.default;

                    if (progress > 0) {
                        if (self.scaleInfo.current < MAX_RATIO) {
                            self.scaleInfo.circle = 1 + progress;
                        }
                        self.scaleInfo.current =
                            self.scaleInfo.default + (progress / 2) * rightDiffRatio;
                    } else {
                        if (self.scaleInfo.current > MIN_RATIO) {
                            self.scaleInfo.circle = 1 + progress;
                        }

                        self.scaleInfo.current = Math.max(
                            MIN_RATIO,
                            self.scaleInfo.default + progress * leftDiffRatio,
                        );
                    }

                    // 吸附
                    [
                        { scale: 1, edge: 0.03 * (progress > 0 ? rightDiffRatio : leftDiffRatio) },
                    ].forEach((item) => {
                        if (
                            Math.abs(self.scaleInfo.current * 100 - item.scale * 100) <
                            item.edge * 100
                        ) {
                            self.scaleInfo.current = item.scale;
                        }
                    });

                    if (model.width / model.$imageWidth > model.height / model.$imageHeight) {
                        model.$imageWidth = model.width * self.scaleInfo.current;
                        model.$imageHeight = (drag.height / drag.width) * model.$imageWidth;
                    } else {
                        model.$imageHeight = model.height * self.scaleInfo.current;
                        model.$imageWidth = (drag.width / drag.height) * model.$imageHeight;
                    }

                    const imageCenter = {
                        x: drag.width / 2,
                        y: drag.height / 2,
                    };
                    const boxCenter = {
                        x: -drag.left + model.width / 2,
                        y: -drag.top + model.height / 2,
                    };

                    // 改变缩放中心点, 以外框为中心点
                    const ratioX = boxCenter.x / imageCenter.x;
                    const ratioY = boxCenter.y / imageCenter.y;

                    model.$imageLeft = drag.left - ((model.$imageWidth - drag.width) / 2) * ratioX;
                    model.$imageTop = drag.top - ((model.$imageHeight - drag.height) / 2) * ratioY;

                    // event
                    if (!drag.draging) {
                        drag.draging = true;
                        self.editor.$events.$emit('element.imageTransformStart', model, {
                            action: 'scale',
                        });
                    }

                    editor.cursorController.fixedCursor('ewResize');
                },
                cancel() {
                    doc.off('mousemove', drag.move);
                    self.resetImageBounding(() => {
                        self.drag = null;
                        parentModel.$draging = false;
                        model.$imageDraging = false;

                        // event
                        if (drag.draging) {
                            drag.draging = false;
                            self.editor.$events.$emit('element.imageTransformEnd', model, {
                                action: 'scale',
                            });
                        }
                    });
                    editor.cursorController.cancelFixed();
                },
            });

            // lock drag
            const val = Math.min(
                this.model.$imageWidth / this.model.width,
                this.model.$imageHeight / this.model.height,
            );

            Object.assign(this.scaleInfo, {
                current: val,
                default: val,
                circle: 1,
            });

            parentModel.$draging = true;
            model.$imageDraging = true;

            doc.on('mousemove', drag.move);
            doc.one('mouseup', drag.cancel);
        },
        initRotator(e) {
            const self = this;
            const { mixModel, model, parentModel, zoom } = this;
            const parentsRotate = mixModel.rotate;
            if (e.button !== 0 || parentModel.$draging) {
                return;
            }

            const drag = (this.drag = {
                dotX: 0,
                dotY: 0,
                pageX: 0,
                pageY: 0,
                ...this.getCache(),

                move(e) {
                    e.preventDefault();
                    let rotate =
                        utils.getAngle(e.pageX, e.pageY, drag.dotX, drag.dotY, -90) - parentsRotate;

                    // 按shift键时，旋转结果值以10度的倍数取整
                    if (e.shiftKey) {
                        rotate = Math.round(rotate / 10) * 10;
                    }

                    if (!e.ctrlKey) {
                        [
                            { angle: 30, edge: 1 },
                            { angle: 45, edge: 1 },
                        ].some((item) => {
                            const angle = item.angle;
                            const edge = item.edge;
                            const closest = Math.round((rotate + parentsRotate) / angle) * angle;

                            if (Math.abs(closest - (rotate + parentsRotate)) < edge) {
                                rotate = closest - parentsRotate;
                                return true;
                            }

                            return false;
                        });
                    }

                    const scaleVal = Math.round(model.transform.scale.x * model.transform.scale.y);
                    rotate *= scaleVal;

                    model.imageTransform.rotation = utils.degToRad(rotate);

                    setRotatorHeight(e);
                    self.resetImageBounding(null, drag, 'rotate');

                    // event
                    if (!drag.draging) {
                        drag.draging = true;
                        self.editor.$events.$emit('element.imageTransformStart', model, {
                            action: 'rotate',
                        });
                    }
                },
                cancel() {
                    const callback = () => {
                        self.drag = null;
                        parentModel.$draging = false;
                        model.$imageDraging = false;

                        // event
                        if (drag.draging) {
                            drag.draging = false;
                            self.editor.$events.$emit('element.imageTransformEnd', model, {
                                action: 'rotate',
                            });
                        }
                    };

                    doc.off('mousemove', drag.move);
                    callback();
                },
            });

            const setRotatorHeight = (e) => {
                const rect = this.$el.getBoundingClientRect();
                const point = {
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2,
                };

                const dep = Math.sqrt(
                    Math.pow(point.x - e.pageX, 2) + Math.pow(point.y - e.pageY, 2),
                );

                this.activeRotatorHeight = dep;
            };

            const element = $(e.currentTarget || e.target);
            const shell = element.closest('.editor-shell');
            const shellOffset = shell.offset();

            const modelRect = this.isCrop ? this.model : mixModel;
            const height = zoom * modelRect.height;
            const width = zoom * modelRect.width;
            const left = zoom * modelRect.left;
            const top = zoom * (modelRect.top + self.editor.currentLayout.top);

            // props
            assign(drag, {
                dotX: shellOffset.left + left + width / 2,
                dotY: shellOffset.top + top + height / 2,
                pageX: e.pageX,
                pageY: e.pageY,
            });

            // lock drag
            parentModel.$draging = true;
            model.$imageDraging = true;

            setRotatorHeight(e);

            doc.on('mousemove', drag.move);
            doc.one('mouseup', drag.cancel);
        },
    },
    filters: {
        angle(angle) {
            angle = Math.round(angle) % 360;
            angle = angle >= 180 ? angle - 360 : angle;
            return angle + '°';
        },
    },
    mounted() {
        this.editor.$events.$on('element.imageTransformStart', (model, { action }) => {
            this.action[action] = true;
        });
        this.editor.$events.$on('element.imageTransformEnd', (model, { action }) => {
            this.action[action] = false;
        });
    },
};
