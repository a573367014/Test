/* eslint-disable no-fallthrough */
import { noop } from 'lodash';

import Matrix from '@gaoding/editor-utils/matrix';
import Transform from '@gaoding/editor-utils/transform';

import utils from '../../utils/utils';
import inherit from '../../utils/vue-inherit';
import { isWebglSupported } from '../../utils/is-webgl-supported';

import BaseElement from '../../base/base-element';
import template from './template.html';
import ImageTransform from './image-transform';
import WatermarkTransform from './watermark-transform';
import initEventMixin from './init-event';
import checkClickMixin from './check-click';
import VideoController from '../video-controller';
import { i18n } from '../../i18n';

export default inherit(BaseElement.createStaticBaseElement(), {
    name: 'transform',
    props: ['options', 'global', 'model', 'currentLayout', 'subModel'],
    template,
    mixins: [initEventMixin, checkClickMixin],
    data() {
        return {
            action: {
                tempGroup: false,
                scale: false,
                draging: false,
                threeRotate: false,
                rotate: false,
                resize: null,
                imageTransform: '',
            },

            visible: true,
            isMouseenter: false,

            hidden: false,
            lazyAddTransition: false,

            dragLocked: false,
            innerStyleVal: {},

            config: {
                removeEmptyTextEnable: true,
                tableOnlyContentEditable: false,
                tempGroupEnable: true,
                resizeEnable: true,
                rotateEnable: true,
                dragEnable: true,
                cursorStyle: '',
            },
        };
    },
    components: {
        ImageTransform,
        WatermarkTransform,
        VideoController,
    },
    computed: {
        isCommon() {
            if (this.editor.supportTypesMap[this.model.type]) return false;
            const isPenPath =
                this.model.type === 'path' &&
                this.editor.services.cache.get('path').canEditPath(this.model);
            return !isPenPath;
        },
        isTranforming() {
            const {
                action: { draging, threeRotate, rotate, resize },
            } = this;
            return (draging || threeRotate || rotate || !!resize) && !this.cropperInner;
        },
        isMultiple() {
            return this.model && ['$selector', 'group', 'flex'].includes(this.model.type);
        },
        isCenterResize() {
            const resize = this.model.resize;

            // 若都是中心控制点，返回 true
            if (resize === 2 || resize === 4 || resize === 6) {
                return true;
            }
            return false;
        },
        editor() {
            return this.$parent;
        },
        minSize() {
            const { width, height } = this.model;
            const { zoom } = this.global;

            return Math.min(width, height) * zoom;
        },
        gripDirs() {
            const resize = this.model.resize;
            let dirs = ['s', 'sw', 'w', 'nw', 'n', 'ne', 'e', 'se'];
            if (resize === 0) return [];
            if (this.cropperInner) return dirs;
            if (this.isCommon) {
                return ['sw', 'nw', 'ne', 'se'];
            }

            // 根据 resize 规则，返回操作点
            dirs = dirs.filter((dir) => {
                return (
                    (dir.length <= 1 || resize & 1) &&
                    ((dir !== 'n' && dir !== 's') || resize & 2) &&
                    ((dir !== 'e' && dir !== 'w') || resize & 4)
                );
            });

            // 若都是中心控制点，直接返回
            if (this.isCenterResize) {
                return dirs;
            }

            // 根据视觉大小，显示对应点
            if (this.minSize < 30) {
                dirs = ['se'];
            }
            // else if(this.minSize < 30) {
            //     dirs = ['nw', 'se'];
            // }

            if (!dirs.includes('e') && resize & 4) {
                dirs.push('e');
            }

            if (!dirs.includes('s') && resize & 2) {
                dirs.push('s');
            }

            // 保证当前拖拽点不被隐藏
            this.action.resize &&
                !dirs.includes(this.action.resize) &&
                dirs.push(this.action.resize);

            // 带图片旋转只允许同比拖拽放大
            const model = this.subModel || this.model;
            const typeValid = ['mask', 'image', 'video'].includes(model.type);
            if (typeValid && parseFloat(model.imageTransform.rotation) !== 0) {
                dirs = dirs.filter((dir) => dir.length > 1);
            }

            return dirs;
        },
        gripPadding() {
            let paddingSize = 0;
            if (this.minSize > 50) {
                paddingSize = (this.minSize - 50) / 5;
            }
            return Math.round(Math.min(paddingSize, 8));
        },

        // for croper
        innerStyle() {
            return this.innerStyleVal;
        },

        transform() {
            const { transform, scaleX, scaleY } = this.model;
            let { a, b, c, d, tx, ty } = transform.toJSON();
            // 如果图片处于翻转状态，因为控制点不需要翻转，所以再进行一次翻转
            if (scaleX < 0) {
                a = -a;
                b = -b;
            }
            if (scaleY < 0) {
                c = -c;
                d = -d;
            }
            return `matrix(${a},${b},${c},${d},${tx},${ty})`;
        },

        rotator() {
            const { transform } = this.model;
            const { a, b } = transform.toJSON();
            return -Math.round(Math.atan2(b, a) * (180 / Math.PI));
        },

        transformStyle() {
            const {
                model,
                currentLayout,
                global: { zoom },
            } = this;

            // 包围盒最小可视高度为6px
            let top = zoom * (model.top + currentLayout.top);
            let height = zoom * model.height;
            if (height < 6) {
                top -= (6 - height) / 2;
                height = 6;
            }

            return {
                height: height + 'px',
                width: zoom * model.width + 'px',
                left: zoom * model.left + 'px',
                top: top + 'px',
                transform: this.transform,
            };
        },

        // 通过逆矩阵使得控制点始终保持水平，角度显示也保持水平
        transformInvert() {
            const { transform, scaleX, scaleY } = this.model;
            let { a, b, c, d, tx, ty } = transform.localTransform;
            if (scaleX < 0) {
                a = -a;
                b = -b;
            }
            if (scaleY < 0) {
                c = -c;
                d = -d;
            }
            const matrix = new Matrix(a, b, c, d, tx, ty);
            matrix.invert();

            const invertTransform = new Transform();
            invertTransform.setFromMatrix(matrix);
            return invertTransform.toString();
        },

        skewInvert() {
            // 此处 skew 原单位为 rad
            const { skewX, skewY } = this.model;
            const invertX = -utils.radToDeg(skewX);
            const invertY = -utils.radToDeg(skewY);
            return `skew(${invertX}deg, ${invertY}deg)`;
        },

        rotateInvert() {
            return `rotate(${360 - this.model.rotate}deg)`;
        },

        // For grip mouse style
        octant() {
            // 去除负角度和大于360的情况
            const rotate = ((this.model.rotate % 360) + 360) % 360;
            return Math.abs(Math.floor((rotate + 22.5) / 45));
        },

        // For grip mouse style
        octantCursor() {
            const direction = {
                s: 'nsResize',
                sw: 'neswResize',
                w: 'ewResize',
                nw: 'nwseResize',
                n: 'nsResize',
                ne: 'neswResize',
                e: 'ewResize',
                se: 'nwseResize',
            };
            const values = Object.values(direction);
            const keys = Object.keys(direction);
            keys.forEach((item, index) => {
                if (this.octant) {
                    const count =
                        index + this.octant < keys.length
                            ? index + this.octant
                            : index + this.octant - keys.length;
                    direction[item] = values[count];
                }
            });
            return direction;
        },

        cropperInner() {
            return this.model.$name === '$cropperInner';
        },

        isText() {
            return this.model.type === 'text' || (this.subModel && this.subModel.type === 'text');
        },
        isVideo() {
            return this.model.type === 'video' || (this.subModel && this.subModel.type === 'video');
        },
        isTable() {
            return this.model.type === 'table';
        },
        isLinePath() {
            return this.model.type === 'path' && this.model.isLine();
        },
        isEffectText() {
            return (
                this.model.type === 'effectText' ||
                (this.subModel && this.subModel.type === 'effectText')
            );
        },
        isStyledText() {
            return (
                this.model.type === 'styledText' ||
                (this.subModel && this.subModel.type === 'styledText')
            );
        },
        isThreeText() {
            return this.model.type === 'threeText';
        },
        isContainThreeText() {
            return this.subModel && this.subModel.type === 'threeText';
        },
        isThreeTextEditable() {
            return isWebglSupported;
        },
        isWatermarkEditor() {
            return this.model.type === '$watermarker';
        },
        isSupportImageTransform() {
            const types = this.options.cropperOptions.imageTransformTypes;
            const curElem = this.subModel || this.model;
            types.includes('mask') && types.push('$masker');
            types.includes('image') && types.push('$croper');

            return curElem.editable && curElem && types.includes(curElem.type) && !curElem.lock;
        },

        imageTransformVisible() {
            const curElem = this.subModel || this.model;
            const width = curElem.width * this.global.zoom;
            const height = curElem.height * this.global.zoom;

            return (
                ((this.isMouseenter && width >= 98 && height >= 98 && !this.model.$draging) ||
                    !!curElem.$imageDraging) &&
                curElem.url &&
                !this.options.touchEnable
            );
        },
        mixSubModel() {
            let { subModel } = this;
            if (!subModel) return;

            // 可能存在多层嵌套，需拉平处理
            const parents = this.editor.getParentGroups(subModel);
            parents.shift();

            subModel = parents.concat(subModel).reduce((a, b) => {
                const result = utils.mergeTransform(a, b);
                return Object.assign({}, b, result);
            });

            subModel.parents = parents;
            subModel.rotate = (360 + utils.radToDeg(subModel.transform.rotation)) % 360;

            return subModel;
        },

        mixSubModelStyle() {
            if (!this.mixSubModel) return;
            const { width, height, left, top, transform } = this.mixSubModel;
            const { scaleX, scaleY } = this.subModel;
            let { a, b, c, d, tx, ty } = transform.toJSON();

            // 如果图片处于翻转状态，因为控制点不需要翻转，所以再进行一次翻转
            if (scaleX < 0) {
                a = -a;
                b = -b;
            }
            if (scaleY < 0) {
                c = -c;
                d = -d;
            }

            return {
                width: width * this.global.zoom + 'px',
                height: height * this.global.zoom + 'px',
                left: left * this.global.zoom + 'px',
                top: top * this.global.zoom + 'px',
                transform: `matrix(${a},${b},${c},${d},${tx},${ty})`,
            };
        },

        // 通过逆矩阵使得控制点始终保持水平，角度显示也保持水平
        mixSubTransformInvert() {
            if (!this.mixSubModel) return;
            const { transform } = this.mixSubModel;
            let { a, b, c, d, tx, ty } = transform.localTransform;
            if (transform.scale.x < 0) {
                a = -a;
                b = -b;
            }
            if (transform.scale.y < 0) {
                c = -c;
                d = -d;
            }
            const matrix = new Matrix(a, b, c, d, tx, ty);
            matrix.invert();

            const invertTransform = new Transform();
            invertTransform.setFromMatrix(matrix);
            return invertTransform.toString();
        },
        cursorStyle() {
            if (this.config.cursorStyle) {
                return this.config.cursorStyle;
            }
            if (this.model.lock) {
                return 'default';
            }
            return 'move';
        },

        rotateVisible() {
            const { model, isLine, isArrow, isTable, isLinePath, config } = this;
            return (
                model.rotatable &&
                !model.lock &&
                !isLine &&
                !isArrow &&
                !isTable &&
                !isLinePath &&
                config.rotateEnable
            );
        },
        threeTextRotateVisible() {
            const { model, isThreeText, isThreeTextEditable, config } = this;
            return (
                isThreeText &&
                !model.$editing &&
                isThreeTextEditable &&
                !model.lock &&
                config.rotateEnable
            );
        },
        resizeVisible() {
            const { model, config } = this;
            return !model.lock && config.resizeEnable;
        },

        tempGroupVisible() {
            const { model, global, config } = this;
            return model.type === 'group' && !global.$tempGroup && config.tempGroupEnable;
        },
    },
    methods: {
        $tsl: i18n.$tsl,
        focusElementByEvent(e) {
            const editor = this.editor;
            const point = editor.pointFromEvent(e);

            return editor.focusElementByPoint(point.x, point.y);
        },

        onClick(e) {
            this.$events.$emit('transform.click', e, this.model);
            if (utils.isEditable(e.target)) {
                return;
            }

            if (e.shiftKey || e.metaKey) {
                return;
            }

            const editor = this.editor;
            const cacheElement = editor.currentSubElement || editor.currentElement;

            this.focusElementByEvent(e);

            const element = editor.currentSubElement || editor.currentElement;

            if (cacheElement === element) {
                switch (element.type) {
                    case 'text':
                    case 'effectText':
                    case 'styledText':
                        editor.showElementEditor(element);
                        break;
                    case 'threeText':
                        if (this.isThreeTextEditable) {
                            editor.showElementEditor(element);
                        }
                        break;
                }
            }
        },

        onDblClick(e) {
            if (!e.target) return;
            this.$events.$emit('transform.dblClick', e, this.model);

            if (utils.isEditable(e.target)) {
                return;
            }

            const editor = this.editor;

            this.focusElementByEvent(e);

            const element = editor.currentSubElement || editor.currentElement;
            switch (element.type) {
                case 'image':
                case 'mask':
                    if (element.editable) {
                        if (this.options.hookImagePicker) {
                            if (this.options.onDbClickImage) {
                                this.options.onDbClickImage(element);
                            } else {
                                this.$events.$emit('imagePicker.show', {
                                    action: 'imageOrMaskDbClick',
                                });
                            }
                        } else {
                            editor.pickImage(
                                (image, url) => {
                                    editor.replaceImage(
                                        url,
                                        {
                                            width: image.width * editor.zoom,
                                            height: image.height * editor.zoom,
                                        },
                                        element,
                                    );
                                },
                                () => {
                                    // AfterSelect: Show loading tip.
                                    element.$loaded = false;
                                },
                            );
                        }
                    }
                    break;
                case 'video':
                    if (element.editable) {
                        if (this.options.hookImagePicker) {
                            if (this.options.onDbClickImage) {
                                this.options.onDbClickVideo(element);
                            } else {
                                this.$events.$emit('videoPicker.show');
                            }
                        } else {
                            editor.pickVideo(
                                (video, url) => {
                                    editor.replaceVideo(
                                        url,
                                        {
                                            width: video.videoWidth,
                                            height: video.videoHeight,
                                            duration: video.duration,
                                        },
                                        element,
                                    );
                                },
                                () => {
                                    // AfterSelect: Show loading tip.
                                    element.$loaded = false;
                                },
                            );
                        }
                    }
                    break;
                case 'text':
                case 'effectText':
                case 'styledText':
                    editor.showElementEditor(element);
                    break;
                case 'threeText':
                    if (this.isThreeTextEditable) {
                        editor.showElementEditor(element);
                    }
                    break;
                case 'svg':
                    this.$events.$emit('element.dblclick', element);
                    break;
                case 'path':
                    editor.services.cache.get('path').editPath(element);
                    break;
            }

            // Prevent occur base.click event
            e.stopPropagation();
        },

        // Transform Inner
        innerClick(e) {
            // 使用 outer 时忽略保持外框选中状态
            if (this.options.cropperOptions.defaultTarget === 'outer') {
                return;
            }

            if (e.button === 0) {
                if (this.innerActive && e.type === 'mouseup') {
                    const dx = Math.abs(this.innerActive.pageX - e.pageX);
                    const dy = Math.abs(this.innerActive.pageY - e.pageY);
                    if (dx < 3 && dy < 3) {
                        this.$events.$emit('imageCroper.activeInner');
                    }
                    this.innerActive = false;
                } else if (!this.innerActive && e.type === 'mousedown') {
                    this.innerActive = e;
                } else {
                    this.innerActive = false;
                }
            }
        },

        getGripSize(size) {
            const { zoom } = this.global;
            const imageSize = size * zoom;

            size = 10;
            if (imageSize > 30) {
                size = imageSize / 3;
            }

            return Math.round(Math.min(size, 14));
        },
        getGripSizeStyle(dir) {
            if (this.cropperInner) {
                return {
                    width: this.gripPadding * 2 + 7 + 'px',
                    height: this.gripPadding * 2 + 7 + 'px',
                };
            } else if (!this.isCenterResize && (dir === 'w' || dir === 'e')) {
                const height = this.getGripSize(this.minSize / this.global.zoom);
                return {
                    height: height + 'px',
                };
            } else if (!this.isCenterResize && (dir === 'n' || dir === 's')) {
                const width = this.getGripSize(this.minSize / this.global.zoom);
                return {
                    width: width + 'px',
                };
            }

            return {};
        },

        unlock(e) {
            e.stopPropagation();

            if (this.model) {
                this.editor.changeElement(
                    {
                        lock: false,
                    },
                    this.model,
                );

                this.editor.focusElement(this.model);
            }
        },

        hideTempGroupTips() {
            if (this.editor.isGroup(this.model)) {
                this.options.tipsOptions.tempGroup = false;
            }
        },

        createTempGroup() {
            this.hideTempGroupTips();
            this.editor.createTempGroup(this.model);
        },

        addFadeout(type, dir) {
            const {
                action: { draging, threeRotate, rotate, resize, imageTransform, scale },
                hidden,
            } = this;

            if (type === 'grip') {
                return (
                    scale ||
                    imageTransform ||
                    threeRotate ||
                    draging ||
                    rotate ||
                    (resize && resize !== dir) ||
                    hidden
                );
            }

            if (type === 'rotator') {
                return scale || imageTransform || draging || resize || threeRotate || hidden;
            }

            if (type === 'rotator-three') {
                return scale || imageTransform || draging || resize || rotate || hidden;
            }

            if (type === 'temp-group') {
                return (
                    scale || imageTransform || draging || resize || rotate || hidden || threeRotate
                );
            }
        },

        toggleMouseenter(bool, fromWrap) {
            if (fromWrap && this.subModel) return;
            this.isMouseenter = bool;
        },

        getBoundingClientRect() {
            const $els = this.$refs;
            const transformEleRect = $els.transformEle.getBoundingClientRect();
            let rotatorHandleRect = $els.rotatorHandle.getBoundingClientRect();

            // rotatorHandle元素不可见
            if (rotatorHandleRect.width === 0 || rotatorHandleRect.height === 0) {
                rotatorHandleRect = transformEleRect;
            }

            const rect = {
                top: Math.min(transformEleRect.top, rotatorHandleRect.top),
                left: Math.min(transformEleRect.left, rotatorHandleRect.left),
                bottom: Math.max(transformEleRect.bottom, rotatorHandleRect.bottom),
                right: Math.max(transformEleRect.right, rotatorHandleRect.right),

                _transformEleRect: transformEleRect,
                _rotatorHandleRect: rotatorHandleRect,
            };

            rect.width = rect.right - rect.left;
            rect.height = rect.bottom - rect.top;

            return rect;
        },

        editWatermark() {
            this.editor.showWatermarkEditor(this.model);
        },

        // 忽略 EditorElement 部分特性
        checkLoad: noop,

        toggleDragLocked(lock) {
            this.dragLocked = lock;
        },

        setConfig(config) {
            Object.assign(this.config, config);
        },
    },
    events: {
        'base.click'(e) {
            const { currentElement } = this.editor;
            const isGroup = this.editor.isGroup(currentElement);

            if (this.clickLocked || this.dragLocked) {
                // reset
                this.clickLocked = false;
                this.dragLocked = false;

                // 对于存在热键或组元素内的点击，应使用 editor 默认行为
                // 对除此之外的点击才使用 preventDefault 的形式，阻止 editor 默认行为
                if (!e.shiftKey && !e.metaKey && !isGroup) {
                    e.preventDefault();
                }
            }
            // 继续广播事件
            return true;
        },

        'base.dragStart'(model) {
            this.hideTempGroupTips();

            // 拖动图片隐藏控制点
            this.action.draging = true;

            if (model.type.includes('$')) {
                this.$events.$emit('element.dragStart', model);
            }

            this.hidden = model !== this.model;
        },

        'base.dragMove'(drag, model, e) {
            // 拖动图片隐藏控制点
            this.action.draging = true;

            if (model.type.includes('$')) {
                this.$events.$emit('element.dragMove', drag, this.model, e);
            }
        },

        'base.dragEnd'(model) {
            if (model.type.includes('$')) {
                this.$events.$emit('element.dragEnd', model);
            }

            this.action.draging = false;
            this.hidden = false;
        },

        'element.transformStart'(model) {
            this.hideTempGroupTips();
            this.dragLocked = true;
            this.hidden = model !== this.model;
        },
        'element.transformEnd'() {
            setTimeout(() => {
                this.dragLocked = false;
            }, 160);

            this.hidden = false;
        },

        'element.imageTransformStart'(model, { action }) {
            this.dragLocked = true;
            this.hidden = model !== this.model;
            this.action.imageTransform = action;
        },
        'element.imageTransformEnd'() {
            setTimeout(() => {
                this.dragLocked = false;
            }, 160);

            this.hidden = false;
            this.action.imageTransform = '';
        },

        'maskEditor.styleUpdate'(val) {
            this.innerStyleVal = val;
        },
        'imageCroper.scale'(scale, action) {
            if (action === 'click') return;
            this.action.scale = true;
        },

        'imageCroper.scaleEnd'() {
            this.action.scale = false;
        },

        'tempGroup.dragStart'() {
            this.action.tempGroup = true;
        },
        'tempGroup.dragEnd'() {
            this.action.tempGroup = false;
        },
    },

    filters: {
        angle(angle) {
            angle = Math.round(angle) % 360;
            angle = angle >= 180 ? angle - 360 : angle;
            return angle + '°';
        },
    },

    created() {
        this.action.draging = this.model.$draging;
        this.$watch(
            'model',
            (model, oldModel) => {
                this.lazyAddTransition = false;
                this.$nextTick(() => {
                    this.lazyAddTransition = true;
                });

                if (oldModel) {
                    oldModel.$draging = false;
                }
            },
            {
                immediate: true,
            },
        );
    },

    mounted() {
        this.initKeyEvent();
    },
});
