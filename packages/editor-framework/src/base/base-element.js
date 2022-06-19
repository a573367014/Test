/**
 * BaseElement
 * 编辑器元素基础组件，编辑器中的可编辑元素均直接继承它，以获得基本的渲染与事件绑定
 */

import $ from '@gaoding/editor-utils/zepto';
import noop from 'lodash/noop';
import isArray from 'lodash/isArray';
import get from 'lodash/get';
import Promise from 'bluebird';

import utils from '../utils/utils';
import inherit from '../utils/vue-inherit';
import Draggable from '../base/draggable';
import editorDefaults from './editor-defaults';
import { isGroup } from '@gaoding/editor-utils/element';
import ElementCommon from '../static/element-common';

const BaseElement = inherit(Draggable, {
    name: 'base-element',
    components: {
        ElementCommon,
    },
    props: ['isWatermarkChildren', 'editor', 'options'],
    data() {
        return {
            dragLocked: false,
            errorMessage: '',
        };
    },
    watch: {
        'model.$editing'() {
            this.model.$blinking = false;
        },
    },
    computed: {
        zoom() {
            return this.global.zoom;
        },

        isDesignMode() {
            return this.options.mode === 'design' || this.options.mode === 'flow';
        },

        isPreviewMode() {
            return this.options.mode === 'preview';
        },

        isInEditor() {
            let parent = this.$parent;
            while (parent) {
                if (parent === this.editor) return true;
                parent = parent.$parent;
            }
            return false;
        },

        // FIXME 应基于 definitions 配置动态生成各 is-computed
        isSvg() {
            return this.model.type === 'svg';
        },
        isMask() {
            return this.model.type === 'mask';
        },
        isText() {
            return this.model.type === 'text';
        },
        isEffectText() {
            return this.model.type === 'effectText';
        },
        isImage() {
            return this.model.type === 'image';
        },
        isVideo() {
            return this.model.type === 'video';
        },
        isGroup() {
            return isGroup(this.model);
        },
        isStyledText() {
            return this.model.type === 'styledText';
        },
        isChart() {
            return this.model.type === 'chart';
        },
        isThreeText() {
            return this.model.type === 'threeText';
        },
        isWatermark() {
            return this.model.type === 'watermark';
        },
        isLine() {
            return this.model.type === 'line';
        },
        isArrow() {
            return this.model.type === 'arrow';
        },
        isRect() {
            return this.model.type === 'rect';
        },
        isEllipse() {
            return this.model.type === 'ellipse';
        },
        transform() {
            return this.isWatermarkChildren ? '' : this.model.transform;
        },
        rect() {
            const { model } = this;
            const { zoom } = this.global;

            return utils.getElementRect(model, zoom);
        },

        opacity() {
            const { opacity, maskInfo } = this.model;
            if (maskInfo && maskInfo.enable && !maskInfo.showSelf) {
                return 0;
            }
            return opacity > 0.999 ? null : opacity;
        },
        padding() {
            const { rect } = this;

            return rect.padding.join('px ') + 'px';
        },
        boxShadow() {
            // {color: '#00FF00FF', offsetX: 2, offsetY: 4, blurRadius: 5, spreadRadius: 0}
            const data = this.model.boxShadow;

            if (!data) {
                return '';
            }
            return [
                data.offsetX + 'px',
                data.offsetY + 'px',
                data.blurRadius + 'px',
                data.spreadRadius + 'px',
                data.color,
            ].join(' ');
        },
        borderRadius() {
            const { borderRadius } = this.model;
            if (borderRadius) {
                if (borderRadius < 1) {
                    return borderRadius * 100 + '%';
                } else {
                    return borderRadius * this.global.zoom + 'px';
                }
            }
            return 0;
        },
        isFilters() {
            const { filter } = this.model;
            const filterKeys = Object.keys(filter);
            return (
                filterKeys.some((key) => filter[key] !== editorDefaults.element.filter[key]) &&
                (!this.model.filterInfo ||
                    !this.model.filterInfo.url ||
                    !this.model.filterInfo.prunedZipUrl)
            );
        },
        isShowBlink() {
            const { model, options, isMask, isImage } = this;
            const { frozen, hidden, editable, $loaded, $blinking } = model;

            const flag =
                (options.mode === 'design' || options.mode === 'flow') &&
                $blinking &&
                !frozen &&
                !hidden &&
                editable;

            if (isMask || isImage) {
                return $loaded && flag;
            }
            return !this.isGroup && flag;
        },
        baseStyle() {
            const { rect, opacity } = this;

            return {
                height: rect.height + 'px',
                width: rect.width + 'px',
                transform: this.transform ? this.transform.toString() : '',
                left: rect.left + 'px',
                top: rect.top + 'px',
                opacity: opacity,
            };
        },

        bdImageUrl() {
            return (
                get(this.model, 'border.enable') &&
                get(this.model, 'border.type') === 'image' &&
                get(this.model, 'border.image')
            );
        },
        bgImageUrl() {
            return (
                get(this.model, 'backgroundEffect.enable') &&
                get(this.model, 'backgroundEffect.type') === 'image' &&
                get(this.model, 'backgroundEffect.image.url')
            );
        },
        bgNinePatchUrl() {
            return (
                get(this.model, 'backgroundEffect.enable') &&
                get(this.model, 'backgroundEffect.type') === 'ninePatch' &&
                get(this.model, 'backgroundEffect.ninePatch.url')
            );
        },
        bgNinePatch() {
            if (this.bgNinePatchUrl) {
                return Object.assign({}, get(this.model, 'backgroundEffect.ninePatch'), {
                    width: this.model.width,
                    height: this.model.height,
                    left: 0,
                    top: 0,
                    opacity: this.model.backgroundEffect.opacity,
                });
            }
        },
    },
    methods: {
        getRect() {
            let element = $(this.$el);
            let innerElement = element.find('.element-main');
            const isText = this.isText || this.isStyledText || this.isEffectText;
            const zoom = isText ? this.global.zoom : 1;

            if (isText && this.model.$editing) {
                innerElement = $('.editor-text-editor .element-main');
            }

            if (innerElement.length) {
                element = innerElement;
            }

            const height = element.prop('offsetHeight') || 0;
            const width = element.prop('offsetWidth') || 0;

            return {
                height: height * zoom,
                width: width * zoom,
            };
        },
        isInSelector(model) {
            return model.type === '$selector' && model.elements.includes(this.model);
        },

        isModelRelative(model) {
            return model === this.model || this.isInSelector(model);
        },

        updateRect() {
            const { model } = this;
            const { zoom } = this.global;
            const rect = this.getRect();

            const height = rect.height / zoom;
            const width = rect.width / zoom;
            let hasUpdated = false;

            const delta = { width: 0, height: 0 };

            // 延迟调用 updateRect 时，dom 可能并不存在，getRect 获取的宽高可能为 0
            if (!(height > 0 && width > 0)) return;

            if (Math.abs(width - model.width) > 0.1) {
                delta.width = width - model.width;
                model.width = width;

                hasUpdated = true;
            }
            if (Math.abs(height - model.height) > 0.1) {
                delta.height = height - model.height;
                model.height = height;

                hasUpdated = true;
            }

            if (hasUpdated && this.isDesignMode && !isGroup(model)) {
                this.$events.$emit('element.rectUpdate', model, delta);
            }
        },
        syncRect: noop,

        checkLoad(...rest) {
            const model = this.model;

            // loaded
            model.$loaded = false;

            return Promise.try(() => {
                const promises = [this.load(...rest)];
                const watermarkUrl = model.watermarkEnable
                    ? get(this.options, 'watermarkImages.element')
                    : null;
                [this.bdImageUrl, this.bgImageUrl, this.bgNinePatchUrl, watermarkUrl].forEach(
                    (url) => {
                        url && promises.push(utils.loadImage(url));
                    },
                );

                return Promise.all(promises);
            })
                .then(() => {
                    model.$loaded = true;
                    this.$events.$emit('element.loaded', model);
                })
                .catch((ex) => {
                    model.$loaded = true;
                    this.$events.$emit('element.loadError', ex, model);
                });
        },
        load() {
            return Promise.delay(16);
        },
        hideBlink() {
            this.model.$blinking = false;
        },

        /**
         * 是否与目标元素建立链接
         * @param { element } element
         */
        isLinkWith(element) {
            const model = this.model;
            if (!element || !model.linkId || element === model) {
                return false;
            }

            if (element.type === '$selector') {
                return element.elements.some((element) => {
                    return element.linkId === model.linkId;
                });
            } else {
                return element.linkId === model.linkId;
            }
        },
    },
    events: {
        'base.click'(e) {
            if (!this.isDesignMode) return;
            if (this.dragLocked) {
                e.preventDefault();

                // reset
                this.dragLocked = false;
            }

            // 继续向下广播
            return true;
        },
        'base.dragStart'(model) {
            if (!this.isDesignMode) return;
            if (this.model === model) {
                this.dragLocked = true;
                this.$events.$emit('element.dragStart', model);
            }
        },
        'base.dragEnd'(model) {
            if (!this.isDesignMode || this.$options.name === 'transform') return;

            if (this.model === model) {
                setTimeout(() => {
                    this.dragLocked = false;
                }, 160);

                if (this.model.type !== 'collage') {
                    this.$events.$emit('element.dragEnd', model);
                } else {
                    // 修复拼图内拖拽图片位置产生两个 snapshot
                    this.$nextTick(() => {
                        this.$events.$emit('element.dragEnd', model);
                    });
                }
            }
        },
        'base.dragMove'(drag, model, e) {
            if (!this.isDesignMode) return;
            if (this.model === model) {
                this.$events.$emit('element.dragMove', drag, model, e);
            }
        },
        'element.syncRect'(model) {
            if (this.model === model) {
                this.syncRect();
            }
        },
    },
    created() {
        // 可能在 setTemplet 后先于 load 执行一些操作，故使用异步执行
        // setTimeout(() => this.checkLoad());
    },
    mounted() {
        this.$nextTick(this.checkLoad);
    },
    beforeDestroy() {
        this.hideBlink();
    },
});

BaseElement.createStaticBaseElement = (data) =>
    (data || BaseElement).map((config) => {
        let result = config;
        if (isArray(config.props)) {
            result = {
                ...result,
                // conflict with computed property `editor`
                props: config.props.filter((prop) => prop !== 'editor'),
            };
        }
        return result;
    });

export default BaseElement;
