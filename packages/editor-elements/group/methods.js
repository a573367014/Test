/**
 * @class EditorGroupElementMixin
 * @description 元素的专属方法
 */
import utils from '@gaoding/editor-framework/src/utils/utils';
import { counter } from '@gaoding/editor-utils/counter';
import { resetElementsMaskInfo } from '@gaoding/editor-framework/src/static/mask-wrap/utils';

export default {
    /**
     * 创建组合元素
     * @memberof EditorGroupElementMixin
     * @param {elements} elements - 元素集合
     * @param {boolean} deep 将所有嵌套拉平
     */
    createGroup(elements, deep = false) {
        const snapshotable = this.innerProps.snapshotable;
        this.toggleSnapshot(false);

        const self = this;
        if (!elements) {
            elements = this.getSelectedElements();
        }

        elements = (elements || []).filter((el) => !(this.isGroup(el) && deep) && el.groupable);

        let children = [];
        if (deep) {
            const flatElements = (elements) => {
                elements.forEach((element) => {
                    if (this.isGroup(element)) {
                        flatElements(self.collapseGroup(element));
                        return;
                    }

                    children.push(element);
                });
            };

            // 不允许组嵌套，如果包含组元素则拉平
            flatElements(elements);
        } else {
            children = elements;
        }

        const bbox = utils.getBBoxByElements(children);
        const group = this.createElement({
            type: 'group',
            height: bbox.height,
            width: bbox.width,
            left: bbox.left,
            top: bbox.top,
            elements: [],
        });

        children = children.map((element) => {
            element = this.addElement(element, group);

            // 限制子元素部分特性
            element.disableEditable();
            element.$selected = false;

            element.left -= group.left;
            element.top -= group.top;
            return element;
        });

        this.toggleSnapshot(snapshotable);

        return group;
    },

    /**
     * 获取组合中可拆分的元素列表
     * @memberof EditorGroupElementMixin
     * @param {element} element - 组合元素
     * @param {Boolean} deep - 将所有嵌套拉平
     * @param {Boolean} keepGroup - 保留组元素结构
     */
    collapseGroup(element, deep = false, keepGroup = false, isGroup = this.isGroup) {
        const group = this.getElement(element);
        const elements = group && group.elements;

        if (!elements || !elements.length) {
            return [];
        }

        const recursiveFn = (group) => {
            const groupRotate = group.rotate;
            const elements = group.elements;
            let result = [];

            if ((group.backgroundColor || group.backgroundEffect) && keepGroup) {
                result.push({
                    ...group,
                    watermarkEnable: false,
                    elements: [],
                });
            }

            result = elements.reduce((r, element) => {
                element = this.createElement({
                    ...element,
                });

                // 解锁部分特性
                element.enableEditable();

                // groupRotate 修正
                element.rotate += groupRotate;

                if (group.scaleY < 0) {
                    element.scaleY *= group.scaleY;
                    element.top = group.height - element.top - element.height;
                }

                if (group.scaleX < 0) {
                    element.scaleX *= group.scaleX;
                    element.left = group.width - element.left - element.width;
                }

                const prePoint = {
                    x: group.left + element.left + element.width / 2,
                    y: group.top + element.top + element.height / 2,
                };

                const newPoint = utils.getRectPoints({
                    left: prePoint.x,
                    top: prePoint.y,
                    width: group.width - element.left * 2 - element.width,
                    height: group.height - element.top * 2 - element.height,
                    rotate: groupRotate,
                    skewX: 0,
                    skewY: 0,
                });

                element.left += group.left + newPoint.nw.x - prePoint.x;
                element.top += group.top + newPoint.nw.y - prePoint.y;

                delete element.$parentId;
                if (deep && isGroup(element)) {
                    element = recursiveFn(element);
                }
                return r.concat(element);
            }, result);

            if (group.watermarkEnable && keepGroup) {
                result.push({
                    ...group,
                    backgroundColor: null,
                    backgroundEffect: null,
                    elements: [],
                });
            }

            return result;
        };

        return recursiveFn(group);
    },

    /**
     * 由选中元素生成组合元素
     * @memberof EditorGroupElementMixin
     * @param {element | Array} elements - 所选元素，若留空则使用当前 UI 选中元素
     * @param {Object} options - 新生成组合元素的相应参数
     * @param {boolean} deep 将所有嵌套拉平
     */
    addGroupByElements(elements, options = {}, deep = false) {
        if (!elements) {
            elements = this.getSelectedElements();
        }

        elements = (elements || []).filter((el) => !(this.isGroup(el) && deep) && el.groupable);

        if (elements.length <= 1) {
            return;
        }

        this.$binding.config.acceptElementAction = false;

        const layout = this.getLayoutByElement(elements[0]) || this.currentLayout;

        let topIndex = -1;

        if (layout) {
            topIndex = Math.max(
                ...elements.map((itemA) => {
                    return layout.elements.findIndex((itemB) => itemA === itemB);
                }),
            );

            topIndex -= elements.length - 1;
        }

        elements.forEach((element) => this.removeElement(element));

        const group = this.createGroup(elements, deep);
        Object.keys(options).forEach((key) => {
            group[key] = options[key];
        });

        this.addElement(group, layout, topIndex);
        this.focusElement(group);

        const action = { tag: 'add_group', group, layout };
        this.makeSnapshot(action, null, true);

        this.$binding.config.acceptElementAction = true;
        return group;
    },

    /**
     * 拆分组合元素
     * @memberof EditorGroupElementMixin
     * @param {element} element - 待解除的组合元素
     * @param {deep} 将所有嵌套拉平
     */
    flatGroup(element, deep = false, ignoreSplitenable = false, isGroup = this.isGroup) {
        const groupElement = this.getElement(element);
        let elements = groupElement && groupElement.elements;

        // $selector 同样为包含 elements 的元素，忽略之
        if (!elements || groupElement.type === '$selector') {
            return;
        }

        if (!groupElement.splitenable && !ignoreSplitenable) {
            this.$events.$emit('element.flatGroupError');
            return;
        }

        this.$binding.config.acceptElementAction = false;

        // 拆分后将其内部元素置入组合原位置
        const parentLayout = this.getParentLayout(groupElement);
        const parent = parentLayout || this.getElement(groupElement.$parentId);
        const groupIndex = parent.elements.indexOf(groupElement);
        const isGroupParent = isGroup(parent);
        const groups = [];
        if (deep) {
            this.walkTemplet(
                (el) => {
                    if (isGroup(el)) {
                        groups.push(el);
                    }
                },
                true,
                [groupElement],
            );
        }

        elements = this.collapseGroup(groupElement, deep, false, isGroup);
        groupElement.elements = elements; // 修正供 action 中使用的引用

        this.walkTemplet(
            (elm) => {
                elm.$selected = false;
            },
            true,
            [groupElement],
        );

        this.removeElement(groupElement, parent);

        // 需由后到前地逐个更改元素层级，以保证始终 splice 到正确位置
        for (let i = elements.length - 1; i >= 0; i--) {
            parent.elements.splice(groupIndex, 0, elements[i]);
            elements[i].$selected = !isGroupParent;
            elements[i].$weight = counter.get();
            elements[i].$parentId = parent.uuid;

            isGroup(elements[i]) &&
                elements[i].elements.forEach((subEl) => {
                    subEl.$parentId = elements[i].uuid;
                });
        }

        if (!isGroupParent && this.selector) {
            this.selector.showSelector();
        }

        if (!groupElement.$tempGroupId) {
            resetElementsMaskInfo(elements);
        }

        this.$binding.commit({
            tag: 'flat_group',
            group: groupElement,
            removedChildren: groups,
            parent,
            index: groupIndex,
        });

        this.$binding.config.acceptElementAction = true;

        return elements;
    },

    /**
     * 创建临时组
     * @memberof EditorGroupElementMixin
     * @param {element} element - 组合元素
     */
    createTempGroup(element) {
        const groupElement = this.getElement(element);
        if (!this.isGroup(groupElement)) return;

        if (this.currentSubElement) {
            this.currentSubElement.$editing = false;
        }
        this.$events.$emit('element.createTempGroup', groupElement);
    },

    /**
     * 取消临时组
     * @memberof EditorGroupElementMixin
     */
    cancelTempGroup() {
        if (this.currentSubElement) {
            this.currentSubElement.$editing = false;
        }

        this.$events.$emit('element.cancelTempGroup');
    },
};
