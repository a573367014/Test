import { throttle, cloneDeep, pick } from 'lodash';
import Promise from 'bluebird';

import utils from '@gaoding/editor-framework/src/utils/utils';
import inherit from '@gaoding/editor-framework/src/utils/vue-inherit';

import BaseElement from '@gaoding/editor-framework/src/base/base-element';
import { resizeElement } from '@gaoding/editor-framework/src/utils/resize-element';

import template from './group-element.html';
import { resetElementsByMaskInfo } from '@gaoding/editor-framework/src/static/mask-wrap/utils';
import MaskWrap from '@gaoding/editor-framework/src/static/mask-wrap';

export default inherit(BaseElement, {
    name: 'group-element',
    template,
    components: { MaskWrap },
    props: ['global', 'model', 'options', 'editor'],
    data() {
        return {
            resizing: false,
            widthRatio: 1,
            heightRatio: 1,
            ninePatchChild: null,
        };
    },
    computed: {
        scaleStyle() {
            const { resizing, widthRatio, heightRatio } = this;
            if (resizing) {
                return {
                    transform: `scale(${widthRatio}, ${heightRatio})`,
                    transformOrigin: 'left top',
                };
            }
            return {};
        },
        elements() {
            const elements = this.model.elements;
            return resetElementsByMaskInfo(elements);
        },
    },
    methods: {
        load() {
            const { model } = this;
            if (!this.loadDfd) {
                const loadDfd = (this.loadDfd = {
                    loadCount: 0,
                    check(element) {
                        if (model.elements.includes(element)) {
                            loadDfd.loadCount += 1;
                        }
                        if (loadDfd.loadCount >= model.elements.length) {
                            loadDfd.resolve();
                        }
                    },
                });

                loadDfd.promise = new Promise((resolve, reject) => {
                    loadDfd.resolve = resolve;
                    loadDfd.reject = reject;

                    // 无子元素
                    if (!model.elements.length) {
                        resolve();
                    }
                });
            }
            return this.loadDfd.promise;
        },

        // 子元素位置超出时 group 边界重置
        resetBounding() {
            const { model, isDesignMode } = this;
            const { padding, $inWatermark, rotation, autoAdaptive } = model;

            if (
                !isDesignMode ||
                model.$resizeApi ||
                $inWatermark ||
                autoAdaptive === 0b00 ||
                !model.elements.length
            )
                return;

            const getCenterVec = (width, height, rotation) => {
                const x = width / 2;
                const y = height / 2;
                const k1 = Math.cos(rotation);
                const k2 = Math.sin(rotation);
                return [x * k1 - y * k2, x * k2 + y * k1];
            };

            const elements = model.elements;
            const rect = utils.getBBoxByElements(elements);

            rect.width += padding[1] + padding[3];
            rect.height += padding[0] + padding[2];
            rect.left -= padding[3];
            rect.top -= padding[0];

            const { left, top } = rect;
            elements.forEach((element) => {
                // 子组件中心位置保持不变
                element.left -= left;
                element.top -= top;
            });

            const centerVec = getCenterVec(model.width, model.height, rotation);
            const centerVecNew = getCenterVec(rect.width, rect.height, rotation);
            const leftAfterRotate = left * Math.cos(rotation) - top * Math.sin(rotation);
            const topAfterRotate = left * Math.sin(rotation) + top * Math.cos(rotation);
            const centerOffset = [
                leftAfterRotate + centerVecNew[0] - centerVec[0],
                topAfterRotate + centerVecNew[1] - centerVec[1],
            ];

            model.left += centerOffset[0] + (model.width - rect.width) / 2;
            model.width = rect.width;

            model.top += centerOffset[1] + (model.height - rect.height) / 2;
            model.height = rect.height;
        },

        resizeInit(dir) {
            const { model, $cache } = this;
            // const notSupportScaleTypes = [];
            // const supportScaleTypes = ['image', 'mask', 'watermark', 'text', 'svg', 'three-text', 'group'];
            // 最外层 transform scale 即可
            const suportScale = !model.$parentId || this.editor.getParentLayout(model);

            $cache.children = new Map();
            this.editor.walkTemplet(
                (element) => {
                    const cache = pick(element, [
                        'left',
                        'top',
                        'width',
                        'height',
                        'fontSize',
                        'contents',
                        'letterSpacing',
                        'strokeWidth',
                        'effectScale',
                        'radius',
                        '$originalScale',
                    ]);

                    cache.padding = cloneDeep(element.padding);
                    if (element.flex) {
                        cache.flex = cloneDeep(element.flex);
                    }
                    if (element.$paths) {
                        cache.$paths = cloneDeep(element.$paths);
                    }
                    if (element.contents) {
                        cache.contents = cloneDeep(element.contents);
                    }
                    if (element.imageTransform) {
                        cache.imageTransform = cloneDeep(element.imageTransform);
                    }
                    if (element.imageEffects) {
                        cache.imageEffects = cloneDeep(element.imageEffects);
                        cache.effectedResult = cloneDeep(element.effectedResult);
                    }
                    if (element.shadows) {
                        cache.shadows = cloneDeep(element.shadows);
                    }
                    if (element.backgroundEffect && element.backgroundEffect.enable) {
                        cache.backgroundEffect = cloneDeep(element.backgroundEffect);
                    }
                    if (element.border && element.border.enable) {
                        cache.border = cloneDeep(element.border);
                    }

                    // 判断内部元素是否支持使用 scale 缩放
                    // if(notSupportScaleTypes.includes(element.type)) {
                    //     suportScale = false;
                    // }

                    // if(suportScale && element.elements) {
                    //     this.editor.walkTemplet(elem => {
                    //         if(notSupportScaleTypes.includes(elem.type)) {
                    //             suportScale = false;
                    //         }
                    //         return !suportScale;
                    //     }, true, [element]);
                    // }

                    $cache.children.set(element.$id, cache);
                },
                true,
                [this.model],
            );

            $cache.element = {
                dir,
                width: model.width,
                height: model.height,
                padding: {
                    left: $cache.childrenRect.left,
                    right: model.width - $cache.childrenRect.left - $cache.childrenRect.width,
                    top: $cache.childrenRect.top,
                    bottom: model.height - $cache.childrenRect.top - $cache.childrenRect.height,
                },
            };

            this.widthRatio = 1;
            this.heightRatio = 1;
            if (dir) {
                this.resizing = dir.length > 1 && suportScale;
            }
        },

        resizeEnd() {
            delete this.$cache.children;
            delete this.$cache.element;
            this.resizing = false;
        },

        scaleGroup(widthRatio, heightRatio) {
            this.resizeInit();
            this.setSubElementsRatio(widthRatio, heightRatio);
            this.resetBounding();
            this.resizeEnd();
        },

        setSubElementsRatio(widthRatio, heightRatio, dw, dh) {
            const { $cache, model } = this;
            const { dir = '', padding } = this.$cache.element;

            if (model.$resizeApi) return;

            const modifiedElements = [];
            this.editor.walkTemplet(
                (element) => {
                    modifiedElements.push(element);
                    const cache = $cache.children.get(element.$id);

                    if (dir.length === 1 && model.autoGrow) {
                        if (element.type === 'ninePatch') {
                            element.width = cache.width + dw || 0;
                            element.height = cache.height + dh || 0;
                        } else {
                            const paddingLeftRight = padding.left + padding.right;
                            const paddingTopBottom = padding.top + padding.bottom;

                            const _widthRatio =
                                (model.width - paddingLeftRight) /
                                ($cache.element.width - paddingLeftRight);
                            const _heightRatio =
                                (model.height - paddingTopBottom) /
                                ($cache.element.height - paddingTopBottom);

                            element.width = cache.width * _widthRatio;
                            element.left = padding.left + (cache.left - padding.left) * _widthRatio;

                            element.height = cache.height * _heightRatio;
                            element.top = padding.top + (cache.top - padding.top) * _heightRatio;
                        }
                    } else if (dir.length === 2) {
                        resizeElement(element, widthRatio, { cache, sync: true, deep: false });
                    }
                },
                true,
                [this.model],
            );

            !this.resizing && this.editor.makeSnapshotByElement(this.model, false, true);
        },

        updateSubElements() {
            if (!this.isDesignMode) return;
            const { model, $cache } = this;
            const childModelsCache = $cache.children;

            if (!childModelsCache) {
                return;
            }

            const widthRatio = model.width / $cache.element.width;
            const heightRatio = model.height / $cache.element.height;

            this.setSubElementsRatio(
                widthRatio,
                heightRatio,
                model.width - $cache.element.width,
                model.height - $cache.element.height,
            );
        },

        scaleSubElements() {
            const { model, resizing, $cache } = this;
            const childModelsCache = $cache.children;

            if (!childModelsCache) {
                return;
            }

            if (!resizing) {
                return this.updateSubElements();
            }

            const widthRatio = model.width / $cache.element.width;
            const heightRatio = model.height / $cache.element.height;
            this.widthRatio = widthRatio;
            this.heightRatio = heightRatio;
        },

        updateChildrenCache() {
            if (!this.$cache) {
                this.$cache = {
                    heights: {},
                    widths: {},
                };
            }

            const elements = this.model.elements;
            this.$cache.childrenRect = utils.getBBoxByElements(
                elements.filter((el) => el.type !== 'ninePatch'),
            );
            elements.forEach((el) => {
                this.$cache.heights[el.$id] = utils.getBBoxByElement(el).height;
                this.$cache.widths[el.$id] = utils.getBBoxByElement(el).width;
            });
        },
        elementIsGroup(element) {
            return this.editor.isGroup(element);
        },
    },
    events: {
        // load
        'element.loaded'(model) {
            if (this.loadDfd) {
                this.loadDfd.check(model);
            }
        },
        'element.loadError'(ex, model) {
            if (this.loadDfd) {
                this.loadDfd.check(model);
            }

            return true;
        },
        // rect
        'element.rectUpdate'(
            currModel,
            delta = { width: 0, height: 0, align: 'left' },
            isCheckCross = true,
        ) {
            if (!this.isDesignMode) return;
            if (this.editor.global.$draging) return;
            if (this.model.elements.indexOf(currModel) === -1) return;

            const { model, $cache } = this;
            const { elements, autoGrow } = model;

            // 组内元素排版行为
            // 当子元素高度变化时，其他top值 < 其bottom的元素 top += difference
            {
                const bboxs = elements.map((el) =>
                    Object.assign({ $id: el.$id, type: el.type }, utils.getBBoxByElement(el)),
                );

                // 0.1为了避免计算小数点精度问题
                const modifyedBBoxs = bboxs.filter((bbox) => {
                    return (
                        Math.abs(bbox.height - $cache.heights[bbox.$id]) > 0.1 ||
                        Math.abs(bbox.width - $cache.widths[bbox.$id]) > 0.1
                    );
                });

                // 过滤非常规操作
                if (modifyedBBoxs.length === 1) {
                    {
                        const modifyedBBox = modifyedBBoxs[0];
                        const preHeight = $cache.heights[modifyedBBox.$id];
                        const difference = modifyedBBox.height - preHeight;

                        // 与其他bbox存在水平相交
                        const isCross = bboxs.some((bbox) => {
                            return (
                                bbox !== modifyedBBox &&
                                bbox.type !== 'ninePatch' &&
                                modifyedBBox.top < bbox.top + bbox.height &&
                                modifyedBBox.top + preHeight > bbox.top
                            );
                        });

                        (!isCross || !isCheckCross) &&
                            bboxs.forEach((bbox, i) => {
                                if (modifyedBBox.top < bbox.top) {
                                    elements[i].top += difference;
                                }
                            });
                    }

                    {
                        const modifyedBBox = modifyedBBoxs[0];
                        const preWidth = $cache.widths[modifyedBBox.$id];
                        const difference = modifyedBBox.width - preWidth;

                        // 处理文字自增, 位移与对齐方向 同步
                        if (Math.abs(difference) > 0.1) {
                            if (currModel.autoAdaptive & 0b10) {
                                if (delta.align === 'right') currModel.left -= difference;
                                if (delta.align === 'center') currModel.left -= difference / 2;
                            }
                        }

                        // 与其他bbox存在垂直相交
                        const isCross = bboxs.some((bbox) => {
                            return (
                                bbox !== modifyedBBox &&
                                bbox.type !== 'ninePatch' &&
                                modifyedBBox.left < bbox.left + bbox.width &&
                                modifyedBBox.left + preWidth > bbox.left
                            );
                        });

                        const differenceMap = {
                            left: {
                                offsetRight: difference,
                                offsetLeft: 0,
                            },
                            center: {
                                offsetRight: difference / 2,
                                offsetLeft: (difference / 2) * -1,
                            },
                            right: {
                                offsetRight: 0,
                                offsetLeft: difference * -1,
                            },
                        };

                        const differenceItem = differenceMap[delta.align] || differenceMap.left;

                        (!isCross || !isCheckCross) &&
                            bboxs.forEach((bbox, i) => {
                                // 整体向右移动
                                if (modifyedBBox.left < bbox.left) {
                                    elements[i].left += differenceItem.offsetRight;
                                }

                                // 整体向左移动
                                if (modifyedBBox.left > bbox.left) {
                                    elements[i].left += differenceItem.offsetLeft;
                                }
                            });
                    }
                }

                const childrenRect = $cache.childrenRect;
                if (childrenRect) {
                    this.updateChildrenCache();
                    delta.height = $cache.childrenRect.height - childrenRect.height;
                    delta.width = $cache.childrenRect.width - childrenRect.width;
                }

                model.$parentId &&
                    this.$nextTick(() => this.$events.$emit('element.rectUpdate', model, delta));
            }

            const ninePatchChild = this.ninePatchChild;
            // 仅对不处于缩放中的自增文本框组生效
            if (!autoGrow || !ninePatchChild) {
                this.resetBounding();
                return;
            }

            ninePatchChild.width += delta.width;
            ninePatchChild.height += delta.height;

            this.resetBounding();
            this.updateChildrenCache();
        },

        'group.boundingReset'(model) {
            if (model === this.model) {
                this.resetBounding();
            }
        },

        'group.contentScale'(model, ratio) {
            if (model === this.model) {
                this.scaleGroup(ratio, ratio);
            }
        },

        // resize
        'element.transformStart'(model, data) {
            if (model !== this.model) {
                return;
            }

            this.resizeInit(data.dir);
        },

        'element.transformEnd'(model) {
            this.updateSubElements();
            this.resizeEnd();
            this.updateChildrenCache();

            if (model === this.model) {
                this.resetBounding();
            }
        },
    },

    watch: {
        'model.width'(newVal, oldVal) {
            if (!this.isDesignMode) return;

            // 频繁 resize 时可能因为小数点精度，无限循环卡死程序
            // 567.4430728881341 -> 567.4430728881342 ->567.4430728881341 ...
            if (Math.abs(newVal - oldVal) > 0.1) {
                this.resizing ? this.scaleSubElements() : this._lazyScaleSubElements();
            }
        },

        'model.height'(newVal, oldVal) {
            if (!this.isDesignMode) return;

            if (Math.abs(newVal - oldVal) > 0.1) {
                this.resizing ? this.scaleSubElements() : this._lazyScaleSubElements();
            }
        },

        'model.padding': {
            handler() {
                if (this.editor.global.$draging || !this.isDesignMode) return;
                this.resetBounding();
            },
            deep: true,
        },

        'model.elements'() {
            if (this.editor.global.$draging || !this.isDesignMode) return;
            this.resetBounding();
        },
    },

    created() {
        // 缓存子元素高度
        this.updateChildrenCache();

        this._lazyScaleSubElements = throttle(this.scaleSubElements, 1000 / 60);

        let minWidth = 10;
        let minHeight = 10;
        this.model.$getResizeLimit = () => {
            this.editor.walkTemplet(
                (element) => {
                    if (element.$getResizeLimit) {
                        const limit = element.$getResizeLimit();
                        minWidth = Math.max(limit.minWidth, minWidth);
                        minHeight = Math.max(limit.minHeight, minHeight);
                    }
                },
                true,
                [this.model],
            );
            return {
                maxWidth: Infinity,
                minWidth,
                maxHeight: Infinity,
                minHeight,
            };
        };

        this.$watch(
            () => {
                if (this.editor.global.$draging || !this.isDesignMode) return;
                const elements = this.model.elements;
                let hasHr, hasVr;

                const ninePatchChild = elements.find((el) => {
                    return (
                        el.type === 'ninePatch' &&
                        (el.width * el.height) / (this.model.width * this.model.height) > 0.95
                    );
                });

                this.ninePatchChild = ninePatchChild;
                ninePatchChild &&
                    elements.forEach((el) => {
                        if (
                            el.type === 'text' &&
                            (el.writingMode === undefined || el.writingMode === 'horizontal-tb')
                        ) {
                            hasHr = true;
                        } else if (el.writingMode === 'vertical-rl') {
                            hasVr = true;
                        }
                    });

                if (hasVr && hasHr) {
                    return 7;
                } else if (hasVr) {
                    return 3;
                } else if (hasHr) {
                    return 5;
                }
            },
            (resize) => {
                if (this.editor.global.$draging || !this.isDesignMode) return;
                if (!resize) {
                    this.model.resize = 1;
                    this.model.autoGrow = false;
                    return;
                }

                this.model.resize = resize;
                this.model.autoGrow = true;
            },
            {
                immediate: true,
            },
        );
    },

    mounted() {
        this.$nextTick(this.updateChildrenCache);
    },
});
