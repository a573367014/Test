import * as Y from '@gaoding/yjs';
import { generateKeyBetween, generateNKeysBetween } from 'fractional-indexing';
import { set } from 'lodash';
import {
    syncModelProps,
    syncGlobalProps,
    validateElements,
    reorderElements,
    getSyncFallBackMethod,
} from './sync-utils';
import type {
    IVPEditor,
    ILayoutModel,
    IGroupElementModel,
    ElementModel,
    IEditorGlobal,
    VPEAction,
    ActionLog,
    UID,
    ITempletModel,
} from '../../types/editor';

import type {
    YElement,
    YGlobal,
    YLayout,
    YUrlMap,
    yFallbackMap,
    YTemplet,
    YActionLogs,
} from '../../types/y';

import { uuid } from '@gaoding/editor-utils/string';
import { isDataUrl } from '@gaoding/editor-utils/binary';
import { exportResourceBlob } from '../../utils/export-resource';
import { checkDataUrl, PLACEHOLDER_PROTOCOL } from '../../utils/export-resource/check-dataurl';
import { applyYChanges } from './apply-yjs';

// 供调试协作状态
const __LOG_VPE_ACTION__ = true;
export function logVPEAction(...args: unknown[]) {
    if (__LOG_VPE_ACTION__) console.log('%cVPEAction', 'color:green;', ...args);
}
const noop = (..._args: unknown[]) => {};

export class YBinding {
    doc: Y.Doc;
    editor: IVPEditor;
    undoMgr: Y.UndoManager;
    yTemplet: YTemplet;
    yUrlMap: YUrlMap;
    yFallbackMap: yFallbackMap;
    yActionLogs: YActionLogs;

    config = {
        transactable: true,
        acceptElementAction: true,
        // applyYActions 同步修改时某些联动属性会在 watch 函数中再次修改，如 writingMode
        applyingYActions: false,
    };

    private _isRemoteUpdating = false; // 不可配置的内部更新状态

    constructor(editor: IVPEditor, doc: Y.Doc | null) {
        this.doc = doc || new Y.Doc();
        this.editor = editor;
        this.yTemplet = this.doc.getMap('templet');
        this.yUrlMap = this.doc.getMap('urlMap');
        this.yFallbackMap = this.doc.getMap('fallbackMap');
        this.yActionLogs = this.doc.getArray('actionLogs');

        this.yTemplet.observeDeep(this._remoteObserver);

        this.undoMgr = new Y.UndoManager(this.yTemplet, {
            trackedOrigins: new Set([YBinding]),
            // 特效绘制等会延迟 100-200 毫秒触发
            captureTimeout: 300,
        });
    }

    get yLayoutMap(): Y.Map<YLayout> {
        let yLayoutMap = this.yTemplet.get('layoutMap');
        if (!yLayoutMap) {
            yLayoutMap = new Y.Map();
            this.yTemplet.set('layoutMap', yLayoutMap);
        }

        return yLayoutMap as Y.Map<YLayout>;
    }

    get yElementMap(): Y.Map<YElement> {
        let yElementMap = this.yTemplet.get('elementMap');
        if (!yElementMap) {
            yElementMap = new Y.Map();
            this.yTemplet.set('elementMap', yElementMap);
        }

        return yElementMap as Y.Map<YElement>;
    }

    get yGlobal(): YGlobal {
        let yGlobal = this.yTemplet.get('global');
        if (!yGlobal) {
            yGlobal = new Y.Map();
            this.yTemplet.set('global', yGlobal);
        }

        return yGlobal as YGlobal;
    }

    getYLayout(layout: ILayoutModel): YLayout {
        return this.yLayoutMap.get(layout.uuid);
    }

    getYElement(element: ElementModel): YElement {
        const yElement = this.yElementMap.get(element.uuid);
        return yElement;
    }

    getParentById(parentId: UID, layouts?: ILayoutModel[]): IGroupElementModel | ILayoutModel {
        if (!layouts) layouts = this.editor.layouts;
        for (const layout of layouts) {
            if (layout.uuid === parentId) return layout;
        }
        return this.editor.getElement(parentId, { deep: true }) as IGroupElementModel;
    }

    serializeElement(id: UID, deep = false): ElementModel {
        const yElement = this.yElementMap.get(id);
        if (!yElement) {
            console.error(id);
            return;
        }
        const element: ElementModel = yElement.toJSON();

        if ('elements' in element) {
            if (deep) {
                const ids = this._getChildren(element);
                element.elements = ids.map((id) => this.serializeElement(id, true));
            } else {
                element.elements = [];
            }
        }

        return element;
    }

    serializeLayout(id: UID): ILayoutModel {
        const yLayout = this.yLayoutMap.get(id);
        const layout: ILayoutModel = yLayout.toJSON();
        const ids = this._getChildren(layout);
        layout.elements = ids.map((id) => this.serializeElement(id, true));
        return layout;
    }

    serializeTemplet(): Omit<ITempletModel, 'version'> {
        const layouts: ILayoutModel[] = [];

        // 此时应隐式初始化新建 yElementMap，否则可能导致后续 YEvent 路径异常
        noop(this.yElementMap);

        this.yLayoutMap.forEach((yLayout) => {
            layouts.push(this.serializeLayout(yLayout.get('uuid') as string));
        });

        layouts.sort((a, b) => {
            const indexA = this.yLayoutMap.get(a.uuid).get('$index') as string;
            const indexB = this.yLayoutMap.get(b.uuid).get('$index') as string;

            if (indexA > indexB) return 1;
            else if (indexA < indexB) return -1;
            return a.uuid > b.uuid ? 1 : -1;
        });

        return {
            type: 'poster',
            global: this.yGlobal.toJSON(),
            layouts,
        };
    }

    private _addLayout(layout: ILayoutModel) {
        const yLayout: YLayout = new Y.Map();

        this.yLayoutMap.set(layout.uuid, yLayout);

        for (const child of layout.elements) {
            this._addElement(child, layout);
        }

        yLayout.set('uuid', layout.uuid);

        this._updateIndex(layout, this.editor.layouts, 'add_layout');

        this._beforeSyncYModel(layout);

        syncModelProps(yLayout, layout);
    }

    private _changeLayout(layout: ILayoutModel, props: Partial<ILayoutModel>) {
        if (!layout.uuid) return;
        const yLayout = this.getYLayout(layout);

        this._beforeSyncYModel(layout);
        syncModelProps(yLayout, props);
    }

    private _removeLayout(layout: ILayoutModel) {
        this._removeElements(layout.elements);
        this.yLayoutMap.delete(layout.uuid);
    }

    private _swapLayout(layoutA: ILayoutModel, layoutB: ILayoutModel) {
        this._updateIndex(layoutA, this.editor.layouts, 'swap_layout_1');
        this._updateIndex(layoutB, this.editor.layouts, 'swap_layout_2');
    }

    private _createElement(
        props: ElementModel,
        parent: ILayoutModel | IGroupElementModel,
    ): YElement {
        if (props.type[0] === '$') {
            return null;
        }

        const yFallbackMap = this.yFallbackMap;
        const yElement: YElement = new Y.Map();

        yElement.set('$parentId', parent.uuid);
        this._beforeSyncYModel(props);

        // 创建时首次缓存 imageUrl
        if (props.imageUrl && !props.$fallbackId) {
            props.$fallbackId = uuid();
            yElement.set('$fallbackId', props.$fallbackId);
        }

        if (props.imageUrl && props.$fallbackId && !yFallbackMap.get(props.$fallbackId)) {
            yFallbackMap.set(props.$fallbackId, {
                url: props.imageUrl,
                ...(props.effectedResult?.width
                    ? {
                          width: props.effectedResult.width,
                          height: props.effectedResult.height,
                          top: props.effectedResult.top,
                          left: props.effectedResult.left,
                      }
                    : {}),
            });
        }

        syncModelProps(yElement, props);

        this.yElementMap.set(props.uuid, yElement);
        this._updateIndex(props, parent.elements, 'create_element');
        return yElement;
    }

    private _addElement(element: ElementModel, parent: ILayoutModel | IGroupElementModel) {
        if ((element.type as string) === 'tempGroup') {
            return;
        }

        if ('elements' in element) {
            for (const child of element.elements) {
                this._addElement(child, element);
            }
        }

        this._createElement(element, parent);
    }

    private _changeElement(element: ElementModel, deep: boolean) {
        if (element.type === '$selector') {
            for (const child of element.elements) {
                this._changeElement(child, deep);
            }
            return;
        }

        const yElement = this.getYElement(element);
        if (!yElement) return null;

        this._beforeSyncYModel(element);
        syncModelProps(yElement, element, getSyncFallBackMethod(yElement, element));

        // 所有子元素进行 diff 同步
        if (deep && 'elements' in element) {
            for (const child of element.elements) {
                this._changeElement(child, deep);
            }
        }
    }

    private _removeElements(elements: ElementModel[]) {
        for (const element of elements) {
            if ('elements' in element) {
                this._removeElements(element.elements);
            }

            this.yElementMap.delete(element.uuid);
        }
    }

    private _reorderElement(
        elements: ElementModel[],
        parent: IGroupElementModel | ILayoutModel,
        index: number,
    ) {
        this._updateKeysBetween(elements, parent, index, 'reorder');
    }

    private _addGroup(group: IGroupElementModel, layout: ILayoutModel) {
        this._createElement(group, layout);
        for (const child of group.elements) {
            let yChild = this.getYElement(child);

            if (!yChild) {
                // TODO: addGroupByElements, elements 若非已添加画布的元素会出现找不到的 bug
                this._addElement(child, group);
                yChild = this.getYElement(child);
            }

            yChild.set('$parentId', group.uuid);
            this._updateIndex(child, group.elements, 'add_group_1');
            this._changeElement(child, false);
        }
        this._updateIndex(group, layout.elements, 'add_group_2');
    }

    private _flatGroup(
        group: IGroupElementModel,
        removedChildren: IGroupElementModel[],
        parent: ILayoutModel | IGroupElementModel,
        index: number,
    ) {
        this.yElementMap.delete(group.uuid);

        for (const group of removedChildren) {
            this.yElementMap.delete(group.uuid);
        }

        for (const child of group.elements) {
            const yChild = this.getYElement(child);
            syncModelProps(yChild, child);

            yChild.set('$parentId', parent.uuid);

            // 建立临时组时触发的 flatGroup
            if (child.$cacheParentId) yChild.set('$cacheParentId', child.$cacheParentId);
            if (child.$tempGroupId) yChild.set('$tempGroupId', child.$tempGroupId);
            // FIXME 同步 rotate 与 scale 状态
        }

        this._updateKeysBetween(group.elements, parent, index, 'flat_group');
    }

    private _cancelTempGroup(group: IGroupElementModel) {
        const parent = this.getParentById(group.$parentId);
        if (!parent) return;

        this._createElement(group, parent);
        const traverse = (element: ElementModel, parent: IGroupElementModel) => {
            const yElement = this.getYElement(element) || this._createElement(element, parent);

            const upsert = (key: string) => {
                if (yElement.get(key) !== element[key]) {
                    yElement.set(key, element[key]);
                }
            };

            upsert('$parentId');
            upsert('left');
            upsert('top');
            upsert('width');
            upsert('height');
            if (element.rotate !== 0) {
                upsert('rotate');
            }

            yElement.set('$tempGroupId', '');
            yElement.set('$cacheParentId', '');
            if ('elements' in element) {
                element.elements.forEach((child) => traverse(child, element));
            }
        };

        group.elements.forEach((element) => traverse(element, group));
        this._updateIndex(group, parent.elements, 'cancel_temp_group');
    }

    private _changeGlobal(props: Partial<IEditorGlobal>) {
        const { yGlobal } = this;
        syncGlobalProps(yGlobal, props);
    }

    private _pushLog(log: Omit<ActionLog, 'time'>) {
        const yActionLog = new Y.Map<unknown>();
        const yUuids = new Y.Array();
        yUuids.insert(0, log.uuids);

        yActionLog.set('time', new Date().toLocaleTimeString());
        yActionLog.set('uuids', yUuids);
        yActionLog.set('tag', log.tag);

        this.yActionLogs.push([yActionLog]);

        if (this.yActionLogs.length > 10) {
            this.yActionLogs.delete(0);
        }
    }

    // elements 字段在撤销时存在问题，故仅用 $parentId 重建模板嵌套结构
    // TODO: 优化查找性能
    private _getChildren(parent: ILayoutModel | IGroupElementModel): UID[] {
        const ids: UID[] = [];
        this.yElementMap.forEach((yElement, uuid) => {
            if (yElement.get('$parentId') === parent.uuid) {
                ids.push(uuid);
            }
        });
        ids.sort((a, b) => {
            const indexA = this.yElementMap.get(a).get('$index') as string;
            const indexB = this.yElementMap.get(b).get('$index') as string;
            if (indexA > indexB) return 1;
            else if (indexA < indexB) return -1;
            return a > b ? 1 : -1;
        });
        return ids;
    }

    private _getLeftRightKeys(
        modelMap: Y.Map<YElement>,
        index: number,
        rightIndex: number,
        siblings: (ILayoutModel | ElementModel)[],
    ) {
        const left = index <= 0 ? null : siblings[index - 1];
        const leftId = left?.uuid || null;
        const leftKey = (modelMap.get(leftId)?.get('$index') as string) || null;
        let rightKey: string | null = null;

        // 朴素情况下，leftKey 和 rightKey 仅需通过元素左右侧下标即可确定
        // 但当多个组同时从临时组状态恢复，且其首尾均有非组元素时
        // 可能出现形如 [Text, Group, Group, Image] 形式的序列
        // 其中首尾元素的 $index 来自恢复前的状态，而被恢复出的组为尚无 $index 的新元素
        // 故此时其 $index 序列可能对应 ['a1', null, null, 'a11'] 形式
        // 此时对第一个组元素，应避免直接基于 'a1' 和 null 生成 ['a1', 'a2', null, 'a11'] 序列
        // 需持续向右尝试找到首个不为 null 的 key 作为 rightKey，找不到时才使用 null
        for (let i = rightIndex; i < siblings.length; i++) {
            const right = siblings[i];
            const rightId = right?.uuid || null;
            rightKey = (modelMap.get(rightId)?.get('$index') as string) || null;
            if (rightKey !== null) break;
        }

        return [leftKey, rightKey];
    }

    private _report(
        e: Error,
        elements: (ILayoutModel | ElementModel)[],
        index: number,
        type: string,
    ) {
        const isLayout = !('type' in elements[0]);
        const modelMap = isLayout ? this.yLayoutMap : this.yElementMap;
        this.editor.options?.captureErrorHook(
            e,
            `无效序列 i:${index},t:${type},layout:${isLayout ? 1 : 0},fKeys:${elements
                .map((a) => modelMap.get(a.uuid).get('$index'))
                .join(',')},ids:${elements.map((a) => a.uuid.slice(0, 4)).join(',')}`,
        );
    }

    private _updateKeysBetween(
        elements: ElementModel[],
        parent: IGroupElementModel | ILayoutModel,
        index: number,
        logType: string,
    ) {
        const [leftKey, rightKey] = this._getLeftRightKeys(
            this.yElementMap,
            index,
            index + elements.length,
            parent.elements,
        );

        try {
            const indexKeys = generateNKeysBetween(leftKey, rightKey, elements.length);
            for (let i = 0; i < elements.length; i++) {
                const yElement = this.yElementMap.get(elements[i].uuid);
                yElement.set('$index', indexKeys[i]);
            }
        } catch (e) {
            this._report(e, parent.elements, index, logType);
        }
    }

    private _updateIndex(
        model: ILayoutModel | ElementModel,
        siblings: (ILayoutModel | ElementModel)[],
        logType: string,
    ) {
        const index = siblings.indexOf(model);
        const modelMap = 'type' in model ? this.yElementMap : this.yLayoutMap;

        const [leftKey, rightKey] = this._getLeftRightKeys(modelMap, index, index + 1, siblings);
        const yModel = modelMap.get(model.uuid);
        try {
            const indexKey = generateKeyBetween(leftKey, rightKey);

            if (yModel.get('$index') !== indexKey) {
                yModel.set('$index', indexKey);
            }
        } catch (e) {
            this._report(e, siblings, index, logType);
        }
    }

    /** 获得元素的 fractional index */
    private _getFIndex(model: ILayoutModel | ElementModel): string {
        return 'type' in model
            ? (this.yElementMap.get(model.uuid)?.get('$index') as string)
            : (this.yLayoutMap.get(model.uuid)?.get('$index') as string);
    }

    /** 换算 fractional indexing 字段为数组 index */
    convertFIndex(
        yModel: YLayout | YElement,
        baseSiblings: (ILayoutModel | ElementModel)[],
    ): number {
        if (!baseSiblings.length) return 0;

        const uuid = yModel.get('uuid');
        const indexKey = yModel.get('$index');
        const isElement = 'type' in baseSiblings[0];
        const modelMap = isElement ? this.yElementMap : this.yLayoutMap;

        const siblings = baseSiblings.filter((sibling) => {
            if (!isElement) return true;
            const ySibling = modelMap.get(sibling.uuid);
            if (!ySibling || ySibling.get('$parentId') === uuid || ySibling.get('uuid') === uuid) {
                return false;
            }
            return true;
        });
        if (!siblings.length) return 0;

        const firstKey = (modelMap.get(siblings[0].uuid)?.get('$index') as string) || null;
        if (indexKey < firstKey) return 0;

        for (let i = 0; i < siblings.length - 1; i++) {
            const left = siblings[i];
            const yLeft = modelMap.get(left.uuid);

            // 对于先 removeLayout 再 addLayout 的操作流程，left 可能为已被 remove 的元素
            const leftKey = (yLeft?.get('$index') as string) || null;
            const right = siblings[i + 1];
            const rightKey = (modelMap.get(right.uuid)?.get('$index') as string) || null;
            if (
                (leftKey === null && indexKey < rightKey) ||
                (leftKey < indexKey && indexKey < rightKey) ||
                (leftKey < indexKey && rightKey === null)
            ) {
                return i + 1;
            }
        }
        return siblings.length;
    }

    private _reorder(parent: IGroupElementModel | ILayoutModel, mapping: [number[], number[]]) {
        const [oldIndices, newIndices] = mapping;
        const newElements = [...parent.elements];
        for (let i = 0; i < oldIndices.length; i++) {
            const oldIndex = oldIndices[i];
            const newIndex = newIndices[i];
            newElements[newIndex] = parent.elements[oldIndex];
        }
        parent.elements = newElements;
    }

    private _validate(action: VPEAction) {
        const { tag } = action;

        switch (tag) {
            case 'add_group': {
                const { group, layout } = action;
                const i = layout.elements.indexOf(group);
                const keys = layout.elements.map((child) => this._getFIndex(child));
                const ids = layout.elements.map((child) => child.uuid);
                if (!validateElements(keys, ids, [i])) {
                    const mapping = reorderElements(keys, ids, [i]);
                    this._reorder(group, mapping);
                }
                break;
            }
            case 'flat_group': {
                const { parent, index } = action;
                const keys = parent.elements.map((child) => this._getFIndex(child));
                const ids = parent.elements.map((child) => child.uuid);
                const ignores: number[] = [];
                for (let i = 0; i < parent.elements.length; i++) {
                    ignores.push(index + i);
                }

                if (!validateElements(keys, ids, ignores)) {
                    const mapping = reorderElements(keys, ids, ignores);
                    this._reorder(parent, mapping);
                }
                break;
            }
            case 'cancel_temp_group': {
                const { group, index } = action;
                const keys = group.elements.map((child) => this._getFIndex(child));
                const ids = group.elements.map((child) => child.uuid);
                if (!validateElements(keys, ids, [index])) {
                    const mapping = reorderElements(keys, ids, [index]);
                    this._reorder(group, mapping);
                }
                break;
            }
            case 'reorder_element': {
                const { parent, index, elements } = action;
                const ignores: number[] = [];
                for (let i = 0; i < elements.length; i++) {
                    ignores.push(index + i);
                }

                const keys = parent.elements.map((child) => this._getFIndex(child));
                const ids = parent.elements.map((child) => child.uuid);
                if (!validateElements(keys, ids, ignores)) {
                    const mapping = reorderElements(keys, ids, ignores);
                    this._reorder(parent, mapping);
                }
                break;
            }
        }
    }

    private _beforeSyncYModel = (props: ElementModel | ILayoutModel) => {
        const { yUrlMap, editor } = this;
        if (!editor.options.resource.upload) return props;

        checkDataUrl(props, async (key: string, dataUrl: string) => {
            if (yUrlMap.get(dataUrl)) {
                props[key] = yUrlMap.get(dataUrl);
                return;
            }

            // 禁止 base64 资源进行同步
            if (isDataUrl(dataUrl)) {
                set(props, key, PLACEHOLDER_PROTOCOL + uuid());
            }

            const elementData =
                editor.getElement(props.uuid) || editor.getLayout(props as ILayoutModel) || props;

            const cdnUrl = (await exportResourceBlob(
                elementData,
                key,
                dataUrl,
                editor.options,
            )) as string;

            set(elementData, key, cdnUrl);
            this.yUrlMap.set(dataUrl, cdnUrl);

            this.editor.makeSnapshot({
                tag: 'change_element',
                elements: [elementData as ElementModel],
            });
        });
    };

    beforeUpdateEditorModel(props: ElementModel | ILayoutModel) {
        checkDataUrl(props, async (key: string, dataUrl: string) => {
            const cdnUrl = this.yUrlMap.get(dataUrl);
            if (!cdnUrl) return;

            set(props, key, cdnUrl);
        });
    }

    private _setTemplet(layouts: ILayoutModel[], global: IEditorGlobal) {
        // 须同时触发 layoutMap + global 的修改才能满足 apply-yjs 时 isSetTemplet 的判断

        this.yUrlMap.clear();
        this.doc.transact(() => {
            this._clearYTemplet();
            this._changeGlobal(global);
            layouts.forEach((layout) => this._addLayout(layout));
        });
    }

    // 订阅并更新远程改动到本地
    private _remoteObserver = async (events: Y.YEvent[]) => {
        if (!this.config.transactable) return;
        const currentLayout = this.editor.currentLayout;

        this._isRemoteUpdating = true;

        try {
            const beforeYlayoutMapSize = this.yLayoutMap.size;

            await applyYChanges(this, events);

            if (this.yLayoutMap.size === 0) {
                this.editor.options?.captureErrorHook(
                    new Error('yLayoutMap empty'),
                    `协同 remoteObserver 错误: beforeSize=${beforeYlayoutMapSize}`,
                );
            }
        } catch (e) {
            console.error(e);
            this.editor.options?.captureErrorHook(e, '协同 remoteObserver 错误');
        }

        // TODO: 避免中途 currentLayout 被刷新
        if (currentLayout) {
            this.editor.currentLayout = this.editor.getLayout(currentLayout.uuid);
        }

        this.editor.$events.$emit('base.remoteUpdate');
        this._isRemoteUpdating = false;
    };

    private _commitAction(action: VPEAction) {
        const { tag } = action;
        switch (tag) {
            case 'set_templet':
                this._setTemplet(action.layouts, action.global);
                this._pushLog({ tag, uuids: action.layouts.map((l) => l.uuid) });
                break;
            case 'add_layout':
                this._addLayout(action.layout);
                this._pushLog({ tag, uuids: [action.layout.uuid] });
                break;
            case 'change_layout':
                for (const layout of action.layouts) {
                    this._changeLayout(layout, action.props);
                }
                this._pushLog({ tag, uuids: action.layouts.map((l) => l.uuid) });
                break;
            case 'remove_layout':
                this._removeLayout(action.layout);
                this._pushLog({ tag, uuids: [action.layout.uuid] });
                break;
            case 'swap_layout':
                this._swapLayout(action.layoutA, action.layoutB);
                this._pushLog({
                    tag,
                    uuids: [action.layoutA.uuid, action.layoutB.uuid],
                });
                break;
            case 'add_element':
                this._addElement(action.element, action.parent);
                this._pushLog({
                    tag,
                    uuids: [action.element.uuid],
                });
                break;
            case 'change_element':
                for (const element of action.elements) {
                    this._changeElement(element, action.deep);
                }
                this._pushLog({
                    tag,
                    uuids: action.elements.map((e) => e.uuid),
                });
                break;
            case 'remove_element':
                this._removeElements(action.elements);
                this._pushLog({
                    tag,
                    uuids: action.elements.map((e) => e.uuid),
                });
                break;
            case 'reorder_element':
                this._validate(action);
                this._reorderElement(action.elements, action.parent, action.index);
                this._pushLog({
                    tag,
                    uuids: [action.parent.uuid],
                });
                break;
            case 'add_group':
                this._validate(action);
                this._addGroup(action.group, action.layout);
                this._pushLog({
                    tag,
                    uuids: [action.group.uuid],
                });
                break;
            case 'flat_group':
                this._validate(action);
                this._flatGroup(action.group, action.removedChildren, action.parent, action.index);
                this._pushLog({
                    tag,
                    uuids: [action.group.uuid, action.parent.uuid],
                });
                break;
            case 'cancel_temp_group':
                this._validate(action);
                this._cancelTempGroup(action.group);
                this._pushLog({
                    tag,
                    uuids: [action.group.uuid],
                });
                break;
            case 'change_global':
                this._changeGlobal(action.props);
                this._pushLog({
                    tag,
                    uuids: [],
                });
                break;
        }
    }

    commit(action: VPEAction, sync: boolean) {
        const { doc, undoMgr, config } = this;

        // 从远程同步 model 时，会调用 VPE 创建 model 而提交 action
        // 需忽略此时 VPE 侧提交的 action，以避免更新死循环
        if (
            this._isRemoteUpdating ||
            !this.editor.innerProps.snapshotable ||
            !this.editor.options.snapshotable
        )
            return;

        // 成组等复杂操作作为单个 action 提交，忽略中途 VPE 状态修改所触发的原子 action
        if (!config.acceptElementAction && action.tag.includes('element')) return;

        logVPEAction(`editor${this.editor._uid}`, action);

        // 同步本地改动到远程，中途不订阅更新
        this.yTemplet.unobserveDeep(this._remoteObserver);

        // TODO: 优化日志堆栈，尽可能输出更多信息
        let orignalTraceLimit;
        if ((Error as any).stackTraceLimit) {
            orignalTraceLimit = (Error as any).stackTraceLimit;
            (Error as any).stackTraceLimit = Infinity;
        }

        try {
            const beforeYlayoutMapSize = this.yLayoutMap.size;

            if (config.transactable) {
                if (sync) undoMgr.stopCapturing(); // 追加一条历史记录
                doc.transact(() => this._commitAction(action), this);
            } else {
                this._commitAction(action);
            }

            if (
                this.yLayoutMap.size === 0 &&
                (beforeYlayoutMapSize !== 1 || action.tag !== 'remove_layout')
            ) {
                this.editor.options?.captureErrorHook(
                    new Error('yLayoutMap empty'),
                    `协同 commit 错误: beforeSize=${beforeYlayoutMapSize}, action=${action.tag}`,
                    action,
                );
            }
        } catch (e) {
            this.editor.options?.captureErrorHook(
                e,
                '协同 commit 错误',
                Object.assign({}, action, {
                    // sls 无法观测较深的调用栈，自己记录
                    stack: e?.stack,
                    config: {
                        ...this.config,
                        _isRemoteUpdating: this._isRemoteUpdating,
                    },
                }),
            );
            throw e;
        }

        // TODO: 优化日志堆栈，尽可能输出更多信息
        if ((Error as any).stackTraceLimit) {
            (Error as any).stackTraceLimit = orignalTraceLimit;
        }

        this.yTemplet.observeDeep(this._remoteObserver);
    }

    private _clearYTemplet() {
        this.yTemplet.set('global', new Y.Map());
        this.yTemplet.set('elementMap', new Y.Map());
        this.yTemplet.set('layoutMap', new Y.Map());
    }

    destroy() {
        this.yTemplet.unobserveDeep(this._remoteObserver);
        this.undoMgr.destroy();
        this.doc.destroy();
    }
}
