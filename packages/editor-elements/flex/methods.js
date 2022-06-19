/**
 * @class EditorFlexElementMixin
 * @description 元素的专属方法
 */
import merge from 'lodash/merge';
import utils from '@gaoding/editor-framework/src/utils/utils';
import EditorDefaults from '@gaoding/editor-framework/src/base/editor-defaults';

export default {
    /**
     * 创建 flex 元素
     * @memberof EditorFlexElementMixin
     * @param { Array<Element> } elements - 元素集合
     */
    createFlex(elements, options) {
        if (!elements) {
            elements = this.getSelectedElements();
        }

        elements = (elements || []).filter((el) => el.groupable);

        const bbox = utils.getBBoxByElements(elements);

        const flex = this.createElement({
            type: 'flex',
            height: bbox.height,
            width: bbox.width,
            left: bbox.left,
            top: bbox.top,
            elements: [],
        });
        merge(flex, options);

        const mainAx = flex.flexDirection.includes('row') ? 'width' : 'height';
        const subAx = flex.flexDirection.includes('row') ? 'height' : 'width';
        let maxSubSize = -Infinity;
        let mainSize = 0;

        elements = elements.map((element) => {
            element.flex = merge({}, EditorDefaults.flex, element.flex);
            element = this.addElement(element, flex);

            // 限制子元素的部分特性
            element.disableEditable();
            element.$selected = false;

            mainSize += element[mainAx];
            if (maxSubSize < element[subAx]) {
                maxSubSize = element[subAx];
            }

            return elements;
        });

        flex[mainAx] = mainSize;
        flex[subAx] = maxSubSize;

        return flex;
    },

    /**
     * 由选中的元素生成 flex 元素
     * @memberof EditorFlexElementMixin
     * @param { Array<element> } elements - 所选元素
     * @param { Object } options - 新生成的 flex 元素的相应参数
     */
    addFlexByElements(elements, options = {}) {
        if (!elements) {
            elements = this.getSelectedElements();
        } else {
            elements = [].concat(elements);
        }

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

        const flex = this.createFlex(elements);
        Object.keys(options).forEach((key) => {
            flex[key] = options[key];
        });

        this.addElement(flex, layout, topIndex);
        this.focusElement(flex);

        const action = { tag: 'add_group', group: flex, layout };
        this.makeSnapshot(action, null, true);

        this.$binding.config.acceptElementAction = true;
        return flex;
    },

    /**
     * 拆分 flex 元素
     * @memberof EditorFlexElementMixin
     * @param { element } element - 待解除的flex元素
     */
    flatFlex(element) {
        element = this.getElement(element);
        if (element.type === 'flex') {
            const elements = this.flatGroup(element);
            elements.forEach((element) => {
                element.flex = null;
            });
            return elements;
        }
        return [];
    },

    /**
     * 修改元素的 flex 属性
     * @memberof EditorFlexElementMixin
     * @param { object } flex - 修改的属性
     * @param { element } element - 修改的元素
     */
    changeElementFlex(flex, element) {
        flex = merge({}, EditorDefaults.flex, element.flex, flex);
        this.changeElement({ flex: flex }, element);
    },
};
