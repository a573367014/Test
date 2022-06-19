import $ from '@gaoding/editor-utils/zepto';
import { assign, cloneDeep } from 'lodash';
import utils from '../../utils/utils';
import { compatibleEvent } from '../../utils/dom-event';

const doc = $(document);
const documentEL = document.documentElement;

export default {
    methods: {
        initResize(e, dir) {
            const self = this;
            const model = this.model;
            const zoom = self.editor.zoom;
            if ((e.button !== 0 || model.$draging) && e.type !== 'touchstart') {
                return;
            }
            // 不能 preventDefault 会导致鼠标置于 iframe 外部无法响应事件
            // http://taye.me/blog/tips/2015/11/16/mouse-drag-outside-iframe/
            // e.preventDefault();

            this.action.resize = dir;

            const element = $(e.currentTarget || e.target);
            const shell = element.closest('.editor-shell');
            const shellOffset = shell.offset();
            const points = utils.getRectPoints(model);

            // 基于对边的中心点做旋转偏移计算
            const getLineRotationCenterPoint = (model, dir) => {
                const baseCenter = {
                    x: model.left + model.width / 2,
                    y: model.top + model.height / 2,
                };
                const center = {
                    x: dir === 'e' ? model.left : model.left + model.width,
                    y: model.top + model.height / 2,
                };
                return utils.getPointPosition(center, baseCenter, model.rotate);
            };
            const rotatePoint = getLineRotationCenterPoint(model, dir);
            const syncRatio = ['image', 'mask', 'svg', 'ninePatch', 'chart', 'table'].includes(
                model.type,
            );
            const { pageX, pageY } = compatibleEvent(e);

            const drag = (this.drag = Object.assign(
                model.imageTransform
                    ? {
                          $imageWidth: model.$imageWidth,
                          $imageHeight: model.$imageHeight,
                          $imageTop: model.$imageTop,
                          $imageLeft: model.$imageLeft,
                          imageTransform: model.parseTransform(model.imageTransform),
                      }
                    : {},
                {
                    shadows: cloneDeep(model.shadows),
                    imageEffects: cloneDeep(model.imageEffects),
                    effectedResult: cloneDeep(model.effectedResult),
                    border: cloneDeep(model.border),
                    backgroundEffect: cloneDeep(model.backgroundEffect),
                    padding: cloneDeep(model.padding),
                    effectScale: model.effectScale,
                    dir: dir,
                    event: e,
                    rotate: model.rotate,
                    height: model.height,
                    width: model.width,
                    left: model.left,
                    top: model.top,
                    dx: 0,
                    dy: 0,

                    // 线段、箭头使用
                    getLineRotationCenterPoint,
                    rotatePoint,
                    rotateBaseDotX: shellOffset.left + rotatePoint.x * zoom,
                    rotateBaseDotY: shellOffset.top + rotatePoint.y * zoom,
                    strokeWidth: model.strokeWidth || 0,
                    $paths: cloneDeep(model.$paths),

                    pageX,
                    pageY,
                    points,

                    // limit
                    minHeight: 0,
                    minWidth: 0,
                    minLeft: 0,
                    minTop: 0,
                    maxLeft: 0,
                    maxTop: 0,
                    noSyncRatio: [
                        'line',
                        'rect',
                        'ellipse',
                        'brush',
                        'mosaicBrush',
                        'mosaicRect',
                        'mosaicEllipse',
                    ].includes(model.type),
                    move(e) {
                        if (e.type === 'touchmove') {
                            e.stopPropagation();
                        }

                        const { pageX, pageY } = compatibleEvent(e);

                        e.cancelable && e.preventDefault();
                        drag.event = e;

                        const dx = pageX - drag.pageX;
                        const dy = pageY - drag.pageY;
                        const dir = drag.dir;
                        const dxy = utils.getDxyByAngle(dx, dy, drag.rotate);

                        // 修正某些小数时产生误差
                        dxy.dx = Math.round(dxy.dx);
                        dxy.dy = Math.round(dxy.dy);

                        // 锁定某一方向
                        if (!/[ew]/.test(dir)) {
                            dxy.dx = 0;
                        }
                        if (!/[ns]/.test(dir)) {
                            dxy.dy = 0;
                        }

                        // 等比缩放
                        if (!drag.noSyncRatio && dir.length > 1 && !(e.shiftKey && syncRatio)) {
                            let ratio = drag.height / drag.width || 1;
                            if (dir === 'ne' || dir === 'sw') {
                                ratio *= -1;
                            }

                            dxy.dy = dxy.dx * ratio;
                        }

                        // Set with zoom
                        drag.dx = dxy.dx / zoom;
                        drag.dy = dxy.dy / zoom;

                        // event
                        if (!drag.draging) {
                            drag.draging = true;

                            self.$events.$emit('element.transformStart', model, {
                                action: 'resize',
                                dir,
                            });
                        }

                        //  resize-guider 需要在 transformResize 之前触发，否则有问题
                        self.$events.$emit('element.transformResizeBefore', drag, model, e);
                        self.$events.$emit('element.transformResize', drag, model, e);
                    },
                    cancel() {
                        doc.off('mousemove', drag.move);
                        doc.off('touchend', drag.cancel);
                        documentEL.removeEventListener('touchmove', drag.move, {
                            passive: false,
                            capture: true,
                        });
                        // reset
                        self.action.resize = null;
                        self.drag = null;
                        model.$draging = false;

                        // event
                        if (drag.draging) {
                            self.$events.$emit('element.transformEnd', model, drag, {
                                action: 'resize',
                            });

                            drag.draging = false;
                        }
                    },
                },
            ));

            // lock drag
            this.model.$draging = true;

            doc.on('mousemove', drag.move);
            documentEL.addEventListener('touchmove', drag.move, {
                passive: false,
                capture: true,
            });
            doc.one('mouseup', drag.cancel);
            doc.one('touchend', drag.cancel);
        },
        initRotaor(e) {
            const self = this;
            const { model } = this;

            if ((e.button !== 0 || model.$draging) && e.type !== 'touchstart') {
                return;
            }

            // Show angle tip
            this.action.rotate = true;

            // 不能 preventDefault 会导致鼠标置于 iframe 外部无法响应事件
            // http://taye.me/blog/tips/2015/11/16/mouse-drag-outside-iframe/
            // e.preventDefault();

            const drag = (this.drag = {
                dotX: 0,
                dotY: 0,
                pageX: 0,
                pageY: 0,
                rotate: 0,
                move(e) {
                    e.cancelable && e.preventDefault();
                    if (e.type === 'touchmove') {
                        e.stopPropagation();
                    }

                    const { pageX, pageY } = compatibleEvent(e);
                    let rotate = utils.getAngle(pageX, pageY, drag.dotX, drag.dotY, 90);

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
                            const closest = Math.round(rotate / angle) * angle;

                            if (Math.abs(closest - rotate) < edge) {
                                rotate = closest;
                                return true;
                            }

                            return false;
                        });
                    }

                    drag.rotate = rotate;

                    // event
                    if (!drag.draging) {
                        drag.draging = true;

                        self.$events.$emit('element.transformStart', model, {
                            action: 'rotate',
                        });
                    }

                    self.$events.$emit('element.transformRotate', drag, model);
                },
                cancel() {
                    doc.off('mousemove', drag.move);
                    doc.off('touchend', drag.cancel);
                    documentEL.removeEventListener('touchmove', drag.move, {
                        passive: false,
                        capture: true,
                    });

                    // reset
                    self.drag = null;
                    model.$draging = false;

                    // event
                    if (drag.draging) {
                        self.$events.$emit('element.transformEnd', model, drag, {
                            action: 'rotate',
                        });

                        drag.draging = false;
                    }

                    self.action.rotate = false;
                },
            });

            const zoom = this.global.zoom;
            const element = $(e.currentTarget || e.target);
            const shell = element.closest('.editor-shell');
            const shellOffset = shell.offset();

            const height = zoom * model.height;
            const width = zoom * model.width;
            const left = zoom * model.left;
            const top = zoom * (model.top + self.currentLayout.top);

            // props
            assign(drag, {
                dotX: shellOffset.left + left + width / 2,
                dotY: shellOffset.top + top + height / 2,
                pageX: e.pageX,
                pageY: e.pageY,
            });

            // lock drag
            model.$draging = true;

            doc.on('mousemove', drag.move);
            documentEL.addEventListener('touchmove', drag.move, {
                passive: false,
                capture: true,
            });
            doc.one('mouseup', drag.cancel);
            doc.one('touchend', drag.cancel);
        },
        initRotaor3d(e) {
            this.model.$isRotate3d = true;
            let prevPosition = {
                x: e.clientX || (e.touches ? e.touches[0].clientX : 0),
                y: e.clientY || (e.touches ? e.touches[0].clientY : 0),
            };
            const model = this.model;
            this.action.threeRotate = true;
            this.model.$showCoordinate = true;
            this.$events.$emit('element.transformStart', model, {
                action: '3dRotate',
            });

            const handleMousemove = (e) => {
                if (e.type === 'touchmove') {
                    e.stopPropagation();
                }
                const pageX = e.clientX || (e.touches ? e.touches[0].clientX : 0);
                const pageY = e.clientY || (e.touches ? e.touches[0].clientY : 0);
                const k = 0.01;
                const dx = pageX - prevPosition.x;
                let dy = pageY - prevPosition.y;
                prevPosition = {
                    x: pageX,
                    y: pageY,
                };
                const pi = Math.PI;
                let angle = this.model.rotate3d[1] % (pi * 2);
                if (angle < 0) {
                    angle += 2 * pi;
                }
                const isBack = angle < pi * 1.5 && angle > pi * 0.5;
                if (isBack) {
                    dy *= -1;
                }

                this.model.rotate3d = [
                    this.model.rotate3d[0] + dy * k,
                    this.model.rotate3d[1] + dx * k,
                    0,
                ];
            };
            const transformEnd = () => {
                this.action.threeRotate = false;
                this.model.$showCoordinate = false;
                this.$events.$emit(
                    'element.transformEnd',
                    model,
                    {},
                    {
                        action: '3dRotate',
                    },
                );
                document.removeEventListener('mousemove', handleMousemove);
                documentEL.removeEventListener('touchmove', handleMousemove, {
                    passive: false,
                    capture: true,
                });
                document.removeEventListener('mouseup', transformEnd);
                document.removeEventListener('touchend', transformEnd);
            };
            document.addEventListener('mousemove', handleMousemove);
            documentEL.addEventListener('touchmove', handleMousemove, {
                passive: false,
                capture: true,
            });
            document.addEventListener('mouseup', transformEnd);
            document.addEventListener('touchend', transformEnd);
        },
        onKeydown(e) {
            const model = this.model;

            if (
                ['rect', 'ellipse', 'mosaicRect', 'mosaicEllipse'].includes(model.type) &&
                e.shiftKey &&
                this.drag &&
                this.drag.dir.length > 1 &&
                this.drag.event &&
                this.action.resize
            ) {
                this.drag.shiftKeyDown = true;
                this.$events.$emit('element.transformResize', this.drag, model, this.drag.event);
                this.drag.shiftKeyDown = false;
                e.preventDefault();
            }
        },
        onKeyup(e) {
            const model = this.model;

            if (
                ['rect', 'ellipse', 'mosaicRect', 'mosaicEllipse'].includes(model.type) &&
                !e.shiftKey &&
                this.drag &&
                this.drag.dir.length > 1 &&
                this.drag.event &&
                this.action.resize
            ) {
                this.drag.shiftKeyUp = true;
                this.$events.$emit('element.transformResize', this.drag, model, this.drag.event);
                this.drag.shiftKeyUp = false;
                e.preventDefault();
            }
        },
        initKeyEvent() {
            // 矩形、圆形等比缩放
            // shift 按下时显示等比大小
            // shift 松开时不显示等比大小

            doc.on('keydown', this.onKeydown);
            doc.on('keyup', this.onKeyup);
        },
    },
    beforeDestroy() {
        doc.off('keydown', this.onKeydown);
        doc.off('keyup', this.onKeyup);
    },
};
