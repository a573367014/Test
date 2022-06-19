/**
 * Draggable
 * 编辑器元素基础组件，编辑器中的可编辑元素均隐式继承它，以获得画布上的基础拖拽能力
 */

import $ from '@gaoding/editor-utils/zepto';
import { assign } from 'lodash';
import { compatibleEvent } from '../utils/dom-event';
import utils from '../utils/utils';

export default {
    props: ['model', 'global', 'options'],
    data() {
        return {
            dragger: {
                pageX: 0,
                pageY: 0,
                left: 0,
                top: 0,
                dx: 0,
                dy: 0,
            },
        };
    },
    methods: {
        isDraggable(e) {
            const editor = this.editor;
            const model = this.model;
            const currentElement = editor.currentElement;
            const transformDragnable = editor.transform?.config?.dragEnable !== false;

            // 在pad中不可在未选中的情况下拖动元素。未选中情况下为拖动画布
            if (
                e.touches &&
                (!currentElement || currentElement?.$id !== model.$id || e.touches?.length >= 2)
            ) {
                return false;
            }

            // $parentId 原本只对组内子元素存在，扁平化重构后对所有元素均存在
            // 故无法直接通过 $parentId 是否存在来判断拖拽的元素是否为顶层节点
            const isNestedChild =
                model.type.charAt(0) !== '$' && this.editor.currentLayout.uuid !== model.$parentId;

            if (
                !model ||
                isNestedChild ||
                model.lock ||
                model.$draging ||
                !model.dragable ||
                !model.$dragable ||
                !transformDragnable ||
                (e.button !== undefined && e.button !== 0) ||
                (this.options.mode !== 'design' && this.options.mode !== 'flow') ||
                utils.isEditable(e.target)
            ) {
                return false;
            }

            return true;
        },
        initDragger(element) {
            const self = this;
            const doc = $(document);
            const dragger = this.dragger;
            const editor = this.editor;
            let lockDirection = false;
            let copied = false;
            let setIndexElement = null;
            let pasteElements = [];

            function startCopy() {
                copied = true;
                setIndexElement = null;

                // 设置光标为copy
                self.editor.cursorController.fixedCursor('copy');

                // 关闭生成历史快照
                editor.toggleSnapshot(false);
            }

            function endCopy() {
                copied = false;

                // 还原光标
                self.editor.cursorController.cancelFixed('default');

                // 开启生成历史快照
                editor.toggleSnapshot(true);
            }

            const handles = {
                init(e, sourceEvent) {
                    e = sourceEvent || e; // jQuery trigger
                    if (!self.isDraggable(e)) {
                        return;
                    }
                    // 此处不能 preventDefault 会导致鼠标置于 iframe 外部无法响应事件
                    // http://taye.me/blog/tips/2015/11/16/mouse-drag-outside-iframe/
                    // e.preventDefault();

                    const model = self.model;
                    const { pageX, pageY } = compatibleEvent(e);

                    // props
                    assign(dragger, {
                        left: model.left,
                        top: model.top,
                        pageX,
                        pageY,
                        dx: 0,
                        dy: 0,
                    });
                    doc.on('mousemove', handles.move);
                    document.documentElement.addEventListener('touchmove', handles.move, {
                        passive: false,
                        capture: true,
                    });
                    doc.one('mouseup', handles.cancel);
                    doc.one('touchend', handles.cancel);
                },
                move(e) {
                    const model = self.model;

                    if (!model) {
                        return;
                    }

                    e.stopPropagation();
                    e.cancelable && e.preventDefault();

                    // 如果移动元素时按住option键，则留一份在原地，然后拖拽元素
                    if (e.altKey && !copied && !editor.hotkeys._disabled) {
                        startCopy();

                        // 临时元素选取elements作为copy对象
                        const elements = model.type[0] === '$' ? model.elements : [model];
                        pasteElements = editor.pasteElement(editor.copyElement(elements), null, {
                            noOffset: true,
                        });

                        // 单个元素拖拽 无法确定选中态 需要设置选中态并置顶
                        if (elements.length === 1) {
                            editor.focusElement(elements[0]);
                            setIndexElement = elements[0];
                        }
                    }

                    const zoom = self.global.zoom;

                    const pageX = compatibleEvent(e).pageX;
                    const pageY = compatibleEvent(e).pageY;
                    dragger.dx = (pageX - dragger.pageX) / zoom;
                    dragger.dy = (pageY - dragger.pageY) / zoom;

                    // lock drag direction
                    if (e.shiftKey) {
                        if (!lockDirection) {
                            if (Math.abs(dragger.dx) >= 3 || Math.abs(dragger.dy) >= 3) {
                                const ratio = Math.abs(dragger.dx / dragger.dy);
                                lockDirection = ratio > 1 ? 'x' : 'y';
                            }
                        }
                        if (lockDirection === 'x') {
                            dragger.dy = 0;
                        } else {
                            dragger.dx = 0;
                        }
                    }
                    // 防止误触
                    const dOffsetMin = 3;
                    if (
                        !model.$draging &&
                        (Math.abs(dragger.dx) >= dOffsetMin || Math.abs(dragger.dy) >= dOffsetMin)
                    ) {
                        model.$draging = true;
                        self.$events.$emit('base.dragStart', model, e);
                    }

                    if (model.$draging) {
                        self.$events.$emit('base.dragMove', dragger, model, e);
                    }
                },
                cancel() {
                    doc.off('mousemove', handles.move);
                    doc.off('touchend', handles.cancel);
                    document.documentElement.removeEventListener('touchmove', handles.move, {
                        passive: false,
                        capture: true,
                    });

                    const model = self.model;
                    if (model && model.$draging) {
                        model.$draging = false;

                        self.$events.$emit('base.dragEnd', model);
                    }
                    lockDirection = false;

                    self.$nextTick(() => {
                        endCopy();

                        pasteElements.length &&
                            editor.makeSnapshot({
                                tag: 'change_element',
                                elements: [model],
                            });

                        pasteElements.forEach((element) => {
                            editor.makeSnapshot({
                                tag: 'add_element',
                                element,
                                parent: editor.currentLayout,
                            });
                        });

                        // 只能放这里，否则协同 updateIndex 会出问题
                        setIndexElement && editor.setElementToTop(setIndexElement);

                        pasteElements = [];
                        setIndexElement = null;
                    });
                },
            };

            element.on('mousedown.editor-dragger', handles.init);
            this.options.touchEnable && element.on('touchstart.editor-dragger', handles.init);

            // clean
            this.$on('destroy', () => {
                element.off('.editor-dragger');
            });
        },
    },

    events: {
        'base.dragMove'(drag, element) {
            if (element !== this.model || element.lock || !this.isDesignMode) {
                return false;
            }

            const { dx, dy } = drag;
            const [left, top] = [drag.left + drag.dx, drag.top + drag.dy];

            if (element.$customDragMove) {
                this.$events.$emit('element.customDragMove', { element, dx, dy, drag });
            } else if (this.customDragMove) {
                this.customDragMove({ element, dx, dy, drag });
            } else {
                element.left = left;
                element.top = top;
            }
        },
    },

    mounted() {
        this.$nextTick(() => {
            const element = $(this.$el);
            if (!element.length) {
                return;
            }
            this.initDragger(element);
        });
    },

    beforeDestroy() {
        this.$emit('destroy');
    },
};
