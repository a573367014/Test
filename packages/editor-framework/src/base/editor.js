/**
 * @class Editor
 * @description 编辑器属性
 */
import $ from '@gaoding/editor-utils/zepto';
import { cloneDeep, merge, forEach, defaultsDeep, debounce } from 'lodash';
import { ServiceManager } from './service';
import { counter } from '@gaoding/editor-utils/counter';

import elementMethodsGetter from './methods/element';
import layoutMethods from './methods/layout';
import templetMethodsGetter from './methods/templet';
import snapshotMethods from './methods/snapshot';
import miscMethods from './methods/misc';
import dataBindingMethods from './methods/data-binding';
import exportMethods from './methods/export';
import effectMethods from './methods/effect';

import template from './editor.html';
import editorDefaults from './editor-defaults';
import { LayerPicker } from '../utils/layer-picker/src/layer-picker';
import { getLayers } from '../utils/layer-picker-rules';
import { transformResize } from '../utils/resize-element';
import RendererManage from '../utils/renderer/manage';

const view = $(window);

// 由 definitions 获得组件 name 字段
export const getComponentName = (definitions) => {
    if (Array.isArray(definitions)) {
        return definitions[definitions.length - 1].name;
    } else if (typeof definitions === 'function') {
        return definitions.options.name;
    } else {
        return definitions.name || '';
    }
};

const mergeEditorProps = (Vue, models, definitionMethods, asyncElementsMap) => ({
    props: ['editorOptions'],
    template,
    data() {
        return {
            /**
             * 编辑器版本号
             * @memberof Editor
             * @member {String}
             */
            version: editorDefaults.version,

            type: 'poster',

            supportTypes: ['common'],

            layouts: [],

            // inner props
            innerProps: {
                options: cloneDeep(editorDefaults.options),
                global: merge({}, editorDefaults.global, editorDefaults.globalExts),
                currentLayout: null,
                currentElement: null,
                currentSubElement: null,
                snapshotSize: 0,
                snapshotable: true,

                croper: null,
                toolbar: null,
                selector: null,
                transform: null,
                contextmenu: null,
            },

            clipboard: [],

            snapshotSize: 0,
            hasRedo: false,
            hasUndo: false,

            containerRect: {
                topOffset: 0,
                scrollLeft: 0,
                scrollTop: 0,
                scrollWidth: 0,
                scrollHeight: 0,
                padding: 0,
                paddingTopBottom: 0,
                paddingLeftRight: 0,
                paddingCss: '',
                height: 0,
                width: 0,
                left: 0,
                top: 0,
            },
            shellRect: {
                height: 0,
                width: 0,
                left: 0,
                top: 0,
            },

            // 当前裁剪元素
            currentCropElement: null,

            //  当前hover的元素
            currentHoverElement: null,

            // 当前编辑蒙版
            currentEditMask: null,

            // 当前富文本实例
            currentRichText: null,

            // 包含当前选区的状态值
            currentTextSelection: null,

            // 当前编辑水印
            currentEditWatermark: null,

            // 当前抠图元素
            currentMattingElement: null,
        };
    },

    computed: {
        options: {
            get() {
                return this.innerProps.options;
            },
            set(options) {
                forEach(options, (val, k) => {
                    this.innerProps.options[k] = val;
                });
            },
        },
        global: {
            get() {
                return this.innerProps.global;
            },
            set(global) {
                global = defaultsDeep(global, editorDefaults.global, editorDefaults.globalExts);

                // reset drag
                global.$draging = false;

                this.innerProps.global = global;
            },
        },

        /**
         * 编辑器当前选中的{@link module:editorDefaults.layout|layout},
         * 编辑器每次只有一个当前{@link module:editorDefaults.layout|layout}
         * @memberof Editor
         * @member {layout} currentLayout
         */
        currentLayout: {
            get() {
                return this.innerProps.currentLayout;
            },
            set(layout) {
                this.innerProps.currentLayout = layout;
            },
        },

        /**
         * 编辑器当前选中的元素{@link module:editorDefaults.element|element}
         * @memberof Editor
         * @member {element} currentElement
         */
        currentElement: {
            get() {
                return this.innerProps.currentElement;
            },
            set(element) {
                const innerProps = this.innerProps;

                if (element !== innerProps.currentElement) {
                    innerProps.currentElement = element;

                    this.currentSubElement = null;
                }
            },
        },

        /**
         * 当前元素`currentElement`为组元素{@link module:editorDefaults.groupElement|groupElement}时，
         * 组元素中被编辑器当前选中的元素{@link module:editorDefaults.element|element}
         * @memberof Editor
         * @member {element} currentSubElement
         */
        currentSubElement: {
            get() {
                return this.innerProps.currentSubElement;
            },
            set(element) {
                const innerProps = this.innerProps;
                const lastSubElement = innerProps.currentSubElement;

                if (lastSubElement) {
                    lastSubElement.$selected = false;
                }

                if (element) {
                    element.$selected = true;
                    element.$weight = counter.get();
                }

                innerProps.currentSubElement = element;
            },
        },

        /**
         * 包含当前选区的状态值
         * @memberof Editor
         * @member {Object} currentSelection
         * @example {
            "fontSize": 142.7,
            "fontWeight": 400,
            "fontStyle": "italic",
            "fontFamily": "ReeJi-BigRuixain-BoldGBV1.0-Regular",
            "color": "rgb(255, 255, 255)",
            "textDecoration": "none",
            "fontSizeMixed": false,
            "fontWeightMixed": false,
            "fontStyleMixed": false,
            "fontFamilyMixed": false,
            "colorMixed": false,
            "textDecorationMixed": false
        }
         */
        currentSelection() {
            return this.currentTextSelection;
        },

        /**
         * 编辑器显示模式: 枚举值`design`编辑模式、`flow`流模式、`preview`预览模式、`mirror`镜像模式
         * @memberof Editor
         * @member {string}
         */
        mode: {
            get() {
                return this.options.mode;
            },
            set(mode) {
                const supportModes = ['design', 'preview', 'mirror', 'flow'];

                if (supportModes.indexOf(mode) === -1) {
                    mode = 'design';
                }

                this.options.mode = mode;
            },
        },

        /**
         * 编辑器操作模式: 枚举值`mosaic`马赛克模式、`空值`常规模式
         * @memberof Editor
         * @member {string}
         */
        operateMode: {
            get() {
                return this.options.operateMode;
            },
            set(mode) {
                const supportModes = ['mosaic'];

                if (supportModes.indexOf(mode) === -1) {
                    mode = '';
                }

                this.options.operateMode = mode;
            },
        },

        /**
         * 编辑器的显示缩放比例
         * @memberof Editor
         * @member {number}
         */
        zoom: {
            get() {
                return this.global.zoom || 1;
            },
            set(zoom) {
                this.global.zoom = zoom;
            },
        },

        /**
         * 当前layout的高度
         * @memberof Editor
         * @member {number}
         */
        height: {
            get() {
                if (this.mode === 'flow') {
                    return this.layouts.reduce((prev, next) => {
                        return prev + next.height;
                    }, 0);
                }

                const currentLayout = this.currentLayout;
                if (!currentLayout) {
                    return 0;
                }

                return currentLayout.height;
            },
            set(height) {
                const currentLayout = this.currentLayout;
                if (currentLayout) {
                    currentLayout.height = height;

                    this.makeSnapshot('resize_layout');
                }
            },
        },

        /**
         * 当前layout的宽度
         * @memberof Editor
         * @member {number}
         */
        width: {
            get() {
                const currentLayout = this.currentLayout;
                if (!currentLayout) {
                    return 0;
                }

                return currentLayout.width;
            },
            set(width) {
                const currentLayout = this.currentLayout;
                if (currentLayout) {
                    currentLayout.width = width;

                    this.makeSnapshot('resize_layout');
                }
            },
        },

        /**
         * 当前编辑器是否是编辑模式：{@link Editor.mode|mode} 为 `design` 和 `flow`
         * @memberof Editor
         * @member {boolean}
         * @readonly
         */
        editable() {
            return this.mode === 'design' || this.mode === 'flow';
        },

        /**
         * 框选选中的元素`element`数组
         * @memberof Editor
         * @readonly
         * @member {Arrary.<element>}
         * @return {Array.<element>}
         */
        selectedElements() {
            return this.getSelectedElements();
        },

        /**
         * 当前已注册支持的元素类型
         * @memberof Editor
         * @readonly
         * @member {Object}
         * @example { group: true, text: true }
         */
        supportTypesMap() {
            const supportTypes = this.supportTypes || [];
            return supportTypes.reduce((res, type) => {
                res[type] = true;
                return res;
            }, {});
        },

        // 此处故意用 map 对象，响应式存在较大开销
        elementsMap() {
            const map = new Map();
            this.walkTemplet(
                (el) => {
                    map.set(el.uuid, el);
                },
                true,
                this.layouts,
            );

            return map;
        },
        selector: {
            get() {
                return this.innerProps.selector;
            },
            set(val) {
                this.innerProps.selector = val;
            },
        },
        transform: {
            get() {
                return this.innerProps.transform;
            },
            set(val) {
                this.innerProps.transform = val;
            },
        },
        croper: {
            get() {
                return this.innerProps.croper;
            },
            set(val) {
                this.innerProps.croper = val;
            },
        },
        toolbar: {
            get() {
                return this.innerProps.toolbar;
            },
            set(val) {
                this.innerProps.toolbar = val;
            },
        },
        contextmenu: {
            get() {
                return this.innerProps.contextmenu;
            },
            set(val) {
                this.innerProps.contextmenu = val;
            },
        },
    },

    methods: {
        ...elementMethodsGetter(Vue, models, asyncElementsMap),
        ...layoutMethods,
        ...templetMethodsGetter(asyncElementsMap),
        ...snapshotMethods,
        ...dataBindingMethods,
        ...miscMethods,
        ...definitionMethods,
        ...exportMethods,
        ...effectMethods,
    },

    events: {
        'templet.created'() {
            const { width, containerRect } = this;

            // 长页模式下缩放为容器区域的一半宽度；单页模式下适应屏幕
            if (this.mode === 'flow') {
                const halfContainerWidth = containerRect.width / 2;
                const defaultZoom = Math.min(halfContainerWidth / width, 1);
                this.zoomTo(defaultZoom);
                // 由于 zoomTo 会进行一定的 scrollTop 偏移，故此处进行重置
                this.$el.scrollTop = 0;
            } else if (this.options.autoFitZoom) {
                this.fitZoom();
            }

            // 防止切换模板时抖动、立即调用一次
            this.$nextTick(() => {
                this.updateContainerRect();
            });
        },

        'base.resize'() {
            clearTimeout(this.resizeFitZoomTimer);

            if (this.options.autoFitZoom) {
                this.resizeFitZoomTimer = setTimeout(this.fitZoom, 120);
            }
        },

        'element.transformResize'(drag, element) {
            // 拖拽判断需要吸附时，由resize-guider组件处理
            if (!element.$guider.resizeActive) {
                transformResize.call(this, element, drag, this.options);
            }
        },

        'element.transformRotate'(drag, element) {
            element.rotate = drag.rotate;
        },

        'element.transformStart'(element, { action }) {
            if (action === 'resize') {
                this.global.$draging = true;
            }
        },

        'element.transformEnd'(element, drag, { action }) {
            const isResize = action === 'resize';
            if (isResize) {
                this.global.$draging = false;
            }

            // 等待其它元素中拖拽完成时的 mutation 操作
            this.$nextTick(() => {
                this.makeSnapshotByElement(element, false, isResize && !!element.elements);
            });
        },

        'element.imageTransformEnd'(element) {
            // 等待其它元素中拖拽完成时的 mutation 操作
            this.$nextTick(() => {
                // mask exportImage 为延迟异步，记录快照不能用同步
                this.makeSnapshotByElement(element);
            });
        },

        // 此为原有的 editor.image.picker.show 事件，调用方式暂未知
        'picker.show'(hook) {
            const hookImagePicker = this.options.hookImagePicker;

            if (hookImagePicker) {
                hook();
                this.$events.$emit('imagePicker.show');
            }

            return hookImagePicker;
        },

        'imagePicker.show'() {
            this.$emit('pickerShow');
        },

        'videoPicker.show'() {
            this.$emit('videoPickerShow');
        },

        // 更新富文本实例
        'richText.update'(richText) {
            this.currentRichText = richText;
        },
        // errors
        'element.loadError'(err, element) {
            this.checkTempletLoaded();

            this.dispatchError({
                type: 'load',
                code: `element.${element.type}.load.error`,
                message: err,
            });
        },

        // status
        'element.loaded'() {
            this.checkTempletLoaded();
        },

        // drag
        'element.dragStart'(element) {
            // Set layout
            this.setLayoutByElement(element);
            if (element !== this.currentElement) {
                this.focusElement(element);
            }

            this.global.$draging = true;

            if (element.type === 'image') {
                this.$currentDraggedImage = element;
            }
        },

        'element.dragEnd'(element) {
            this.global.$draging = false;

            this.focusElement(element);

            if (this.isCrossLayoutDrag(element)) {
                const dragRelateive = element._dragRelateive;
                delete element._dragRelateive;

                if (!dragRelateive || !dragRelateive.toLayoutId) {
                    return false;
                }

                let fromLayout = null;
                let toLayout = null;

                this.layouts.forEach((layout) => {
                    if (layout.$id === dragRelateive.fromLayoutId) {
                        fromLayout = layout;
                    } else if (layout.$id === dragRelateive.toLayoutId) {
                        toLayout = layout;
                    }
                });

                if (element.type === '$selector') {
                    element = this.getSelectedElements(false);
                }
                let elements = this.cutElement(element, false);

                // Save for paste postion
                elements.forEach((element) => {
                    element._preTop = element.top;
                    element._preLeft = element.left;
                });

                this.toggleLayout(toLayout);
                elements = this.pasteElement(elements, toLayout);

                // Set new position
                elements.forEach((element) => {
                    element.top = fromLayout.top - toLayout.top + element._preTop;
                    element.left = element._preLeft;
                    delete element._preLeft;
                    delete element._preTop;
                });

                // Clear
                this.layouts.forEach((layout) => {
                    layout.$dragOver = false;
                });
            }

            // clean up mask drop related
            if (this.$imageReadyToDrop && this.$lastHoveredMask) {
                this.$events.$emit(
                    'element.applyImageDrop',
                    this.$lastHoveredMask,
                    this.$imageReadyToDrop,
                );
                this.$nextTick(() => {
                    this.makeSnapshotByElement(element);
                });
            } else {
                this.$events.$emit('element.resetReadyForDrop', this.$lastHoveredMask);

                // TODO: flow模式下跨画布拖拽, 改为异步创建快照, 保证创建的 templet 快照能够覆盖 makeSnapshotByElement 快照
                const sync = this.mode !== 'flow';
                this.$nextTick(() => {
                    this.makeSnapshotByElement(element, sync, element.type === 'group');
                });
            }
            this.$events.$emit('element.resetReadyToDrop');
            this.$currentDraggedImage = null;
            this.$imageReadyToDrop = null;
            this.$lastHoveredMask = null;
            clearTimeout(this.$dragMoveTimer);
        },

        'element.dragMove'(drag, element, evt) {
            // Check element drag over
            if (this.isCrossLayoutDrag(element)) {
                this.checkElementOver(element);
            }

            if (element.type === 'image') {
                const timestamp = Date.now();
                this.$dragMoveTimestamp = timestamp;

                clearTimeout(this.$dragMoveTimer);

                const point = this.pointFromEvent(evt);
                let elementsAtPoint = this.getElementsByPoint(point.x, point.y);
                let hoveredMask;
                elementsAtPoint.forEach((elem) => {
                    if (hoveredMask) return;

                    if (elem.type === 'mask') {
                        hoveredMask = elem;
                    } else if (this.isGroup(elem)) {
                        const newElements = this.collapseGroup(cloneDeep(elem), true);
                        elementsAtPoint = this.getElementsByPoint(point.x, point.y, {
                            ...this.currentLayout,
                            elements: newElements,
                        });
                        const clonedHoveredMask = elementsAtPoint.find((el) => el.type === 'mask');
                        if (clonedHoveredMask) {
                            hoveredMask = this.getElement(clonedHoveredMask.$id, {
                                deep: true,
                            });
                        }
                    }
                });

                if (hoveredMask) {
                    this.$events.$emit('element.readyToDrop', element);
                    if (hoveredMask !== this.$lastHoveredMask) {
                        this.$events.$emit('element.resetReadyForDrop', this.$lastHoveredMask);
                    }
                    this.$events.$emit('element.readyForDrop', hoveredMask, element, point);
                    this.$lastHoveredMask = hoveredMask;
                    this.$imageReadyToDrop = element;
                } else if (!hoveredMask && this.$lastHoveredMask) {
                    this.$events.$emit('element.resetReadyToDrop', element);
                    this.$events.$emit('element.resetReadyForDrop', this.$lastHoveredMask);
                    this.$imageReadyToDrop = null;
                }
            }
        },

        // edit
        'element.editApply'(element) {
            this.$nextTick(() => {
                // 协同 reparent 时，此时 model 可能不是真正有效的元素会导致同步异常
                element = this.getElement(element.uuid, { deep: true }) || element;
                this.makeSnapshotByElement(element, false, true);
            });
        },

        'element.rectUpdate'(element) {
            element.$editing && this.lazyUpdatePicker();
        },

        'background.loaded'() {
            this.checkTempletLoaded();
        },

        'globalBackground.loaded'() {
            this.checkTempletLoaded();
        },

        'watermark.loaded'() {
            this.global.$watermarkLoaded = true;
            this.checkTempletLoaded();
        },
        'border.loaded'() {
            this.checkTempletLoaded();
        },
        'imageRenderer.renderAfter'() {
            this.lazyUpdatePicker();
        },
        'base.remoteUpdate'() {
            if (this.selector) {
                this.selector.updateSelector();
            }
            if (this.global.$tempGroup) {
                this._resetTempGroup();
            }

            const curElem =
                this.currentCropElement ||
                this.currentEditMask ||
                this.currentEditWatermark ||
                this.currentSubElement ||
                this.currentElement;

            if (curElem && curElem.type !== '$selector') {
                if (
                    !this.getElement(curElem.uuid, { deep: true }) &&
                    !this.getLayout(curElem.uuid)
                ) {
                    this.currentElement = null;
                    this.currentSubElement = null;
                }
            }

            this.$emit('anyChange', {
                tag: 'remote_update',
            });

            this.lazyUpdatePicker();
        },
    },

    watch: {
        editorOptions(options) {
            if (options) {
                this.setOptions(this.editorOptions);
            }
        },

        mode() {
            const currElement = this.currentElement;

            if (currElement && currElement.type.charAt(0) === '$') {
                this.clearSelectedElements();
            }
        },

        operateMode() {
            const currElement = this.currentElement;

            if (currElement && currElement.type.charAt(0) === '$') {
                this.clearSelectedElements();
            }
        },
    },

    created() {
        // Events
        const events = this.$createEventBus();
        // Init options
        this.setOptions(this.editorOptions || {});

        this.$once('destroy', () => {
            events.$destroy();
        });

        // [Deprecated] 保留 eventBus 属性，向下兼容，下个版本去掉
        this.eventBus = events;

        // 不规则图层点击检测器
        this.$picker = new LayerPicker({
            defaultSize: this.options.layerPickerDefaultSize,
        });

        this.services = new ServiceManager(this);

        // 全局渲染器管理
        this.$renderers = new RendererManage(this);
        // Init options
        this.setOptions(this.editorOptions || {});

        this.$on('templetLoaded', () => {
            if (this.mode === 'design') {
                const [layers, width, height] = getLayers(this);
                this.$picker.update(layers, width, height);
            }
        });

        this.initSnapshot();
    },

    mounted() {
        const container = (this.container = $(this.$refs.container || this.$el));

        this.selector = this.$refs.selector;

        this.initRect();

        this.initDomEvents({
            useNativeContextmenuEvent: !!this.editorOptions.useNativeContextmenuEvent,
        });

        // 原生 DOM resize / scroll 事件处理
        const lazyEventHandle = (e) => {
            const type = e.type;

            clearTimeout(lazyEventHandle['timer_' + type]);
            lazyEventHandle['timer_' + type] = setTimeout(() => {
                this.$events.$emit('base.' + type, e);
            }, 64);
        };

        container.on('scroll.base', lazyEventHandle);
        view.on('resize.base', lazyEventHandle);

        // clean
        this.$on('destroy', () => {
            view.off('resize.base', lazyEventHandle);
            container.off('scroll.base', lazyEventHandle);

            this.container = null;
        });

        // Bind event
        const { events } = this.$options;
        for (const key in events) {
            this.$on(key, events[key]);
        }

        this.$on('templetCreated', () => {
            this.$events.$emit('templet.created');
        });

        // 归并处理，避免多次计算卡住线程
        // 用于即时性比较强的，比如 removeElement
        this.lazyUpdatePicker = debounce(() => {
            if (this.mode === 'design') {
                const [layers, width, height] = getLayers(this);
                this.$picker.update(layers, width, height);
            }
        }, 100);

        const lazyUpdatePicker = debounce(() => {
            if (this.mode === 'design') {
                const [layers, width, height] = getLayers(this);
                this.$picker.update(layers, width, height);
            }
        }, 500);

        this.$events.$on('element.loaded', this.lazyUpdatePicker);

        this.$watch(
            () => [this.currentLayout, this.options.mode, this.options.operateMode],
            ([layout]) => {
                if (layout && !layout.elements.length) {
                    this.lazyUpdatePicker();
                } else if (layout) {
                    lazyUpdatePicker();
                }
            },
        );

        // debug
        if (process.env.__DEV__ || process.env.NODE_ENV === 'development') {
            // this.utils = utils;
            window.editor = this;
        }
    },

    updated() {
        this.toolbar = this.$refs.toolbar;
        this.croper = this.$refs.croper;
        this.selector = this.$refs.selector;
        this.transform = this.$refs.transform;
        this.contextmenu = this.$refs.contextmenu;
    },

    beforeDestroy() {
        this.$events.$off('base.resize', this.updateRectThrottle);
        this.$events.$off('base.scroll', this.updateRectThrottle);

        this.handleMap = null;
        this.hotkeys = null;

        this.$emit('destroy');
    },
});

/**
 * @class Editor
 */
export const getEditor = (Vue, elementDefinitions, models = {}, asyncElementsMap) => {
    const methods = {};
    elementDefinitions.forEach((def) => {
        const modelName = getComponentName(def.layoutComponent).replace('-element', '');
        models[modelName] = def.model;
        Object.assign(methods, def.methods || {});
    });
    return mergeEditorProps(Vue, models, methods, asyncElementsMap);
};
