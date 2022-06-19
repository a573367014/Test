import $ from '@gaoding/editor-utils/zepto';
import utils from '../../utils/utils';
import template from './template.html';
import Watermark from '../watermark';
import Background from '../background';
import Border from '../border';
import { get, defaults, debounce } from 'lodash';

const doc = $(document);

export default {
    name: 'temp-group',
    template,
    props: ['global', 'currentElement', 'layout', 'options'],
    components: {
        Watermark,
        Background,
        Border,
    },
    data() {
        return {
            currentTempGroupId: '',
            tempGroupModel: null,
            caches: {},
        };
    },
    computed: {
        dragDisabled() {
            return this.currentElement && ['$masker', '$croper'].includes(this.currentElement.type);
        },
        editor() {
            return this.$parent;
        },
        zoom() {
            return this.global.zoom;
        },
        cssStyle() {
            const { zoom, tempGroupModel: model, layout } = this;

            return {
                width: model.width * zoom + 'px',
                height: model.height * zoom + 'px',
                left: model.left * zoom + 'px',
                top: (layout.top + model.top) * zoom + 'px',
                transform: model.transform.toString(),
            };
        },
        currentCacheRoot() {
            if (this.currentCache) {
                return this.currentCache.root;
            }
            return null;
        },
        currentCache() {
            return this.caches[this.currentTempGroupId];
        },
        elements() {
            return this.currentTempGroupId
                ? this.layout.elements.filter(
                      (item) => item.$tempGroupId === this.currentTempGroupId,
                  )
                : [];
        },

        showWatermark() {
            return this.currentCacheRoot && this.currentCacheRoot.watermarkEnable;
        },
        showBackground() {
            return this.showNinePatch
                ? this.tempGroupModel.backgroundColor
                : get(this.tempGroupModel, 'backgroundEffect.enable');
        },
        showNinePatch() {
            return (
                get(this.tempGroupModel, 'backgroundEffect.enable') &&
                get(this.tempGroupModel, 'backgroundEffect.type') === 'ninePatch' &&
                this.editor.supportTypesMap.ninePatch
            );
        },
        showBorder() {
            return get(this.tempGroupModel, 'border.enable');
        },
        ninePatchModel() {
            if (this.showNinePatch) {
                return Object.assign({}, get(this.tempGroupModel, 'backgroundEffect.ninePatch'), {
                    width: this.tempGroupModel.width,
                    height: this.tempGroupModel.height,
                    opacity: this.tempGroupModel.backgroundEffect.opacity,
                    left: 0,
                    top: 0,
                });
            }
        },
    },
    methods: {
        isGroup(element) {
            return (
                element &&
                element.type === 'group' &&
                !get(element, 'backgroundEffect.enable') &&
                !get(element, 'border.enable')
            );
        },
        // 粘贴元素时调用
        addSubElement(element, reposition) {
            const model = this.tempGroupModel;
            const layout = this.layout;
            const curCache = this.caches[this.currentTempGroupId];

            if (!this.currentTempGroupId || !curCache) return;

            // 以组的中心点定位
            if (reposition) {
                const dx = model.left + model.width / 2 - layout.width / 2;
                const dy = model.top + model.height / 2 - layout.height / 2;

                element.left += dx;
                element.top += dy;
            }

            element.$parentId = layout.uuid;
            element.$cacheParentId = curCache.root.uuid;
            element.$tempGroupId = this.currentTempGroupId;

            curCache.root.elements.push({
                ...element,
                afterAdd: true,
            });
        },

        // 临时解组
        groupToCaches(element, _tempGroupId) {
            this.editor.$binding.config.acceptElementAction = false;

            const scopeLayout = { elements: [element] };
            const tempGroupId = _tempGroupId || utils.uuid();
            const preCaches = this.caches[_tempGroupId];
            const cache = {};

            const addCache = (element, isRoot) => {
                let mixParent;
                const parents = this.editor.getParentGroups(element, scopeLayout);

                if (parents.length) {
                    mixParent = parents.concat(element).reduce((a, b) => {
                        const result = utils.mergeTransform(a, b);
                        return Object.assign({}, b, result);
                    });

                    mixParent.rotate = utils.radToDeg(mixParent.transform.rotation);
                }

                const preCache = preCaches && preCaches[isRoot ? 'root' : element.uuid];
                cache[isRoot ? 'root' : element.uuid] = {
                    ...element,
                    transform: element.parseTransform(element.transform),
                    elements: element.elements.map((el, i) => {
                        return {
                            uuid: el.uuid,
                            type: el.type,
                            afterAdd: get(preCache, `elements[${i}].afterAdd`),
                            mixParent,
                        };
                    }),
                };
            };

            addCache(element, true);
            element.$cacheParentId = element.$parentId;
            element.$tempGroupId = tempGroupId;

            utils.walkTemplet(
                (element) => {
                    this.isGroup(element) && addCache(element);
                    element.$cacheParentId = element.$parentId;
                    element.$tempGroupId = tempGroupId;
                },
                true,
                [element],
            );

            cache.layout = this.layout;
            this.caches[tempGroupId] = cache;

            if (!_tempGroupId) {
                const elements = this.editor.flatGroup(element, true, true, this.isGroup);
                this.editor.$binding.config.acceptElementAction = false;

                this.editor.clearSelectedElements();

                this.currentTempGroupId = tempGroupId;
                return elements;
            }

            const elements = this.editor.collapseGroup(element, true, false, this.isGroup);
            elements.some((elA) => {
                const el = this.layout.elements.find((elB) => elA.uuid === elB.uuid);
                if (el) {
                    el.left = elA.left;
                    el.top = elA.top;
                    el.rotate = elA.rotate;
                    return true;
                }
                return false;
            });

            this.editor.$binding.config.acceptElementAction = true;
        },
        // 还原临时组
        cachesToGroup(tempGroupId, layout) {
            const { editor, caches } = this;
            layout = layout || this.layout;
            const elements = layout.elements;
            const cache = caches[tempGroupId];

            // 同步远程状态时本地 cache 不存在，此时不做还原操作
            if (!cache) {
                return null;
            }

            this.editor.$binding.config.acceptElementAction = false;
            const createGroup = (group) => {
                const child = group.elements
                    .map((item) => {
                        if (this.isGroup(item) && cache[item.uuid] && !item.afterAdd) {
                            return createGroup(cache[item.uuid]);
                        }

                        let el = elements.find((el, i) => {
                            el.$temIndex = i;
                            return el.uuid === item.uuid;
                        });

                        if (!el) return null;

                        let mixParent = item.mixParent;

                        if (!mixParent) {
                            mixParent = {
                                ...group,
                                rotate: utils.radToDeg(group.transform.rotation),
                            };
                        }

                        const center = {
                            x: el.left + el.width / 2,
                            y: el.top + el.height / 2,
                        };

                        const point = utils.getPointPosition(
                            center,
                            {
                                x: mixParent.left + mixParent.width / 2,
                                y: mixParent.top + mixParent.height / 2,
                            },
                            -mixParent.rotate,
                        );

                        const dx = point.x - center.x;
                        const dy = point.y - center.y;

                        el = editor.createElement({ ...el, $selected: false });
                        el.disableEditable();

                        el.left = el.left - mixParent.left + dx;
                        el.top = el.top - mixParent.top + dy;
                        el.rotate = el.rotate - mixParent.rotate;

                        return el;
                    })
                    .filter((el) => !!el)
                    .sort((a, b) => a.$temIndex - b.$temIndex);

                const newGroup = this.editor.createElement({
                    ...group,
                    elements: child,
                });

                if (newGroup.scaleY < 0) {
                    newGroup.scaleY *= -1;
                }
                if (newGroup.scaleX < 0) {
                    newGroup.scaleX *= -1;
                }

                this.resetBounding(newGroup);

                return newGroup;
            };

            const group = cache.root;
            const newGroup = createGroup(group);
            defaults(newGroup, group);

            // 忽略递归 createElement 过程，由调用方整体插入 newGroup
            this.editor.$binding.config.acceptElementAction = true;

            return newGroup;
        },
        // 组内元素为空或只有一个元素时的优化处理
        resetGroup(group) {
            if (group.elements.length) {
                const child = [];
                group.elements.forEach((element) => {
                    if (this.isGroup(element)) {
                        element = this.resetGroup(element);
                    }
                    element && child.push(element);
                });
                group.elements = child;
            }

            if (!group.elements.length) {
                return null;
            }

            return group;
        },

        resetBounding(model) {
            const { padding, rotation } = model;

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
            model.top += centerOffset[1] + (model.height - rect.height) / 2;
            model.width = rect.width;
            model.height = rect.height;
        },

        syncRect(elements) {
            elements = [].concat(elements);

            const clearTempGroup = () => {
                this.currentTempGroupId = '';
                this.tempGroupModel = null;
            };

            // 协同下，临时解组 AB 各自撤销会导致出现 uuid 重复等问题，具体参考测试用例
            if (
                this.currentCacheRoot?.uuid &&
                this.editor.getElement(this.currentCacheRoot.uuid, {
                    deep: true,
                    layouts: this.editor.layouts,
                })
            ) {
                clearTempGroup();
                return;
            }

            if (!elements.length || !this.caches[elements[0].$tempGroupId]) {
                clearTempGroup();
                return;
            }

            this.currentTempGroupId = elements[0].$tempGroupId;

            const element = elements.some((el) => el.$tempGroupId === this.currentTempGroupId);

            if (this.currentTempGroupId && element) {
                this.editor.toggleSnapshot(false);

                // 保留原始数据
                // 避免出现删除元素后在撤销删除操作, 导致无法追溯元素
                const cache = this.caches[this.currentTempGroupId];

                const newGroup = this.cachesToGroup(this.currentTempGroupId);

                // 暂无法恢复出来自远程操作的临时组
                if (!newGroup) {
                    return;
                }

                this.groupToCaches(newGroup, this.currentTempGroupId);

                this.caches[this.currentTempGroupId] = cache;
                newGroup.type = 'tempGroup';
                this.tempGroupModel = newGroup;
                this.editor.toggleSnapshot(true);
            }
        },
        syncRectLazy: debounce(function (elements) {
            this.syncRect(elements);
        }, 50),

        createTempGroup(element) {
            this.editor.$binding.undoMgr.stopCapturing();
            let subElement = this.editor.currentSubElement;
            const elements = this.groupToCaches(element);

            if (subElement) {
                subElement = elements.find((el) => {
                    return el.uuid === subElement.uuid;
                });
            }

            // 进入临时解组状态前，没有选中子元素的，默认选中组内最上层文字元素，当没有文字时，选中最上层元素
            if (!subElement) {
                const newElements = elements.slice().reverse();
                subElement = newElements.find(
                    (item) => item.type.includes('text') || item.type.includes('Text'),
                );
                subElement = subElement || newElements[0];
            }

            this.editor.focusElement(subElement);

            this.tempGroupModel = this.editor.createElement({
                type: 'tempGroup',
                ...element,
            });

            this.editor.currentLayout.$backgroundSelected = false;
        },
        cancelTempGroup() {
            const { currentTempGroupId, caches, editor } = this;

            if (!currentTempGroupId || !caches[currentTempGroupId]) return;

            const layout = caches[currentTempGroupId].layout || this.layout;
            let newGroup = this.cachesToGroup(this.currentTempGroupId, layout);
            newGroup = this.resetGroup(newGroup, layout);

            this.currentTempGroupId = '';
            this.tempGroupModel = null;

            this.editor.$binding.undoMgr.stopCapturing();
            if (!newGroup) return;

            newGroup.enableEditable();
            newGroup.$parentId = layout.uuid;

            const removeElements = [];
            const lastIndex = layout.elements.length - 1;
            let temIndex = -1;

            utils.walkTemplet(
                (el) => {
                    el.$cacheParentId = '';
                    el.$tempGroupId = '';

                    el = editor.getElement(el.uuid, {
                        deep: false,
                        layout,
                    });

                    el && removeElements.push(el);
                    if (el && temIndex === -1) {
                        temIndex = layout.elements.indexOf(el);
                    }
                },
                true,
                [newGroup],
            );

            const index = temIndex === -1 ? lastIndex : temIndex;
            editor.$binding.config.acceptElementAction = false;

            editor.addElement(newGroup, layout, index);
            editor.removeElement(removeElements, layout);
            editor.$binding.config.acceptElementAction = true;
            editor.$binding.commit({
                tag: 'cancel_temp_group',
                group: newGroup,
                index,
            });

            return newGroup;
        },

        initDrag(e) {
            e.stopPropagation();
            this.$events.$emit('tempGroup.dragStart');

            const { tempGroupModel, elements, zoom } = this;
            const currentElement = this.editor.currentElement;
            currentElement && currentElement.type.includes('$') && this.editor.focusElement(null);
            tempGroupModel.$draging = true;

            const drag = (this.drag = {
                pageX: e.pageX,
                pageY: e.pageY,
                left: tempGroupModel.left,
                top: tempGroupModel.top,
                childCaches: elements.map((el) => {
                    return {
                        left: el.left,
                        top: el.top,
                    };
                }),
                move: (e) => {
                    drag.dx = (e.pageX - drag.pageX) / zoom;
                    drag.dy = (e.pageY - drag.pageY) / zoom;

                    tempGroupModel.left = drag.left + drag.dx;
                    tempGroupModel.top = drag.top + drag.dy;

                    elements.forEach((el, i) => {
                        if (!el.lock && el.dragable && !el.frozen) {
                            el.left = drag.childCaches[i].left + drag.dx;
                            el.top = drag.childCaches[i].top + drag.dy;
                        }
                    });
                },
                cancel: () => {
                    doc.off('mousemove', drag.move);
                    tempGroupModel.$draging = false;

                    elements.some((el) => {
                        return el.lock || !el.dragable || el.frozen;
                    }) && this.syncRect(elements);

                    this.$events.$emit('tempGroup.dragEnd');

                    this.editor.makeSnapshot({
                        tag: 'change_element',
                        elements: elements,
                    });
                },
            });

            // lock drag
            doc.on('mousemove', drag.move);
            doc.one('mouseup', drag.cancel);
        },
    },
    events: {
        'base.mouseDown'(e) {
            const { tempGroupModel, currentElement, layout } = this;
            if (
                currentElement &&
                (currentElement.$editing || ['$croper', '$masker'].includes(currentElement.type))
            )
                return;

            if (this.tempGroupModel) {
                // 点击空白区域应用修改
                const point = this.editor.pointFromEvent(e);
                const rect = utils.getElementRect(
                    {
                        ...tempGroupModel,
                        left: tempGroupModel.left - 20,
                        top: tempGroupModel.top + layout.top - 20,
                        height: tempGroupModel.height + 40,
                        width: tempGroupModel.width + 40,
                    },
                    1,
                );

                if (!utils.pointInRect(point.x, point.y, rect)) {
                    this.editor.cancelTempGroup();
                }
            }
        },
        'element.createTempGroup'(element) {
            if (!element || element.type !== 'group') return;
            this.createTempGroup(element);
        },
        'element.cancelTempGroup'() {
            const newGroup = this.cancelTempGroup();
            if (newGroup) {
                this.$events.$emit('tempGroup.cancel', newGroup, this.editor.currentLayout);
            }
        },

        'element.transformEnd'(element) {
            this.syncRect(element.type === '$selector' ? element.elements : element);
        },
        'element.dragEnd'(element) {
            this.syncRect(element.type === '$selector' ? element.elements : element);
        },
        'element.rectUpdate'(element) {
            this.syncRectLazy(element);
        },
        'element.editApply'(element) {
            const map = {
                $masker: 'currentEditMask',
                $croper: 'currentCropElement',
            };
            element = this.editor[map[element.type]] || element;
            this.$nextTick(() => {
                this.syncRect(element);
            });
        },

        // selector 包含临时组外部元素时，取消临时组状态
        'selector.inactive'() {
            if (!this.editor.selectedElements.length || !this.currentTempGroupId) return;

            const validElements = this.editor.selectedElements.filter(
                (item) => item.$tempGroupId !== this.currentTempGroupId,
            );

            if (validElements.length > 0) {
                this.editor.cancelTempGroup();
                validElements.forEach(this.editor.selectElement);
            }
        },
    },
    watch: {
        'editor.currentLayout'() {
            if (this.currentTempGroupId) {
                this.editor.cancelTempGroup();
            }
        },
        'editor.currentElement'(el) {
            if (!el || el.type.includes('$')) return;
            if (this.currentTempGroupId && !el.$tempGroupId) {
                this.editor.cancelTempGroup();
            }
        },
        elements(elements) {
            if (!elements.length) {
                this.editor.cancelTempGroup();
                return;
            }

            this.syncRect(elements);
        },
        tempGroupModel(v) {
            this.editor.global.$tempGroup = !!v;
        },
    },
};
