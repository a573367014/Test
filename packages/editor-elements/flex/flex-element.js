import throttle from 'lodash/throttle';
import pick from 'lodash/pick';
import cloneDeep from 'lodash/cloneDeep';

import inherit from '@gaoding/editor-framework/src/utils/vue-inherit';
import BaseElement from '@gaoding/editor-framework/src/base/base-element';
import EditorDefaults from '@gaoding/editor-framework/src/base/editor-defaults';
import { FlexShadow } from './flex-shadow';

import template from './flex-element.html';
import { resizeElement } from '@gaoding/editor-framework/src/utils/resize-element';

export default inherit(BaseElement, {
    name: 'flex-element',
    template,
    data() {
        return {
            resizing: false,
            widthRatio: 1,
            heightRatio: 1,
            $innerUpdate: false,
        };
    },
    computed: {
        shadowRoot() {
            const {
                autoAdaptive,
                flexDirection,
                justifyContent,
                alignItems,
                alignContent,
                flexWrap,
                width,
                height,
                padding,
            } = this.model;
            return {
                autoAdaptive,
                flexDirection,
                justifyContent,
                alignItems,
                alignContent,
                flexWrap,
                width,
                height,
                padding,
            };
        },
        shadowModels() {
            const { elements } = this.model;
            return elements.map((element) => {
                const { flex = EditorDefaults.flex, width, height, type, $id, hidden } = element;
                const { alignSelf, flexGrow, flexShrink, flexBasis, margin } = flex || {};
                return {
                    $id,
                    width,
                    height,
                    type,
                    alignSelf,
                    flexGrow,
                    flexShrink,
                    flexBasis,
                    margin,
                    hidden,
                };
            });
        },
        calcMargin() {
            const { visibleElements, model } = this;
            const { width, height } = model;
            const length = visibleElements.length;
            let subWidthSum = 0;
            let subHeightSum = 0;

            visibleElements.forEach((element) => {
                const { width, height } = element;
                subWidthSum += width;
                subHeightSum += height;
            });

            const rowMargin = (width - subWidthSum) / (length - 1);
            const columnMargin = (height - subHeightSum) / (length - 1);
            if ((this.isRow && rowMargin < 0) || (!this.isRow && columnMargin < 0))
                return [0, 0, 0, 0];
            return this.isRow ? [0, rowMargin, 0, 0] : [0, 0, columnMargin, 0];
        },
        isRow() {
            return this.model.flexDirection === 'row';
        },
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
        visibleElements() {
            const { elements } = this.model;
            return elements.filter((element) => !element.hidden);
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
                }).then(() => {
                    return this.syncRect();
                });
            }
            return this.loadDfd.promise;
        },
        resizeInit(data) {
            const { dir } = data;
            if (['sw', 'nw', 'ne', 'se'].includes(dir)) {
                this.resizing = true;
                this.$childModelsCache = new Map();
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
                        cache.flex = cloneDeep(element.flex);
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
                        this.$childModelsCache.set(element.$id, cache);
                    },
                    true,
                    [this.model],
                );

                this.$elementCache = {
                    dir,
                    width: this.model.width,
                    height: this.model.height,
                };

                this.widthRatio = 1;
                this.heightRatio = 1;
            }
        },

        resize() {
            if (this.resizing) {
                this.updateSubElements();
            }
        },

        resizeEnd() {
            this.resizing = false;
            this.updateSubElements();

            delete this.$childModelsCache;
            delete this.$elementCache;
        },

        setSubElementsRatio(widthRatio) {
            const { $childModelsCache, model } = this;
            const { dir = '' } = this.$elementCache;

            this.editor.walkTemplet(
                (element) => {
                    const cache = $childModelsCache.get(element.$id);
                    if (!cache) return;
                    if (dir.length === 2) {
                        resizeElement(element, widthRatio, { cache, sync: true, deep: false });
                    }
                },
                true,
                [model],
            );

            !this.resizing && this.editor.makeSnapshotByElement(this.model, false, true);
        },

        updateSubElements() {
            const { model } = this;
            const childModelsCache = this.$childModelsCache;

            if (!childModelsCache) {
                return;
            }

            const widthRatio = model.width / this.$elementCache.width;
            const heightRatio = model.height / this.$elementCache.height;

            // this.widthRatio = widthRatio;
            // this.heightRatio = heightRatio;
            this.setSubElementsRatio(
                widthRatio,
                heightRatio,
                model.width - this.$elementCache.width,
                model.height - this.$elementCache.height,
            );
        },

        elementIsGroup(element) {
            return this.editor.isGroup(element);
        },

        syncMargin() {
            if (!this.model.autoAdaptive) return;

            const margin = this.calcMargin;
            const { elements } = this.model;
            const modelMargin = elements[0].flex.margin;
            const length = elements.length;

            const isSynced = this.isRow
                ? modelMargin[1] === margin[1]
                : modelMargin[2] === margin[2];
            if (isSynced) return;

            elements.forEach((element, index) => {
                if (index === length - 1) {
                    element.flex.margin = [0, 0, 0, 0];
                    return;
                }
                element.flex.margin = [...margin];
            });
        },

        resetBounding(width, height) {
            const getCenterVec = (width, height, rotation) => {
                const x = width / 2;
                const y = height / 2;
                const k1 = Math.cos(rotation);
                const k2 = Math.sin(rotation);
                return [x * k1 - y * k2, x * k2 + y * k1];
            };

            const model = this.model;
            const { rotation } = model;
            const left = 0;
            const top = 0;
            const centerVec = getCenterVec(model.width, model.height, rotation);
            const centerVecNew = getCenterVec(width, height, rotation);
            const leftAfterRotate = left * Math.cos(rotation) - top * Math.sin(rotation);
            const topAfterRotate = left * Math.sin(rotation) + top * Math.cos(rotation);
            // model.elements.forEach(element => {
            //     // 子组件中心位置保持不变
            //     element.left -= left;
            //     element.top -= top;
            // });
            const centerOffset = [
                leftAfterRotate + centerVecNew[0] - centerVec[0],
                topAfterRotate + centerVecNew[1] - centerVec[1],
            ];
            model.left += centerOffset[0] + (model.width - width) / 2;
            model.top += centerOffset[1] + (model.height - height) / 2;
            model.width = width;
            model.height = height;
        },

        calculateLayout(delta) {
            // $disabledCalc 控制 flex 是否计算布局
            if (!this.isDesignMode || this.model.$disabledCalc) {
                return;
            }

            const { shadowModels, shadowRoot, autoAdaptive } = this;
            const { alignItems } = this.model;

            if (delta) {
                const { width, height } = delta;
                if ((autoAdaptive & 0b10) !== 0 && width !== 0) {
                    shadowRoot.width += width;
                }

                if ((autoAdaptive & 0b01) !== 0 && height !== 0) {
                    shadowRoot.height += height;
                }
            }

            this.shadow.setRoot(shadowRoot);
            this.shadow.setNodes(shadowModels);

            const { width, height, elements } = this.model;
            const shadowContainer = this.shadow.getRootSize();
            if (shadowContainer.width === 0 || shadowContainer.height === 0) return;

            elements.forEach((element) => {
                const { $id, autoAdaptive, fontSize, type } = element;
                const shadowElement = this.shadow.getNodeSize($id);
                let { left, top, width, height } = shadowElement;
                element.left = left;
                element.top = top;

                // 修正收缩时文字溢出;
                if ((autoAdaptive & 0b10) === 0 && width !== 0) {
                    if (type === 'text' && width < fontSize) width = fontSize;
                    element.width = width;
                }
                if ((autoAdaptive & 0b01) === 0 && height !== 0) {
                    if (type === 'text' && height < fontSize) height = fontSize;
                    element.height = height;
                }

                this.$events.$emit('element.syncRect', element);
            });

            if (
                Math.abs(width - shadowContainer.width) > 0.1 ||
                Math.abs(height - shadowContainer.height) > 0.1
            ) {
                this.resetBounding(shadowContainer.width, shadowContainer.height);
                this.$innerUpdate = true;
                this.$events.$emit('element.rectUpdate', this.model, {
                    width: this.model.width - width,
                    height: this.model.height - height,
                });
            }

            // 文字宽高自增时，文字自增的宽高偏移方向 和 flex组元素对齐方向 同步
            if (delta) {
                const offsetNum = this.isRow
                    ? this.model.height - height
                    : this.model.width - width;
                if (alignItems === 'center' && offsetNum !== 0)
                    this.model[this.isRow ? 'top' : 'left'] -= offsetNum / 2;
                if (alignItems === 'flex-end' && offsetNum !== 0)
                    this.model[this.isRow ? 'top' : 'left'] -= offsetNum;
            }
        },

        lazyCalculateLayout() {
            if (!this._lazyCalculateLayout) {
                this._lazyCalculateLayout = throttle(
                    () => {
                        this.calculateLayout();
                    },
                    50,
                    { leading: false, trailing: true },
                );
            }
            this._lazyCalculateLayout();
        },

        syncRect() {
            this.calculateLayout();
        },
    },

    events: {
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
        'element.rectUpdate'(currModel, delta = { width: 0, height: 0 }) {
            const { model, resizing } = this;
            const { elements } = model;
            if (resizing) return;
            if (elements.indexOf(currModel) >= 0) {
                this.calculateLayout(delta);
            }
        },
        'group.contentScale'(model, ratio) {
            if (model === this.model) {
                this.scaleGroup(ratio, ratio);
            }
        },
        'element.transformStart'(model, data) {
            this.transforming = true;
            if (model !== this.model) {
                return;
            }
            this.resizeInit(data);
        },
        'element.transformResize'(drag, model) {
            if (model !== this.model) {
                return;
            }
            if (['se', 'ne', 'sw', 'nw'].includes(drag.dir)) {
                this.widthRatio = model.width / this.$elementCache.width;
                this.heightRatio = model.height / this.$elementCache.height;

                return;
            }
            // 布局前，先将 间距 同步到 flex-margin
            this.syncMargin();
            this.lazyCalculateLayout();
            this.resize(drag);
        },
        'element.transformEnd'(model) {
            if (model !== this.model) {
                return;
            }

            this.transforming = false;
            this.resizeEnd();
            // 布局前，先将 间距 同步到 flex-margin
            this.syncMargin();
            this.lazyCalculateLayout();
        },
    },
    mounted() {
        this.shadow = new FlexShadow(this.$refs.shadowContainer);

        this.model.$getResizeLimit = () => ({
            maxWidth: Infinity,
            minWidth: 20,
            maxHeight: Infinity,
            minHeight: 20,
        });

        this.$watch(
            function () {
                return [this.shadowRoot, this.shadowModels];
            },
            function () {
                if (!this.editor.global.$draging) {
                    this.calculateLayout();
                }
            },
        );
    },
});
