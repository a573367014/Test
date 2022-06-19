import cloneDeep from 'lodash/cloneDeep';
import throttle from 'lodash/throttle';
import isEqual from 'lodash/isEqual';
import pick from 'lodash/pick';

import inherit from '@gaoding/editor-framework/src/utils/vue-inherit';
import utils from '@gaoding/editor-framework/src/utils/utils';
import BaseElement from '@gaoding/editor-framework/src/base/base-element';

import template from './watermark-editor.html';
import { WatermarkEditorModel } from './watermark-editor-model';
import { getRepeat, renderRepeat } from './utils';

export default inherit(BaseElement.createStaticBaseElement(), {
    template,
    name: 'watermark-editor',
    props: ['model', 'currentElement', 'currentLayout', 'global', 'options'],
    filters: {
        angle(angle) {
            angle = Math.round(angle) % 360;
            angle = angle >= 180 ? angle - 360 : angle;
            return angle + '°';
        },
    },
    data() {
        return {
            innerProps: {
                editModel: null,
            },
            shellRect: {
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
            },
            repeatCanvas: null,
            cellCanvas: null,
            watermarkImage: '',
            watermarkWidth: 0,
            watermarkHeight: 0,
            action: {
                scale: false,
                drag: false,
                rotate: false,
            },
        };
    },
    computed: {
        editor() {
            return this.$parent;
        },
        zoom() {
            return this.global.zoom;
        },
        editModel() {
            return this.getEditModel();
        },
        layout() {
            return this.editor.currentLayout;
        },
        boxStyle() {
            const { left, top, right, bottom } = this.shellRect;
            return {
                right: `${-right}px`,
                bottom: `${-bottom}px`,
                left: `${-left}px`,
                top: `${-top}px`,
            };
        },
        outerWatermarkStyle() {
            const { zoom } = this.global;
            const { shellRect, editModel, watermarkImage, watermarkWidth, watermarkHeight } = this;
            const { fullScreenInfo, opacity } = editModel;

            const offsetLeft = fullScreenInfo.left * zoom;
            const offsetTop = fullScreenInfo.top * zoom;
            return {
                backgroundImage: `url(${watermarkImage})`,
                opacity: 0.19 * opacity,
                backgroundSize: `${watermarkWidth * zoom}px ${watermarkHeight * zoom}px`,
                backgroundRepeat: 'repeat',
                backgroundPosition: `${offsetLeft + shellRect.left}px ${
                    offsetTop + shellRect.top
                }px`,
            };
        },

        innerWatermarkStyle() {
            const { zoom } = this.global;
            const { editModel, watermarkImage, watermarkWidth, watermarkHeight, shellRect } = this;
            const { fullScreenInfo, opacity } = editModel;

            const offsetLeft = fullScreenInfo.left * zoom;
            const offsetTop = fullScreenInfo.top * zoom;
            return {
                backgroundImage: `url(${watermarkImage})`,
                opacity: opacity,
                backgroundSize: `${watermarkWidth * zoom}px ${watermarkHeight * zoom}px`,
                backgroundRepeat: 'repeat',
                backgroundPosition: `${offsetLeft}px ${offsetTop}px`,
                left: `${shellRect.left}px`,
                top: `${shellRect.top}px`,
                width: `${editModel.width * zoom}px`,
                height: `${editModel.height * zoom}px`,
            };
        },
        transform() {
            return this.editModel.template.transform;
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
    events: {
        'element.watermarTransformEnd'() {
            this.lazyRenderWatermark();
        },
        'element.dragStart'(element) {
            if (element === this.editModel) {
                this.dragInit();
                this.action.drag = true;
            }
        },
        'element.customDragMove'({ element, dx, dy }) {
            if (element === this.editModel) {
                this.draging(dx, dy);
            }
        },
        'element.dragEnd'(element) {
            if (element === this.editModel) {
                this.dragEnd();
                this.action.drag = false;
            }
        },
        'element.editApply'(model) {
            if (model === this.editModel) {
                this.save();
            }
        },
        'element.editCancel'(model) {
            if (model === this.editModel) {
                this.cancel();
            }
        },
        'element.editReset'(model) {
            if (model === this.editModel) {
                model.$reset();
            }
        },
        'watermarkEditor.scale'(scale) {
            const {
                template: { transform },
            } = this.editModel;
            transform.scale.x = scale;
            transform.scale.y = scale;

            this.lazyRenderWatermark();
            this.action.scale = true;
        },
        'watermarkEditor.rotate'(rotate) {
            const {
                template: { transform },
            } = this.editModel;
            transform.rotation = utils.degToRad(rotate);

            this.lazyRenderWatermark();
        },
        'watermarkEditor.scaleEnd'() {
            this.action.scale = false;
        },
        'watermarkEditor.changeGap'(value) {
            const { fullScreenInfo } = this.editModel;
            fullScreenInfo.colGap = value;
            fullScreenInfo.rowGap = value;
            this.lazyRenderWatermark();
        },
        'watermarkEditor.changeIndent'(value) {
            const { fullScreenInfo } = this.editModel;
            fullScreenInfo.leftIndent = value;
            this.lazyRenderWatermark();
        },
        'base.click'(e) {
            e.preventDefault();
            if (!this.action.scale && !this.action.drag) {
                // 点击空白区域应用修改
                const point = this.editor.pointFromEvent(e);
                const rect = utils.getElementRect(this.editModel, 1);
                if (!utils.pointInRect(point.x, point.y, rect)) {
                    this.save();
                }
            }
        },
    },
    created() {
        this.lastCurrentElement = this.currentElement;

        this.lazyRenderWatermark = throttle(
            () => {
                this.renderWatermark();
            },
            80,
            { leading: false },
        );
    },
    async mounted() {
        this.editor.focusElement(this.editModel);

        this.shellDom = this.editor.container.find('.editor-shell-wrap')[0];
        this.$watch(
            () => {
                const { containerRect, shellRect } = this.editor;
                return [
                    containerRect.width,
                    containerRect.height,
                    shellRect.width,
                    shellRect.height,
                ];
            },
            () => {
                const { offsetTop, offsetLeft, clientWidth, clientHeight } = this.shellDom;
                const offsetRight = offsetLeft + clientWidth;
                const offsetBottom = offsetTop + clientHeight;
                const containerRect = this.editor.containerRect;
                this.shellRect = {
                    left: offsetLeft + containerRect.padding[3],
                    top: offsetTop + containerRect.padding[0],
                    right: containerRect.scrollWidth - offsetRight + containerRect.padding[1],
                    bottom: containerRect.scrollHeight - offsetBottom + containerRect.padding[2],
                };
            },
            {
                immediate: true,
            },
        );

        this.editModel.active = true;

        if (!this.model.$cellCanvas) {
            await this.model.renderCell(this.editor);
        }
        if (!this.model.$repeatCanvas) {
            await this.model.renderRepeat(this.editor);
        }

        this.cellCanvas = this.model.$cellCanvas;
        this.repeatCanvas = this.model.$repeatCanvas;
        this.exportImage();
    },
    methods: {
        getEditModel() {
            const { width, height, fullScreenInfo, template, opacity, lock } = this.model;

            const newTemplate = cloneDeep(template);
            newTemplate.transform = this.model.parseTransform(template.transform);

            const model = new WatermarkEditorModel({
                type: '$watermarker',
                left: 0,
                top: 0,
                width: width,
                height: height,
                opacity: opacity,
                waterType: 1,
                fullScreenInfo: cloneDeep(fullScreenInfo),
                template: newTemplate,
                $customDragMove: true,
                rotatable: false,
                resize: 0,
                lock,
            });
            this.model.$editing = true;

            model.$canReset = () => {
                const props = ['scale'];

                const cache = this.getEditModel();
                return !isEqual(pick(model, props), pick(cache, props));
            };
            const transform = model.template.transform;
            const scaleCache = {
                x: transform.scale.x,
                y: transform.scale.y,
            };
            model.$reset = () => {
                model.scale = scaleCache;
                this.lazyRenderWatermark();
            };

            return model;
        },

        destroyEditModel() {
            const model = this.model;

            if (!model) {
                return;
            }
            if (this.lastCurrentElement && this.currentElement === this.editModel) {
                this.editor.focusElement(this.lastCurrentElement);
            }

            model.$editing = false;
            this.$emit('update:model', null);
        },

        renderWatermark() {
            const { cellCanvas, editModel } = this;
            const repeat = getRepeat(editModel);

            this.repeatCanvas = renderRepeat(cellCanvas, repeat);
            this.exportImage();
        },
        async exportImage() {
            const { repeatCanvas } = this;

            let url;
            if(this.options.resource.blobUrlEnable) {
                url = await new Promise(resolve => {
                    repeatCanvas.toBlob(blob => {
                        resolve(URL.createObjectURL(blob));
                    }, 'image/png', 1);
                });
            }
            else {
                url = repeatCanvas.toDataURL('image/png', 1);
            }

            this.watermarkImage = url;
            this.watermarkWidth = repeatCanvas.width;
            this.watermarkHeight = repeatCanvas.height;
        },

        dragInit() {
            const { left, top } = this.editModel.fullScreenInfo;
            this.$dragCache = { left, top };
        },

        draging(dx, dy) {
            const { fullScreenInfo } = this.editModel;
            const { left, top } = this.$dragCache;
            fullScreenInfo.left = left + dx;
            fullScreenInfo.top = top + dy;
        },

        dragEnd() {
            delete this.$editModel;
        },

        save() {
            const { model, editModel } = this;

            this.destroyEditModel();

            // 重新设置 model.$editing 来优化性能，使用已渲染的 repeatCanvas 来生成水印
            model.$editing = true;
            this.editor.changeElement(
                {
                    opacity: editModel.opacity,
                    fullScreenInfo: editModel.fullScreenInfo,
                    template: {
                        transform: editModel.template.transform,
                    },
                    lock: editModel.lock,
                },
                model,
            );
            model.$repeatCanvas = this.repeatCanvas;
            this.editor.$events.$emit('element.watermarkUpdated', model);

            model.$editing = false;
        },

        cancel() {
            this.destroyEditModel();
        },
    },
});
