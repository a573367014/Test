import $ from '@gaoding/editor-utils/zepto';
import anime from 'animejs';
import Promise from 'bluebird';
import { omit, merge, cloneDeep, pick, isEqualWith } from 'lodash';

import BaseElement from '../../base/base-element';
import utils from '../../utils/utils';
import inherit from '../../utils/vue-inherit';
import { drawImageToCanvas } from '@gaoding/editor-utils/canvas';
import { setImageToFitRect, checkFullInclude } from '@gaoding/editor-utils/set-image-to-fit-rect';
import { isAnimationImage } from '@gaoding/editor-utils/element';

import template from './index.html';

export default inherit(BaseElement.createStaticBaseElement(), {
    template,
    name: 'mask-editor',
    props: ['model', 'currentElement', 'currentLayout', 'global'],
    data() {
        return {
            animation: null,
            clickLocked: true,
            showGrid: false,
            rectPrefix: null,
            innerProps: {
                editModel: null,
            },
            type:
                this.model.type === 'background-croper'
                    ? 'background-croper'
                    : this.model.type === 'mask'
                    ? 'masker'
                    : 'croper',
        };
    },
    computed: {
        editor() {
            return this.$parent.editor || this.$parent;
        },
        zoom() {
            return this.global.zoom;
        },

        editModel() {
            return this.getEditModel();
        },

        isBackgroundClipper() {
            return this.type === 'background-croper';
        },

        isMasker() {
            return this.type === 'masker';
        },

        isVideo() {
            return this.editModel.$originalType === 'video';
        },

        boxStyle() {
            const { editModel, zoom } = this;

            return {
                left: editModel.left * zoom + 'px',
                top: (this.currentLayout.top + editModel.top) * zoom + 'px',
                width: editModel.width * zoom + 'px',
                height: editModel.height * zoom + 'px',
                transform: editModel.transform.toString(),
            };
        },
        imageStyle() {
            const { editModel, zoom } = this;
            const { imageTransform, $imageWidth, $imageHeight, $imageLeft, $imageTop } = editModel;

            return {
                left: $imageLeft * zoom + 'px',
                top: $imageTop * zoom + 'px',
                width: $imageWidth * zoom + 'px',
                height: $imageHeight * zoom + 'px',
                transform: `rotate(${utils.radToDeg(imageTransform.rotation)}deg)`,
            };
        },
        isAnimationImage() {
            return isAnimationImage(this.model);
        },
    },
    methods: {
        activeInnerEdit(e) {
            const editModel = this.editModel;
            this.editor.focusElement(editModel);
            editModel.active = true;

            this.$events.$emit('imageCroper.activeInner', e);
        },

        activeOuterEdit(e) {
            // Cancel drag event.
            $(this.$el).off('mousedown');

            setTimeout(() => {
                this.$events.$emit('transform.drag', e);
            }, 0);
        },

        updateStage() {
            const canvas = this.$refs.canvas;
            const editModel = this.editModel;
            const fitCrossOrigin = this.options.fitCrossOrigin;

            // 区分图片和视频加载
            const loadImagePromise =
                editModel.$originalType === 'video'
                    ? utils.loadVideo(editModel.url, this.model.$currentTime / 1000, fitCrossOrigin)
                    : utils.loadImage(editModel.url, fitCrossOrigin, true);

            const loadMaskPrmoise = editModel.mask
                ? utils.loadImage(editModel.mask, fitCrossOrigin)
                : null;

            return Promise.all([loadImagePromise, loadMaskPrmoise]).spread((img, mask) => {
                const context = canvas.getContext('2d');

                const {
                    width,
                    height,
                    $imageWidth,
                    $imageHeight,
                    $imageLeft,
                    $imageTop,
                    imageTransform,
                } = editModel;
                const { rotation } = imageTransform;

                // 手动处理宽高，否则 canvas 将向下取整
                const canvasWidth = Math.ceil(width);
                const canvasHeight = Math.ceil(height);

                canvas.width = canvasWidth;
                canvas.height = canvasHeight;

                const imageSize = {
                    width: Math.round($imageWidth),
                    height: Math.round($imageHeight),
                };

                const imageCenter = {
                    x: $imageLeft + imageSize.width / 2,
                    y: $imageTop + imageSize.height / 2,
                };

                context.clearRect(0, 0, canvasWidth, canvasHeight);

                if (mask) {
                    context.drawImage(mask, 0, 0, canvasWidth, canvasHeight);
                } else {
                    context.fillRect(0, 0, canvasWidth, canvasHeight);
                }

                // Rest globalCompositeOperation.
                context.globalCompositeOperation = 'source-over';

                if (this.isAnimationImage) {
                    drawImageToCanvas(
                        canvas,
                        this.$refs.bgCanvas,
                        imageCenter,
                        imageSize,
                        rotation,
                        'source-in',
                    );
                } else {
                    drawImageToCanvas(canvas, img, imageCenter, imageSize, rotation, 'source-in');
                }
            });
        },

        // 组内裁剪需要矫正位置
        getRectPrefix(_model) {
            if (!this.lastCurrentElement) {
                this.lastCurrentElement = this.currentElement;
            }

            const model = _model || this.model;
            const currentElement = this.lastCurrentElement;

            // default data
            let ret = {
                parent: {
                    left: 0,
                    top: 0,
                    width: 0,
                    height: 0,
                    rotate: 0,
                },
                rotate: model.rotate,
                left: model.left,
                top: model.top,
                transform: model.transform,
            };

            if (currentElement && currentElement !== this.model) {
                const groups = this.editor.getParentGroups(model);
                const results = [groups[0]];
                ret = groups.concat(model).reduce((a, b) => {
                    let result = utils.mergeTransform(a, b);
                    result = Object.assign({}, b, result);
                    results.push(result);
                    return result;
                });
                ret.rotate = utils.radToDeg(ret.transform.rotation);

                const parent = results[results.length - 2];
                ret.parent = {
                    left: parent.left,
                    top: parent.top,
                    width: parent.width,
                    height: parent.height,
                    rotate: utils.radToDeg(parent.transform.rotation),
                };
            }

            return ret;
        },
        getImageModel(model) {
            const rectPrefix = this.rectPrefix || this.getRectPrefix();
            const scale = rectPrefix.transform.scale;
            let { $imageLeft: x, $imageTop: y } = model;

            // top 此时应取 bottom
            if (scale.y < 0) {
                y = model.height - model.$imageHeight - y;
            }
            // left 此时应取 right
            if (scale.x < 0) {
                x = model.width - model.$imageWidth - x;
            }

            const centerPoint = utils.getPointPosition(
                {
                    x: rectPrefix.left + x + model.$imageWidth / 2,
                    y: rectPrefix.top + y + model.$imageHeight / 2,
                },
                {
                    x: rectPrefix.left + model.width / 2,
                    y: rectPrefix.top + model.height / 2,
                },
                rectPrefix.rotate,
            );

            const editModel = merge({}, model, {
                height: model.$imageHeight,
                width: model.$imageWidth,
                left: centerPoint.x - model.$imageWidth / 2,
                top: centerPoint.y - model.$imageHeight / 2,
                rotatable: true,
                dragable: true,
            });

            editModel.rotate = utils.radToDeg(
                model.imageTransform.rotation + rectPrefix.transform.rotation,
            );
            return editModel;
        },
        getEditModel() {
            const model = this.model;
            const innerProps = this.innerProps;
            let editModel = innerProps.editModel;

            if (editModel && model === innerProps.modelCache) {
                return editModel;
            }

            const rectPrefix = this.getRectPrefix();
            const padding = model.padding;

            editModel = merge({}, model, {
                type: '$' + this.type,
                $name: '$cropperInner',
                height: model.height + padding[0] + padding[2],
                width: model.width + padding[1] + padding[3],
                left: rectPrefix.left,
                top: rectPrefix.top,
                lock: model.lock,
                // 启用拖拽限制
                $dragLimit: true,
                $customDragMove: true,

                rotatable: true,
                dragable: true,
                transform: rectPrefix.transform,
                imageTransform: model.parseTransform(model.imageTransform),

                $guider: {
                    snapTo: true,
                    show: false,
                    marginShow: false,
                    resizeShow: false,
                },
                active: false,
                $currentElement: this.currentElement,
            });
            editModel.$imageWidth = model.$imageWidth;
            editModel.$imageHeight = model.$imageHeight;
            editModel.$imageLeft = model.$imageLeft;
            editModel.$imageTop = model.$imageTop;

            editModel = this.editor.createElement(editModel);
            editModel.rotate = rectPrefix.rotate;
            editModel.$parentId = null;

            model.$editing = true;

            let cache = cloneDeep(editModel);
            const props = [
                'width',
                'height',
                '$imageWidth',
                '$imageHeight',
                '$imageLeft',
                '$imageTop',
                'left',
                'top',
                'rotate',
                'imageTransform',
            ];

            cache = pick(cache, props);

            editModel.$reset = () => {
                merge(editModel, omit(cache, 'imageTransform'), {
                    imageTransform: {
                        rotation: cache.imageTransform.rotation,
                    },
                });
            };

            editModel.$canReset = () => {
                return !isEqualWith(cache, pick(editModel, props), (objValue, othValue, key) => {
                    if (typeof objValue !== 'number') return undefined;

                    if (key && key !== 'rotate') {
                        return Math.round(objValue) === Math.round(othValue);
                    }

                    return objValue === othValue;
                });
            };

            // cache
            innerProps.editModel = editModel;
            innerProps.modelCache = model;

            return editModel;
        },

        setModelStartCache() {
            const {
                width,
                height,
                $imageWidth,
                $imageHeight,
                $imageLeft,
                $imageTop,
                imageTransform,
                left,
                top,
            } = this.editModel;
            const { rotation } = imageTransform;

            this.$startCache = {
                imageLeft: $imageLeft,
                imageTop: $imageTop,
                imageRotate: utils.radToDeg(rotation),
                boxWidth: width,
                boxHeight: height,
                boxLeft: left,
                boxTop: top,
                $imageWidth,
                $imageHeight,
            };
        },
        resetBounding(animation) {
            const syncScale = (_editModel) => {
                const { width, height, $imageWidth, $imageHeight } = _editModel || editModel;
                // 拖拽控制点后同步进度条比例
                this.$events.$emit(
                    'imageCroper.resizeEnd',
                    { width: $imageWidth, height: $imageHeight },
                    { width, height },
                );
            };

            const editModel = this.editModel;
            const model = cloneDeep(editModel);
            this.animation = null;

            if (checkFullInclude(model)) {
                syncScale();
                return;
            }

            setImageToFitRect(model, {
                finalScale: 1,
                height: model.$imageHeight,
                width: model.$imageWidth,
                left: model.$imageLeft,
                top: model.$imageTop,
            });

            if (!animation) {
                editModel.$imageLeft = model.$imageLeft;
                editModel.$imageTop = model.$imageLeft;
                editModel.$imageWidth = model.$imageWidth;
                editModel.$imageHeight = model.$imageHeight;

                syncScale();
                return;
            }

            const targets = {
                width: editModel.$imageWidth,
                height: editModel.$imageHeight,
                left: editModel.$imageLeft,
                top: editModel.$imageTop,
            };

            const time = Math.max(
                (Math.max(
                    Math.abs(model.$imageWidth - targets.width),
                    Math.abs(model.$imageLeft - targets.left),
                ) /
                    (model.$imageWidth / 2)) *
                    600,
                (Math.max(
                    Math.abs(model.$imageHeight - targets.height),
                    Math.abs(model.$imageTop - targets.top),
                ) /
                    (model.$imageHeight / 2)) *
                    600,
            );

            const update = () => {
                editModel.$imageLeft = targets.left;
                editModel.$imageTop = targets.top;
                editModel.$imageWidth = targets.width;
                editModel.$imageHeight = targets.height;
            };

            syncScale(model);

            this.animation = anime({
                targets,
                width: model.$imageWidth,
                height: model.$imageHeight,
                left: model.$imageLeft,
                top: model.$imageTop,
                delay: 0,
                duration: Math.min(600, Math.max(200, time)),
                easing: 'easeOutExpo',
                update,
                complete: () => {
                    update();
                    syncScale(editModel);
                    this.animation = null;
                },
            });
        },

        destroyEditModel() {
            const model = this.model;

            if (!model) {
                return;
            }

            if (this.isBackgroundClipper) {
                this.currentLayout.$backgroundEditing = false;
                this.editor.focusElement(null);
                return;
            }

            if (this.lastCurrentElement && this.currentElement === this.editModel) {
                this.editor.focusElement(this.lastCurrentElement);
            }

            model.$editing = false;

            // this.model = null;
            this.$emit('update:model', null);
        },

        // actions
        save() {
            const { currentLayout, model, editModel, rectPrefix } = this;

            // 让动画立即执行完毕
            this.animation && this.animation.seek(100000);

            // 还原"中心点绕 group 中心点旋转"后的偏移值
            const innerCenter = {
                x: editModel.left + editModel.width / 2,
                y: editModel.top + editModel.height / 2,
            };

            const point = utils.getPointPosition(
                innerCenter,
                {
                    x: rectPrefix.parent.left + rectPrefix.parent.width / 2,
                    y: rectPrefix.parent.top + rectPrefix.parent.height / 2,
                },
                -rectPrefix.parent.rotate,
            );

            const modifyProps = {
                height: editModel.height,
                width: editModel.width,
                left: editModel.left + (point.x - innerCenter.x) - rectPrefix.parent.left,
                top: editModel.top + (point.y - innerCenter.y) - rectPrefix.parent.top,
                lock: editModel.lock,

                imageTransform: editModel.imageTransform,
                $imageWidth: editModel.$imageWidth,
                $imageHeight: editModel.$imageHeight,
                $imageLeft: editModel.$imageLeft,
                $imageTop: editModel.$imageTop,
            };

            if (this.isBackgroundClipper) {
                Object.assign(model, modifyProps);

                this.editor.changeLayout(
                    {
                        background: {
                            ...currentLayout.background,
                            image: {
                                ...currentLayout.background.image,
                                url: model.$originalUrl || model.url,
                                naturalWidth: model.naturalWidth,
                                naturalHeight: model.naturalHeight,
                                opacity: model.opacity,
                                width: model.width,
                                height: model.height,
                                left: model.left,
                                top: model.top,
                                imageTransform: model.imageTransform,
                            },
                        },
                    },
                    this.currentLayout,
                );
            } else {
                this.editor.toggleSnapshot(false);
                this.editor.changeElement(modifyProps, model);
                this.editor.toggleSnapshot(true);

                const groups = this.editor.getParentGroups(model);

                // groups 由内之外重置大小
                for (let i = groups.length - 1; i >= 0; i--) {
                    this.$events.$emit('group.boundingReset', groups[i]);
                }

                // 将 groups 计算包含在内
                if (editModel.$canReset()) {
                    this.editor.makeSnapshotByElement(model, false, true);
                }
            }
            this.destroyEditModel();
        },

        cancel() {
            this.destroyEditModel();
        },

        async renderAnimationImageFrame() {
            const canvas = this.$refs.bgCanvas;
            const { naturalWidth, naturalHeight, url } = this.model;
            canvas.width = naturalWidth;
            canvas.height = naturalHeight;
            const context = canvas.getContext('2d');

            if (this.isVideo) {
                return utils.loadVideo(url, this.model.$currentTime / 1000).then((video) => {
                    context.drawImage(video, 0, 0);
                });
            } else {
                return utils.loadImage(url).then((image) => {
                    context.drawImage(image, 0, 0);
                });
            }
        },
    },
    events: {
        'base.click'(e) {
            e.preventDefault();
            if (this.clickLocked && !this.scaling) {
                // 点击空白区域应用修改
                const point = this.editor.pointFromEvent(e);
                const rect = utils.getElementRect(this.getImageModel(this.editModel), 1);
                if (!utils.pointInRect(point.x, point.y, rect)) {
                    this.save();
                }
            }
        },

        'imageCroper.activeInner'() {
            this.editor.focusElement(this.editModel);

            if (!this.editModel.active) {
                this.activeInnerEdit();
            }
        },

        'imageCroper.activeOuter'() {
            if (this.editModel.active) {
                this.editor.focusElement(this.editModel);
            }
        },

        'element.dragStart'(element) {
            // 用户拖拽画布中其它元素时应用裁剪状态
            if (element.type !== '$' + this.type) {
                this.editor.$events.$emit('element.editApply', this.editModel);
                return;
            }

            this.clickLocked = false;
            this.showGrid = true;
            this.setModelStartCache();
        },

        'element.customDragMove'({ element, dx, dy }) {
            if (element !== this.editModel) return;

            // 拖拽内框
            const { imageLeft, imageTop } = this.$startCache;
            const dxy = utils.getDxyByAngle(dx, dy, element.rotate, element.transform.scale);
            element.$imageLeft = imageLeft + dxy.dx;
            element.$imageTop = imageTop + dxy.dy;
        },

        'element.dragEnd'() {
            this.clickLocked = false;
            this.showGrid = false;

            setTimeout(() => {
                this.clickLocked = true;
            }, 0);

            this.resetBounding(true);
        },

        'element.transformStart'(element) {
            this.showGrid = true;

            if (element === this.editModel) {
                this.clickLocked = true;
            }
        },

        'element.transformEnd'() {
            this.clickLocked = false;
            this.showGrid = false;

            setTimeout(() => {
                this.clickLocked = true;
            }, 0);

            this.resetBounding(true);
        },

        // edit
        'element.editApply'(model) {
            if (model !== this.editModel) {
                return;
            }

            this.save();
        },

        'element.editCancel'(model) {
            if (model !== this.editModel) {
                return;
            }

            this.cancel();
        },

        'element.editReset'() {
            this.editModel.$reset();
            const { width, height, $imageWidth, $imageHeight } = this.editModel;

            // 拖拽控制点后同步进度条比例
            this.$events.$emit(
                'imageCroper.resizeEnd',
                { width: $imageWidth, height: $imageHeight },
                { width, height },
            );
        },

        'element.editFitImage'() {
            let { $imageLeft, $imageTop, $imageWidth, $imageHeight } = this.editModel;

            const maxWidth = this.editor.currentLayout.width * 2;
            const maxHeight = this.editor.currentLayout.height * 2;
            const ratio = Math.max($imageHeight / maxHeight, $imageWidth / maxWidth);

            if (ratio > 1) {
                const newImagewWidth = $imageWidth / ratio;
                const newImageHeight = $imageHeight / ratio;

                this.editModel.left += ($imageWidth - newImagewWidth) / 2;
                this.editModel.top += ($imageHeight - newImageHeight) / 2;

                this.editModel.$imageWidth = $imageWidth = newImagewWidth;
                this.editModel.$imageHeight = $imageHeight = newImageHeight;
            }

            this.editModel.imageTransform.rotation = 0;
            this.editModel.$imageLeft = 0;
            this.editModel.$imageTop = 0;
            this.editModel.left += $imageLeft;
            this.editModel.top += $imageTop;
            this.editModel.width = $imageWidth;
            this.editModel.height = $imageHeight;

            // 拖拽控制点后同步进度条比例
            this.$events.$emit(
                'imageCroper.resizeEnd',
                { width: $imageWidth, height: $imageHeight },
                { width: $imageWidth, height: $imageHeight },
            );
        },

        'element.imageTransformStart'() {
            this.setModelStartCache();
        },

        'element.imageTransformEnd'(model) {
            if (model !== this.editModel) return;
            this.resetBounding(true);
        },

        'imageCroper.scale'(scale, action) {
            !this.scaling && this.setModelStartCache();
            this.scaling = true;

            const { editModel, $startCache: cache } = this;
            const { $imageWidth, $imageHeight, width, height } = editModel;

            const baseScale = Math.max(width / $imageWidth, height / $imageHeight);
            const originWidth = $imageWidth * baseScale;
            const originHeight = $imageHeight * baseScale;

            editModel.$imageWidth = originWidth * scale;
            editModel.$imageHeight = originHeight * scale;

            // 改变缩放中心点, 以外框为中心点
            const imageCenter = {
                x: cache.$imageWidth / 2,
                y: cache.$imageHeight / 2,
            };
            const boxCenter = {
                x: -cache.imageLeft + cache.boxWidth / 2,
                y: -cache.imageTop + cache.boxHeight / 2,
            };

            const ratioX = boxCenter.x / imageCenter.x;
            const ratioY = boxCenter.y / imageCenter.y;

            editModel.$imageLeft =
                cache.imageLeft - ((editModel.$imageWidth - cache.$imageWidth) / 2) * ratioX;
            editModel.$imageTop =
                cache.imageTop - ((editModel.$imageHeight - cache.$imageHeight) / 2) * ratioY;

            if (action === 'click') {
                delete this.scaling;
                this.resetBounding(true);
            }
        },

        'imageCroper.scaleEnd'() {
            delete this.scaling;
            this.resetBounding(true);
        },
    },
    watch: {
        currentElement(element) {
            if (element !== this.editModel) {
                this.$events.$emit('element.editApply', this.editModel);
                this.destroyEditModel();
            }
        },
    },
    created() {
        // cache
        this.lastCurrentElement = this.currentElement;
        this.rectPrefix = this.getRectPrefix();
    },
    mounted() {
        if (this.isAnimationImage || this.model.isGif || this.isVideo) {
            this.renderAnimationImageFrame();
        }

        this.editor.focusElement(this.editModel);
        this.editModel.active = true;

        this.$watch(() => {
            const {
                width,
                height,
                $imageWidth,
                $imageHeight,
                $imageLeft,
                $imageTop,
                imageTransform,
            } = this.editModel;
            const { rotation } = imageTransform;
            return [$imageWidth, $imageHeight, $imageLeft, $imageTop, width, height, rotation];
        }, this.updateStage);

        this.updateStage();
    },
});
