/**
 * @class EditorLayoutMixin
 * @description 编辑器 layout 操作相关API
 */
import { cloneDeep, isString, isNumber, assignWith, assign } from 'lodash';
import { mergeProps } from '@gaoding/editor-utils/merge-props';
import editorDefaults from '../editor-defaults';
import LayoutModel, { converPropsBackground, resetLayoutProps } from '../layout-model';
import deleteUUID from '../../utils/delete-uuid';

export default {
    _resetLayoutTop() {
        if (this.mode === 'flow') {
            this.layouts.reduce((top, layout) => {
                layout.top = top;
                return top + layout.height;
            }, 0);
        }
    },
    /**
     * 复制 layout
     * 不允许复制出来的 layout 下元素 id 重复
     * @method copyLayout
     * @memberof EditorLayoutMixin
     * @param {object} layout - layout 对象
     */
    copyLayout(layout) {
        const newLayout = cloneDeep(layout);
        delete newLayout.$id;
        delete newLayout.uuid;

        deleteUUID(newLayout.elements, {
            deleteLinkId: true,
        });
        newLayout.elements = newLayout.elements.map((element) => {
            if (element && typeof element.clone === 'function') {
                return this.createElement(element.clone());
            }

            return this.createElement(element);
        });

        return newLayout;
    },

    /**
     * 获取 layout
     * @method getLayout
     * @memberof EditorLayoutMixin
     * @param {object} layout - layout 对象
     */
    getLayout(layout) {
        if (isNumber(layout)) {
            const inx = layout % this.layouts.length;

            layout = this.layouts[inx];
        }
        if (isString(layout)) {
            layout = this.layouts.find((item) => item.$id === layout || item.uuid === layout);
        }

        return layout || this.currentLayout;
    },

    /**
     * 创建 layoutModel
     * @method createLayout
     * @memberof EditorCore
     * @param {object} layout - layout 数据
     * @param {options} Object - 传递给 LayoutModel 构造器的配置
     * @return {Layout} - layoutModel 实例
     */
    createLayout(layout) {
        return new LayoutModel(layout, this);
    },

    /**
     * 添加 layout 布局
     * @method addLayout
     * @memberof EditorLayoutMixin
     * @param {object} layout - layout 对象
     * @param {Number} [index] - 插入 layout 的索引位置
     * @return {Layout} - 插入的 layout
     */
    addLayout(layout, index) {
        layout = this.createLayout(layout);

        if (isNumber(index)) {
            this.layouts.splice(index, 0, layout);
        } else {
            index = this.layouts.length;
            this.layouts.push(layout);
        }

        this._resetLayoutTop();

        const action = { tag: 'add_layout', layout };

        this.$binding.commit(action);

        if (!this.currentLayout) {
            this.currentLayout = layout;
        }

        return layout;
    },

    /**
     * 删除 layout 布局
     * @method removeLayout
     * @memberof EditorLayoutMixin
     * @param {layout|Number} [layout=currentLayout] - layout 对象引用或 layout 所在的索引值，为空指代表 {@link EditorLayoutMixin.currentLayout}
     */
    removeLayout(layout, currentLayoutIndex = 0) {
        layout = this.getLayout(layout);

        if (layout) {
            const index = this.layouts.indexOf(layout);
            if (index > -1) {
                // TODO: 外部如果在循环体内调用 removeLayout 会导致预期循环长度异常
                // 如：editor.layouts.forEach(layout => editor.removeLayout(layout));
                this.layouts = [...this.layouts];
                this.layouts.splice(index, 1);
            }

            if (layout === this.currentLayout) {
                this.currentLayout = this.layouts[currentLayoutIndex] || null;
            }

            this._resetLayoutTop();

            const action = {
                tag: 'remove_layout',
                layout,
            };
            this.makeSnapshot(action, layout, true, 'templet');
        }
    },

    /**
     * 替换 layout
     * @method replaceLayout
     * @memberof EditorLayoutMixin
     * @param {layout} oldLayout 被替换 layout
     * @param {layout} newLayout 新 layout
     * @return {layout} 新 layout
     */
    replaceLayout(oldLayout, newLayout) {
        const layout = this.getLayout(oldLayout);
        const oldLayoutIndex = this.layouts.indexOf(layout);

        this.removeLayout(layout);
        return this.addLayout(newLayout, oldLayoutIndex);
    },

    /**
     * 清除 layout 内所有 element 元素
     * @method clearLayout
     * @memberof EditorLayoutMixin
     * @param {object|Number} [layout=currentLayout] - layout 对象或 layout 索引值或为空，为空值代表编辑器当前 layout
     */
    clearLayout(layout) {
        layout = this.getLayout(layout);

        if (layout) {
            layout.elements = [];

            if (layout === this.currentLayout) {
                this.currentElement = null;
            }

            this.removeElement(layout.elements, layout);
        }
    },

    /**
     * 修改 layout 属性
     * @method changeLayout
     * @memberof EditorLayoutMixin
     * @param {object} props - 设置的属性对象
     * @param {Array|Object} [layouts=currentLayout] - 被修改的 layouts
     * @param {Boolean} sync - 是否同步
     */
    changeLayout(props, layouts, sync = false) {
        layouts = [].concat(layouts || this.currentLayout);

        this.options?.changeMetaInfoHook({
            layouts,
            props,
            type: 'change',
        });

        layouts.forEach((layout) => {
            props = converPropsBackground(props, layout.background);

            assign(layout, props);
            resetLayoutProps(layout);
        });

        this._resetLayoutTop();

        const action = {
            tag: 'change_layout',
            layouts,
            props,
        };
        // history
        this.makeSnapshot(action, null, sync);
    },

    /**
     * 修改 layout 边框属性
     * @param { Object } props - 设置的边框属性对象
     * @param {Array|Object} [layouts=currentLayout] - 被修改的 layouts
     * @param {Boolean} sync - 是否同步
     */
    changeLayoutBorder(props, layouts, sync = false) {
        layouts = [].concat(layouts || this.currentLayout);

        if (!props) {
            props = cloneDeep(editorDefaults.border);
        }

        this.makeSnapshotTransact(() => {
            layouts.forEach((layout) => {
                layout.border = assignWith(layout.border, props, mergeProps);

                const action = {
                    tag: 'change_layout',
                    layouts,
                    props: {
                        border: layout.border,
                    },
                };
                this.makeSnapshot(action, null, sync);
            });
        });
    },

    /**
     * 切换 currentLayout 为指定的 layout
     * @memberof EditorLayoutMixin
     * @param  {layout|Number} layout - 指定设置的 layout 或 layout 索引
     */
    toggleLayout(layout) {
        if (isNumber(layout)) {
            const inx = layout % this.layouts.length;

            layout = this.layouts[inx];
        }

        if (layout && layout !== this.currentLayout) {
            // 若处于裁切状态则应用编辑
            if (this.currentCropElement || this.currentEditMask || this.currentEditWatermark) {
                this.$events.$emit('element.editApply', this.currentElement);
            }

            this.currentLayout.$backgroundSelected = false;
            this.currentLayout.$backgroundEditing = false;

            this.clearSelectedElements();
            this.currentElement = null;
            this.currentLayout = layout;
        }
    },

    /**
     * 根据 {@link Gloabal.Point|point} 返回 point 所在的 layout
     * @memberof EditorLayoutMixin
     * @param  {object} point
     * @param  {layouts} layout 对象数组
     * @return {layout} - layout 对象
     */
    getLayoutByPoint(point, layouts) {
        const y = point.y;
        let lastLayout = null;

        const layout = (layouts || this.layouts).find((layout) => {
            lastLayout = layout;
            return y < layout.top + layout.height;
        });

        return layout || lastLayout;
    },

    /**
     * 返回 element 所在的 layout
     * @memberof EditorLayoutMixin
     * @param  {element} element=currentElement - 元素
     * @return {layout}
     */
    getLayoutByElement(element) {
        const layouts = this.layouts;
        element = element || this.currentElement;

        return layouts.find((layout) => {
            let flag;
            this.walkTemplet(
                (el) => {
                    if (element === el) {
                        flag = true;
                        return false;
                    }
                },
                true,
                [layout],
            );

            return flag;
        });
    },

    /**
     * 设置 {@link EditorLayoutMixin.currentLayout|currentLayout} 为给定 element 所在的 layout
     * @memberof EditorLayoutMixin
     * @param  {element} element=currentElement - 元素
     */
    setLayoutByElement(element) {
        const layout = this.getLayoutByElement(element);
        if (layout) {
            this.toggleLayout(layout);
        }
    },

    /**
     * 设置 id 为指定参数值的 layout 为{@link EditorLayoutMixin.currentLayout|currentLayout}
     * @memberof EditorLayoutMixin
     * @param  {layoutId} layoutId - layout 的 id
     */
    setLayoutByLayoutId(layoutId) {
        this.currentLayout = this.layouts.find((layout) => {
            return layout.$id === layoutId;
        });
    },

    /**
     * 调换 layout 位置
     * @memberof EditorLayoutMixin
     * @param  {layout | index} layoutA - layout 对象或 layout 索引
     * @param  {layout | index} layoutB - layout 对象或 layout 索引
     */
    switchLayout(layoutA, layoutB) {
        const layouts = this.layouts;
        let indexA = null;
        let indexB = null;

        if (isNumber(layoutA)) {
            indexA = layoutA % layouts.length;
            layoutA = layouts[indexA];
        } else {
            indexA = layouts.indexOf(layoutA);
        }
        if (isNumber(layoutB)) {
            indexB = layoutB % layouts.length;
            layoutB = layouts[indexB];
        } else {
            indexB = layouts.indexOf(layoutB);
        }

        layouts.splice(indexA, 1, layoutB);
        layouts.splice(indexB, 1, layoutA);

        const action = {
            tag: 'swap_layout',
            layoutA,
            layoutB,
        };
        this.makeSnapshot(action);
    },

    /**
     * 移动 layout 到数组索引位置
     * @memberof EditorLayoutMixin
     * @param {layout} layout - 待移动的 layout 对象
     * @param {number} index - 新索引位置
     */
    shiftLayout(layout, index) {
        const oldIndex = this.layouts.indexOf(layout);
        this.layouts.splice(oldIndex, 1);
        this.layouts.splice(index, 0, layout);

        const action = {
            tag: 'swap_layout',
            layoutA: layout,
            layoutB: layout,
        };
        this.makeSnapshot(action);
    },

    /**
     * 选中 layout 背景
     * @memberof EditorLayoutMixin
     * @param {layout | index} layout - layout 对象或 layout 索引
     */
    focusLayoutBackground(layout) {
        layout = this.getLayout(layout);
        if (layout.$backgroundImageInfo && this.editable) {
            this.clearSelectedElements();
            this.currentElement = null;
            this.currentLayout = layout;
            layout.$backgroundSelected = true;
        }
    },

    /**
     * layout 进入背景剪裁状态
     * @memberof EditorLayoutMixin
     * @param {layout | index} layout - layout 对象或 layout 索引
     */
    showBackgrounCroper(layout) {
        layout = this.getLayout(layout);

        if (layout.$backgroundImageInfo && this.editable) {
            this.focusLayoutBackground(layout);
            layout.$backgroundEditing = true;
        }
    },

    /**
     * layout 退出背景剪裁状态
     * @memberof EditorLayoutMixin
     * @param {layout | index} layout - layout 对象或 layout 索引
     */
    hideBackgrounCroper(layout) {
        layout = this.getLayout(layout);
        layout.$backgroundEditing = false;
    },
};
