import $ from '@gaoding/editor-utils/zepto';
import { cloneDeep, pick } from 'lodash';

import utils from '../utils/utils';
import template from './selector.html';
import { counter } from '@gaoding/editor-utils/counter';
import { resizeElement } from '../utils/resize-element';

export default {
    name: 'selector',
    template,
    props: ['layout', 'currentElement'],
    data() {
        return {
            selector: null,
            clickLocked: false,
            maskActived: false,
            mask: {
                height: 0,
                width: 0,
                left: 0,
                top: 0,
            },
            // caches
            keepElementCache: {},
            bboxCaches: {},
            rectCaches: {},
        };
    },
    computed: {
        editor() {
            return this.$parent;
        },
        currentLayout() {
            return this.editor.currentLayout;
        },
        mosaicMode() {
            return this.editor.operateMode === 'mosaic';
        },
        elements() {
            const layout = this.currentLayout;
            let elements = layout ? layout.elements : [];

            if (this.mosaicMode) {
                elements = layout.mosaic.paths;
            }

            return elements;
        },
        selectedElements() {
            return this.editor.selectedElements;
        },
    },
    methods: {
        // elements
        add(element) {
            if (element && !element.$selected && element.type !== 'watermark') {
                element.$selected = true;
                element.$weight = counter.get();
            }
        },
        remove(element) {
            if (element && element.$selected) {
                element.$selected = false;
            }
        },
        clearSelectedElements() {
            this.editor.clearSelectedElements();
        },
        showSelector() {
            const editor = this.editor;
            const elements = this.selectedElements;

            if (!elements.length) {
                return;
            }

            // 阻止 editor 默认 click
            this.preventEditorClick();

            // only one
            if (elements.length === 1) {
                editor.focusElement(elements[0]);
                return;
            }

            // selector element
            const bbox = utils.getBBoxByElements(elements, 1);
            const selector = editor.createElement({
                type: '$selector',
                rotatable: true,
                resize: 1,
                height: bbox.height,
                width: bbox.width,
                left: bbox.left,
                top: bbox.top,
                $guider: { show: true, snapTo: false, marginShow: true },
            });
            selector.elements = elements;

            // 选框缩放限制
            let minWidth = 10;
            let minHeight = 10;
            selector.$getResizeLimit = () => {
                this.editor.walkTemplet(
                    (element) => {
                        if (element.$getResizeLimit) {
                            const limit = element.$getResizeLimit();
                            minWidth = Math.max(limit.minWidth, minWidth);
                            minHeight = Math.max(limit.minHeight, minHeight);
                        }
                    },
                    true,
                    [selector],
                );
                return {
                    maxWidth: Infinity,
                    minWidth,
                    maxHeight: Infinity,
                    minHeight,
                };
            };

            // for transform & toolbar
            editor.focusElement(selector);

            // cache
            this.selector = selector;
        },
        hideSelector() {
            this.clearSelectedElements();
            this.selector = null;
        },
        updateSelector() {
            const editor = this.editor;
            const elements = this.selectedElements;

            if (!elements.length || !this.selector) {
                this.hideSelector();
                return;
            }

            // only one
            if (elements.length === 1) {
                editor.focusElement(elements[0]);
                return;
            }

            // selector element
            const bbox = utils.getBBoxByElements(elements, 1);
            Object.assign(this.selector, {
                height: bbox.height,
                width: bbox.width,
                left: bbox.left,
                top: bbox.top,
                elements: elements,
            });
        },

        // evt handle
        preventEditorClick() {
            this.clickLocked = true;

            setTimeout(() => {
                this.clickLocked = false;
            }, 160);
        },
        checkClickPrevent(e) {
            if (this.clickLocked) {
                e.preventDefault();
            }

            // reset
            this.clickLocked = false;
        },

        // mask
        activeMask(e) {
            const self = this;
            const doc = $(document);
            const editor = this.editor;
            const containerRect = editor.containerRect;

            const drag = (this.drag = {
                pageX: e.pageX,
                pageY: e.pageY,
                startX: e.pageX - containerRect.left + containerRect.scrollLeft,
                startY: e.pageY - containerRect.top + containerRect.scrollTop,
                bboxList: null,
                draging: false,
                append: false,
                cancel(e) {
                    // off event
                    doc.off('mousemove.editor-selector', drag.move);

                    if (drag.draging) {
                        // reset
                        drag.draging = false;
                        self.drag = null;

                        self.$emit('mask.inactive', e, drag);
                        self.$nextTick(() => {
                            self.editor.$events.$emit('selector.inactive', e, drag);
                        });
                    }
                },
                move(e) {
                    e.preventDefault();

                    drag.dx = e.pageX - drag.pageX;
                    drag.dy = e.pageY - drag.pageY;

                    // 防止误触
                    const dOffsetMin = 3;
                    if (
                        !drag.draging &&
                        (Math.abs(drag.dx) >= dOffsetMin || Math.abs(drag.dy) >= dOffsetMin)
                    ) {
                        drag.draging = true;

                        self.$emit('mask.active', e, drag);
                        self.editor.$events.$emit('selector.active', e, drag);
                    }

                    if (drag.draging) {
                        self.$emit('mask.moving', e, drag);
                        self.editor.$events.$emit('selector.moving', e, drag);
                    }
                },
            });

            doc.on('mousemove.editor-selector', drag.move);
            doc.one('mouseup.editor-selector', drag.cancel);
        },
        checkElements() {
            const self = this;
            const mask = this.mask;
            const editor = this.editor;
            const containerRect = editor.containerRect;
            const selectedElements = this.selectedElements;
            const shellRect = editor.shellRect;
            const zoom = editor.zoom;
            const maskRect = {
                left: (mask.left - containerRect.scrollLeft - shellRect.left) / zoom,
                top:
                    (mask.top - containerRect.scrollTop - shellRect.top) / zoom -
                    self.currentLayout.top,
                height: mask.height / zoom,
                width: mask.width / zoom,
                rotate: 0,
            };

            const keepElementsCache = this.keepElementsCache;
            const elements = this.elements;

            elements.forEach((element) => {
                if (keepElementsCache[element.$id]) {
                    return;
                }

                // Ignor locked element and frozen element
                if (element.lock || element.frozen) {
                    return;
                }

                const intersection = utils.getRectIntersection(maskRect, element);

                if (intersection) {
                    self.add(element);
                } else {
                    self.remove(element);
                }
            });

            selectedElements.forEach((selectedElement) => {
                if (selectedElement.lock) editor.unselectElement(selectedElement);
            });
        },
        getElementBBox(element) {
            const bboxCaches = this.bboxCaches;

            if (bboxCaches[element.$id]) {
                return bboxCaches[element.$id];
            }

            bboxCaches[element.$id] = utils.getBBoxByElement(element);

            return bboxCaches[element.$id];
        },

        // caches
        setCaches() {
            const selector = this.selector;
            const elements = this.selectedElements;
            const rectCaches = (this.rectCaches = {});

            this.editor.walkTemplet(
                (element) => {
                    if (this.mosaicMode) {
                        const cache = pick(element, [
                            'left',
                            'top',
                            'width',
                            'height',
                            'strokeWidth',
                        ]);

                        if (element.$paths) {
                            cache.$paths = cloneDeep(element.$paths);
                        }

                        rectCaches[element.$id] = cache;
                    } else {
                        rectCaches[element.$id] = element;
                    }
                },
                true,
                [{ elements }],
            );

            // 性能比 this.editor.$el.querySelector 快近 20 倍，尽量用 getElementsXxx
            const nodes = this.editor.$el.getElementsByClassName('editor-element-selected');
            const nodesMap = {};
            for (const node of nodes) {
                if (node.dataset.id) {
                    nodesMap[node.dataset.id] = node;
                }
            }

            this._elementNodes = !this.mosaicMode
                ? this.selectedElements
                      .map((element) => {
                          delete element.$$transformStyle;
                          return nodesMap[element.$id];
                      })
                      .filter((node) => node)
                : [];

            // cache selector
            rectCaches.selector = {
                top: selector.top,
                left: selector.left,
                width: selector.width,
                height: selector.height,
                rotate: selector.rotate,
            };
        },

        clearCaches() {
            delete this.rectCaches;
            delete this._elementNodes;
        },

        _resize() {
            const selector = this.selector;
            const rectCaches = this.rectCaches;
            const elements = this.selectedElements;
            const ratio = selector.width / rectCaches.selector.width;

            this.editor.walkTemplet(
                (element, parent) => {
                    const cache = rectCaches[element.$id];
                    const { left, top } = cache;
                    resizeElement(element, ratio, { cache, sync: true, deep: false });

                    if (!parent.type) {
                        element.left = (left - rectCaches.selector.left) * ratio + selector.left;
                        element.top = (top - rectCaches.selector.top) * ratio + selector.top;
                    }
                },
                true,
                [{ elements }],
            );
        },
        _rotate() {
            const elements = this.selectedElements;
            elements.forEach((element) => {
                element.rotate = element.$$rotate;
                element.left = element.$$left;
                element.top = element.$$top;

                delete element.$$rotate;
                delete element.$$left;
                delete element.$$top;
            });
        },
        _translate() {
            const elements = this.selectedElements;
            elements.forEach((element) => {
                element.left = element.$$left;
                element.top = element.$$top;
                delete element.$$left;
                delete element.$$top;
            });
        },
    },
    events: {
        // mousedown for mask
        'base.mouseDown'(e) {
            const ignoreElements = [
                '.editor-element',
                '.editor-transform-wrap',
                '.editor-toolbar-wrap',
                '.editor-hover',
                '.editor-temp-group',
            ].join(',');
            const lockElements = ['.editor-element-lock', '.editor-transform-lock'].join();

            const editor = this.editor;
            // 起始位置表层元素是否是锁定元素
            const isLockElement = $(e.target).closest(lockElements).length > 0;
            // 起始位置元素是否是画布内元素
            const isEditorElement = $(e.target).closest(ignoreElements).length > 0;
            if (
                !editor.options.selector ||
                e.ctrlKey ||
                e.button !== 0 ||
                e.isDefaultPrevented() ||
                !editor.currentLayout ||
                editor.currentCropElement ||
                editor.currentEditMask ||
                editor.currentEditWatermark ||
                (isEditorElement && e.altKey) ||
                ((isLockElement ? false : isEditorElement) && !e.altKey)
            ) {
                return;
            }

            this.activeMask(e);
        },
        'base.click'(e) {
            this.checkClickPrevent(e);
        },

        'element.dragStart'(element) {
            const selector = this.selector;
            if (!selector || element !== selector) {
                return;
            }

            this.setCaches();
        },
        'element.dragMove'(drag, element) {
            const selector = this.selector;
            if (!selector || element.$id !== selector.$id) {
                return;
            }

            const rectCaches = this.rectCaches;
            const selectorCache = this.rectCaches.selector;
            const elements = this.selectedElements;

            (this.mosaicMode ? elements : this._elementNodes).forEach((node, i) => {
                const element = elements[i];
                const cache = rectCaches[element.$id];

                element.$$left = cache.left + selector.left - selectorCache.left;
                element.$$top = cache.top + selector.top - selectorCache.top;

                if (this.mosaicMode) return;
                // 直接在 dom 上修改性能会高很多
                const matrix = element.transform.localTransform.clone().prepend({
                    a: 1,
                    b: 0,
                    c: 0,
                    d: 1,
                    tx: (element.$$left - cache.left) * this.editor.zoom,
                    ty: (element.$$top - cache.top) * this.editor.zoom,
                });

                if (element.$$transformStyle === undefined) {
                    element.$$transformStyle = node.style.transform;
                }

                node.style.transform = matrix.toString();
            });

            if (this.mosaicMode) {
                this._translate();
            }
        },
        'element.dragEnd'(element) {
            const selector = this.selector;
            if (!selector || element.$id !== selector.$id) {
                return;
            }

            if (!this.mosaicMode) {
                const elements = this.selectedElements;
                this._elementNodes.forEach((node, i) => {
                    const element = elements[i];
                    node.style.transform = element.$$transformStyle;

                    delete element.$$transformStyle;
                });

                this._translate();
            }

            this.clearCaches();
        },

        'element.transformStart'(element) {
            const selector = this.selector;
            if (!selector || element !== selector) {
                return;
            }
            this.setCaches();
        },

        'element.transformResize'(drag, element) {
            const selector = this.selector;
            if (!selector || element.$id !== selector.$id) {
                return;
            }

            const rectCaches = this.rectCaches;
            const elements = this.selectedElements;
            const ratio = selector.width / rectCaches.selector.width;

            if (this.mosaicMode) {
                this._resize();
                return;
            }

            this._elementNodes.forEach((node, i) => {
                const element = elements[i];
                const cache = rectCaches[element.$id];

                let left = (cache.left - rectCaches.selector.left) * ratio + selector.left;
                let top = (cache.top - rectCaches.selector.top) * ratio + selector.top;

                // 模拟 transform-orign: 0 0
                left = left + (cache.width * ratio - cache.width) / 2;
                top = top + (cache.height * ratio - cache.height) / 2;

                const matrix = element.transform.localTransform.clone().prepend({
                    a: ratio,
                    b: 0,
                    c: 0,
                    d: ratio,
                    tx: (left - cache.left) * this.editor.zoom,
                    ty: (top - cache.top) * this.editor.zoom,
                });

                if (element.$$transformStyle === undefined) {
                    element.$$transformStyle = node.style.transform;
                }

                node.style.transform = matrix.toString();
            });
        },

        'element.transformRotate'(drag, element) {
            const selector = this.selector;
            if (!selector || element.$id !== selector.$id) {
                return;
            }

            const rectCaches = this.rectCaches;
            const elements = this.selectedElements;

            const pivot = {
                x: selector.left + selector.width / 2,
                y: selector.top + selector.height / 2,
            };

            (this.mosaicMode ? elements : this._elementNodes).forEach((node, i) => {
                const element = elements[i];
                const cache = rectCaches[element.$id];
                const rotateChange = selector.rotate - rectCaches.selector.rotate;

                const prePoint = {
                    x: cache.left + cache.width / 2,
                    y: cache.top + cache.height / 2,
                };

                const newPoint = utils.getPointPosition(prePoint, pivot, rotateChange);

                element.$$rotate = cache.rotate + rotateChange;
                element.$$left = cache.left + (newPoint.x - prePoint.x);
                element.$$top = cache.top + (newPoint.y - prePoint.y);

                if (this.mosaicMode) {
                    return;
                }

                if (element.$$transformStyle === undefined) {
                    element.$$transformStyle = node.style.transform;
                }

                const matrix = element.transform.localTransform.clone();
                matrix.rotate(utils.degToRad(element.$$rotate - cache.rotate));
                matrix.prepend({
                    a: 1,
                    b: 0,
                    c: 0,
                    d: 1,
                    tx: (element.$$left - cache.left) * this.editor.zoom,
                    ty: (element.$$top - cache.top) * this.editor.zoom,
                });

                node.style.transform = matrix.toString();
            });

            if (this.mosaicMode) {
                this._rotate();
            }
        },

        'element.transformEnd'(element, drag, { action }) {
            const selector = this.selector;
            if (!selector || element.$id !== selector.$id) {
                return;
            }

            if (action === 'resize' && !this.mosaicMode) {
                const elements = this.selectedElements;

                this._elementNodes.forEach((node, i) => {
                    const element = elements[i];
                    node.style.transform = element.$$transformStyle;
                    delete element.$$transformStyle;
                });

                this._resize();
            } else if (action === 'rotate' && !this.mosaicMode) {
                const elements = this.selectedElements;
                this._elementNodes.forEach((node, i) => {
                    const element = elements[i];
                    node.style.transform = element.$$transformStyle;
                    delete element.$$transformStyle;
                });

                this._rotate();
            }

            this.clearCaches();
        },

        'base.paste'(elements) {
            if (elements.length <= 1) {
                return;
            }

            elements.forEach((element) => {
                element.$selected = true;
                element.$weight = counter.get();
            });

            this.showSelector();
        },
    },
    watch: {
        selectedElements(v) {
            if (!this.currentElement || this.currentElement !== this.selector) return;
            if (!v.length) {
                this.hideSelector();
                this.editor.focusElement(null);
            }
        },
        currentElement(element) {
            if (!this.maskActived && element !== this.selector) {
                this.hideSelector();
            }
        },
    },
    mounted() {
        // mask
        this.$on('mask.active', (e) => {
            if (!e.shiftKey && !e.metaKey) {
                this.clearSelectedElements();
            }

            if (this.editor.mode === 'flow') {
                const point = this.editor.pointFromEvent(e);
                const layout = this.editor.getLayoutByPoint(point);
                if (layout && layout !== this.currentLayout) {
                    this.editor.toggleLayout(layout);
                }
            }

            // clear bbox cahces
            this.bboxCaches = {};

            // currentElement
            const currentElement = this.currentElement;
            if (currentElement) {
                if (e.shiftKey || e.metaKey) {
                    this.add(currentElement);
                }

                this.editor.focusElement(null);
            }

            // keepElementsCache
            const keepElementsCache = (this.keepElementsCache = {});
            const selectedElements = this.editor.getSelectedElements();
            if (selectedElements.length > 0) {
                selectedElements.forEach((element) => {
                    keepElementsCache[element.$id] = true;
                });
            }

            this.maskActived = true;
        });

        this.$on('mask.inactive', () => {
            this.maskActived = false;

            this.showSelector();
            this.preventEditorClick();
        });

        this.$on('mask.moving', (e, drag) => {
            const mask = this.mask;
            const dx = drag.dx;
            const dy = drag.dy;

            mask.top = dy > 0 ? drag.startY : drag.startY + dy;
            mask.left = dx > 0 ? drag.startX : drag.startX + dx;
            mask.height = Math.abs(dy);
            mask.width = Math.abs(dx);

            this.checkElements(drag);
        });
    },
    beforeDestroy() {
        this.$emit('destroy');
    },
};
