/**
 * @class EditorSnapshotMixin
 * @description 编辑器历史记录相关 API
 */

import { omit, debounce } from 'lodash';
import { YBinding } from '../y-model/binding';
import { Snapshots } from '../y-model/snapshots';

export default {
    initSnapshot(ydoc = null, setTemplet = false) {
        const doc = ydoc;

        this.$binding?.destroy && this.$binding.destroy();
        // 编辑交互 action 适配器
        // https://git.gaoding.com/gaoding/editor/pull/11975
        this.$binding = new YBinding(this, doc);

        // 前向兼容原有历史记录
        // stack-item-added stack-item-popped 在 undo 时会同时触发, 需要防抖
        this.$snapshots = new Snapshots(
            this.$binding,
            debounce((state) => {
                // 原有 setTemplet 会 resetSnapshot 使 snapshotSize 为 1
                // 而用户首次编辑后 changeCount 为 1，此时 snapshotSize 应为 2
                this.snapshotSize = this.$snapshots.changeCount + 1;
                this.hasUndo = this.$snapshots.hasUndo;
                this.hasRedo = this.$snapshots.hasRedo;

                this.$emit('anyChange', state);

                if (this.currentLayout && this.currentLayout.$loaded && this.mode === 'design') {
                    this.lazyUpdatePicker();
                }

                if (
                    this.mode !== 'design'
                        ? this.global.$loaded
                        : this.currentLayout && this.currentLayout.$loaded
                ) {
                    this.$emit('change');
                }
            }, 50),
        );

        setTemplet &&
            this.makeSnapshotTransact(() => {
                this.$binding.commit({
                    tag: 'change_global',
                    props: this.global,
                });

                this.layouts.forEach((layout) => {
                    const action = {
                        tag: 'add_layout',
                        layout,
                        fromRemote: false,
                    };
                    this.$binding.commit(action);
                });
            });

        this.$snapshots.reset();
    },

    /**
     * 重置快照记录
     * @memberof EditorSnapshotMixin
     */
    resetSnapshot() {
        this.$snapshots.reset();
        this.hasUndo = false;
        this.hasRedo = false;
    },

    /**
     * 添加历史快照
     * @memberof EditorSnapshotMixin
     * @param {String|Object} [action] 历史记录 action，建议提供语义化的 action 名，亦可使用 action 对象
     * @param {Layout} [targetLayout] 快照所记录的 layout 对象，若不传则默认为 currentLayout
     * @param {Boolean} [sync] 快照记录时机的同异步，默认为异步
     */
    makeSnapshot(action, _targetLayout = null, sync = false) {
        if (typeof action === 'string') {
            console.warn(`MakeSnapshot does not support strings "action=${action}"`);
        } else if (typeof action === 'object') {
            if (!this.innerProps.snapshotable) return;

            this.$binding.commit(action, sync && !this.options.snapshotDisableSync);
        }
    },

    /**
     * 优化多次提交 commit
     * @memberof EditorSnapshotMixin
     * @param {function} [callback] 回调函数
     */
    makeSnapshotTransact(callback) {
        // transact 嵌套时会有异常，避免嵌套使用
        if (!this.$binding.config.transactable) {
            callback();
            return;
        }

        this.$binding.config.transactable = false;
        try {
            this.$binding.doc.transact(() => {
                callback();
            }, this.$binding);
        } catch (e) {
            console.error(e);
        }
        this.$binding.config.transactable = true;
    },

    /**
     * 根据指定 element 添加历史快照
     * @memberof EditorSnapshotMixin
     * @param {element} [element] 单个元素
     * @param {Boolean} [sync] 快照记录时机的同异步，默认为异步
     * @param {Boolean} [useParent] 是否冒泡找到最顶层元素进行更新（内容改动涉及其他元素排版时需要）
     * @return {snapshot}
     */
    makeSnapshotByElement(element, sync = false, useParent = false) {
        if (element && (element.type.charAt(0) !== '$' || element.type === '$selector')) {
            const action = {
                tag: 'change_element',
                elements: [element],
            };

            if (useParent) {
                action.deep = useParent;
                action.elements = action.elements.map((el) => {
                    const parentLayout = this.getParentLayout(element);
                    if (parentLayout) {
                        return el;
                    }

                    return this.getParentGroups(el)[0] || el;
                });
            }

            this.makeSnapshot(action, null, sync);
        }
    },

    /**
     * 根据指定 element 添加历史快照
     * @memberof EditorSnapshotMixin
     * @param {String} [layout] 单个画布
     * @param {Boolean} [sync] 快照记录时机的同异步，默认为异步
     * @return {snapshot}
     */
    makeSnapshotByLayout(layout, sync = false) {
        const action = {
            tag: 'change_layout',
            layouts: [layout],
            props: omit(layout, ['elements']),
        };
        this.makeSnapshot(action, null, sync);
    },

    /**
     * 开闭历史状态撤回功能，该状态在进行 undo / redo 操作后会重置
     * @memberof EditorSnapshotMixin
     * @param {boolean} snapshotable 是否启用快照
     */
    toggleSnapshot(snapshotable = true) {
        this.innerProps.snapshotable = snapshotable;
    },

    /**
     * 撤回操作
     * @memberof EditorSnapshotMixin
     */
    undo() {
        const { currentElement } = this;
        if (
            currentElement &&
            (currentElement.type === '$croper' ||
                currentElement.type === '$masker' ||
                currentElement.type === '$watermarker')
        ) {
            this.$events.$emit('element.editCancel', currentElement);
            return;
        }
        this.$snapshots.undo();
        this._resetTempGroup();
        this.$events.$emit('base.undo');
        this.innerProps.snapshotable = true;

        this.hasUndo = this.$snapshots.hasUndo;
        this.hasRedo = this.$snapshots.hasRedo;
    },

    /**
     * 重做操作
     * @memberof EditorSnapshotMixin
     */
    redo() {
        this.$snapshots.redo();
        this._resetTempGroup();
        this.$events.$emit('base.redo');
        this.innerProps.snapshotable = true;

        this.hasUndo = this.$snapshots.hasUndo;
        this.hasRedo = this.$snapshots.hasRedo;
    },

    _resetTempGroup() {
        const tempGroupElements = [];

        this.walkTemplet(
            (element) => {
                if (element.$tempGroupId) {
                    if (element.$editing) {
                        element.$editing = false;
                    }

                    tempGroupElements.push(element);
                }
            },
            true,
            [this.currentLayout],
        );

        this.$refs.tempGroup && this.$refs.tempGroup.syncRect(tempGroupElements);
    },

    // TODO：兼容协同版本的方法
    makeSnapshotTransact(callback) {
        callback?.();
    },
};
