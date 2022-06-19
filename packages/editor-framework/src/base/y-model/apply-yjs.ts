import * as Y from '@gaoding/yjs';
import type {
    ElementModel,
    IEditorGlobal,
    IGroupElementModel,
    ILayoutModel,
    IVPEditor,
    UID,
} from '../../types/editor';
import type { YElement, YGlobal, YLayout } from '../../types/y';

import { yEventToProps } from './sync-utils';
import type { YBinding } from './binding';

// 每个 YEvent 可能对应一或多个 action，对 setTemplet 直接在 events 中识别后特殊处理
enum YActionTag {
    AddElement = 'add_element',
    ChangeElement = 'change_element',
    RemoveElement = 'remove_element',
    ReplaceElement = 'replace_element',
    ReparentElement = 'reparent_element',
    ShiftElement = 'shift_element',
    AddLayout = 'add_layout',
    ChangeLayout = 'change_layout',
    RemoveLayout = 'remove_layout',
    ReplaceLayout = 'replace_layout',
    ChangeGlobal = 'change_global',
    Ignore = 'ignore',
}

type ElementUpdateActionTag = YActionTag.ChangeElement | YActionTag.ShiftElement;
type ElementReparentActionTag = YActionTag.ReparentElement;
type ElementMapActionTag =
    | YActionTag.AddElement
    | YActionTag.RemoveElement
    | YActionTag.ReplaceElement;
type LayoutMapActionTag = YActionTag.AddLayout | YActionTag.RemoveLayout | YActionTag.ReplaceLayout;

interface BaseAction {
    tag: string;
    event: Y.YEvent;
}

interface ElementMapAction extends BaseAction {
    tag: ElementMapActionTag;
    uuid: UID;
}

interface ElementUpdateAction extends BaseAction {
    tag: ElementUpdateActionTag;
    uuid: UID;
    $index: string;
    $parentId: UID;
}

interface ElementReparentAction extends BaseAction {
    tag: ElementReparentActionTag;
    uuid: UID;
    $index: string;
    $parentId: UID;
    existingModel: ElementModel | null;
}

interface LayoutMapAction extends BaseAction {
    tag: LayoutMapActionTag;
    uuid: UID;
}

interface LayoutUpdateAction extends BaseAction {
    tag: YActionTag.ChangeLayout;
}

interface GlobalUpdateAction extends BaseAction {
    tag: YActionTag.ChangeGlobal;
}

interface IgnoreAction extends BaseAction {
    tag: YActionTag.Ignore;
}

type YAction =
    | ElementMapAction
    | ElementReparentAction
    | ElementUpdateAction
    | LayoutMapAction
    | LayoutUpdateAction
    | GlobalUpdateAction
    | IgnoreAction;

// 供调试协作状态
const __LOG_Y_ACTION__ = true;
function logYActions(...args: unknown[]) {
    if (__LOG_Y_ACTION__) console.log('%cYActions', 'color:red;', ...args);
}

function getEventKeys(event: Y.YEvent): string[] {
    return Array.from(event.changes.keys.keys());
}

function isElementMapUpdate(event: Y.YEvent): boolean {
    const { path } = event;
    return event instanceof Y.YMapEvent && path.length === 1 && path[0] === 'elementMap';
}

function isLayoutMapUpdate(event: Y.YEvent): boolean {
    const { path } = event;
    return event instanceof Y.YMapEvent && path.length === 1 && path[0] === 'layoutMap';
}

function hasKeys(keys: string[], expected: string[]) {
    const cache = new Map<string, boolean>();
    for (const str of expected) cache.set(str, false);
    for (const key of keys) {
        if (cache.has(key)) cache.set(key, true);
    }
    let result = true;
    cache.forEach((key) => {
        if (!key) result = false;
    });
    return result;
}

function isSetTemplet(event: Y.YEvent): boolean {
    return event instanceof Y.YMapEvent && hasKeys(getEventKeys(event), ['global', 'layoutMap']);
}

function isChangeElement(event: Y.YEvent): boolean {
    const { path } = event;
    return event instanceof Y.YMapEvent && path[0] === 'elementMap' && path.length >= 2;
}

function isReparentElement(event: Y.YEvent): boolean {
    if (!event.keys.has('$parentId')) return false;
    const oldVal = event._keys.get('$parentId').oldValue as UID;
    const newVal = (event.target as YElement).get('$parentId') as UID;
    return newVal !== oldVal;
}

function isShiftElement(event: Y.YEvent): boolean {
    if (!(event instanceof Y.YMapEvent)) return false;
    const target = event.target as YElement;
    return event.keysChanged.size === 1 && target.has('type') && event.keys.has('$index');
}

function isChangeLayout(event: Y.YEvent): boolean {
    const { path } = event;
    return event instanceof Y.YMapEvent && path[0] === 'layoutMap' && path.length >= 2;
}

function isChangeGlobal(event: Y.YEvent): boolean {
    const target = event.target as YGlobal;
    return target.has('dpi') && target.has('layout');
}

function getMapAction(
    event: Y.YEvent,
    type: ElementMapActionTag | LayoutMapActionTag,
    id: UID,
): ElementMapAction | LayoutMapAction {
    return {
        tag: type,
        uuid: id,
        event,
    };
}

function getElementUpdateAction(
    event: Y.YEvent,
    type: ElementUpdateActionTag,
): ElementUpdateAction {
    const yElement = event.target as YElement;
    const uuid = yElement.get('uuid') as UID;
    return {
        tag: type,
        uuid,
        $parentId: yElement.get('$parentId') as UID,
        $index: yElement.get('$index') as string,
        event,
    };
}

function getExistingParent(editor: IVPEditor, parentId: UID): ILayoutModel | IGroupElementModel {
    const layout = editor.layouts.find((layout) => layout.uuid === parentId);
    if (layout) return layout;
    return editor.getElement(parentId, { deep: true }) as IGroupElementModel;
}

function getElementReparentAction(editor: IVPEditor, event: Y.YEvent): ElementReparentAction {
    const yElement = event.target as YElement;
    const uuid = yElement.get('uuid') as UID;
    const $parentId = yElement.get('$parentId') as UID;
    return {
        tag: YActionTag.ReparentElement,
        uuid,
        $parentId,
        $index: yElement.get('$index') as string,
        existingModel: editor.getElement(uuid, { deep: true }),
        event,
    };
}

// 可能未插入模板的均为 group 元素，不考虑 layout
function recoverElement(editor: IVPEditor, uuid: UID) {
    const yBinding = editor.$binding;
    const yElement = yBinding.yElementMap.get(uuid);
    if (yElement) {
        const group = yElement.toJSON() as IGroupElementModel;
        group.elements = [];
        let parent = getExistingParent(editor, group.$parentId);
        // 对嵌套多层临时组场景，需递归恢复出整条子节点链
        if (!parent) {
            recoverElement(editor, group.$parentId);
            parent = getExistingParent(editor, group.$parentId);
        }
        const index = yBinding.convertFIndex(yElement, parent.elements);
        editor.addElement(group, parent, index);
    }
}

function toTempProps(editor: IVPEditor, actions: YAction[]): ElementModel[] {
    const yBinding = editor.$binding;
    const tempProps: ElementModel[] = [];

    for (const action of actions) {
        if (action.tag === YActionTag.AddElement || action.tag === YActionTag.ReplaceElement) {
            const model = yBinding.serializeElement(action.uuid);
            tempProps.push(model);
        } else if (
            action.tag === YActionTag.ReparentElement ||
            action.tag === YActionTag.ChangeElement ||
            action.tag === YActionTag.ShiftElement
        ) {
            const model = yBinding.serializeElement(action.uuid);
            tempProps.push(model);
        }
    }

    return tempProps;
}

function toActions(editor: IVPEditor, events: Y.YEvent[]): YAction[] {
    const actions: YAction[] = [];

    for (const event of events) {
        if (isElementMapUpdate(event)) {
            const ids = getEventKeys(event);
            const { keys } = event.changes;
            for (const id of ids) {
                const actionType = keys.get(id).action;
                if (actionType === 'add') {
                    actions.push(getMapAction(event, YActionTag.AddElement, id));
                } else if (actionType === 'update') {
                    actions.push(getMapAction(event, YActionTag.ReplaceElement, id));
                } else if (actionType === 'delete') {
                    actions.push(getMapAction(event, YActionTag.RemoveElement, id));
                }
            }
        } else if (isReparentElement(event)) {
            actions.push(getElementReparentAction(editor, event));
        } else if (isShiftElement(event)) {
            actions.push(getElementUpdateAction(event, YActionTag.ShiftElement));
        } else if (isChangeElement(event)) {
            actions.push(getElementUpdateAction(event, YActionTag.ChangeElement));
        } else if (isLayoutMapUpdate(event)) {
            const ids = getEventKeys(event);
            const { keys } = event.changes;
            for (const id of ids) {
                const actionType = keys.get(id).action;
                if (actionType === 'add') {
                    actions.push(getMapAction(event, YActionTag.AddLayout, id));
                } else if (actionType === 'update') {
                    actions.push(getMapAction(event, YActionTag.ReplaceLayout, id));
                } else if (actionType === 'delete') {
                    actions.push(getMapAction(event, YActionTag.RemoveLayout, id));
                }
            }
        } else if (isChangeLayout(event)) {
            actions.push({
                tag: YActionTag.ChangeLayout,
                event,
            });
        } else if (isChangeGlobal(event)) {
            actions.push({
                tag: YActionTag.ChangeGlobal,
                event,
            });
        } else {
            // 对应 setTemplet 后会触发对 elementMap 的空操作
            actions.push({
                tag: YActionTag.Ignore,
                event,
            });
        }
    }

    return actions;
}

function applyYActions(editor: IVPEditor, tempProps: ElementModel[], actions: YAction[]) {
    const yBinding = editor.$binding;
    const modifiedParents = new Set<IGroupElementModel | ILayoutModel>();
    const modifiedElements = new Set<ElementModel>();
    const modifiedLayouts = new Set<ILayoutModel>();

    for (const action of actions) {
        switch (action.tag) {
            case YActionTag.AddElement: {
                const id = action.uuid;
                const props = tempProps.find((model) => model.uuid === id);
                const parent = yBinding.getParentById(props.$parentId);
                const existingElement = editor.getElement(id, {
                    deep: true,
                });

                if (
                    existingElement === null && // 可能 undo 时元素已在 VPE 中存在，此时应忽略该操作
                    // 插入嵌套组时，元素会由子节点向上逐个插入
                    // 此时子节点的 parent 尚未在 VPE 中实例化
                    parent !== null
                ) {
                    const yElement = yBinding.yElementMap.get(action.uuid) as YElement;
                    const index = yBinding.convertFIndex(yElement, parent.elements);
                    const element = editor.addElement(props, parent, index);
                    modifiedElements.add(element);
                    modifiedParents.add(parent);
                }
                break;
            }
            case YActionTag.ChangeElement: {
                // 导出全量 props 调用 changeElement 可能有冲突
                // 如文字元素修改 color 时不应出现冗余 contents 字段
                // 故应依据具体的 key 细粒度更新元素
                const props = yEventToProps(action.event) as Partial<ElementModel>;
                const element = editor.getElement(action.uuid, { deep: true });

                if ('elements' in props) {
                    delete props.elements;
                }

                // 对嵌套临时组场景，修改的 yModel 此时未必在 VPE 中
                if (!element) {
                    break;
                }

                // 某些联动属性在 watch 函数中又修改一遍，如 writingMode
                editor.$binding.config.applyingYActions = true;
                editor.shallowChangeElement(props, element);

                break;
            }
            case YActionTag.RemoveElement: {
                const element = editor.getElement(action.uuid, { deep: true });
                // 可能 undo 时先触发 remove_layout 再 remove_element
                // 此时 VPE 中没有对应的 element
                if (element) {
                    const parent = getExistingParent(editor, element.$parentId);
                    editor.removeElement(element, parent);
                }
                break;
            }
            case YActionTag.ReplaceElement: {
                const id = action.uuid;
                const props = tempProps.find((model) => model.uuid === id);
                const element = editor.getElement(id, { deep: true });
                editor.replaceElement(element, props);
                break;
            }
            case YActionTag.ShiftElement: {
                const parent = getExistingParent(editor, action.$parentId);
                const element = editor.getElement(action.uuid, { deep: false, layouts: [parent] });
                const yElement = yBinding.getYElement(element);
                const index = yBinding.convertFIndex(yElement, parent.elements);
                parent.elements.splice(parent.elements.indexOf(element), 1);
                parent.elements.splice(index, 0, element);
                if (parent) modifiedParents.add(parent);
                break;
            }
            case YActionTag.ReparentElement: {
                if (action.existingModel !== null) {
                    const oldParent = getExistingParent(editor, action.existingModel.$parentId);
                    editor.removeElement(action.existingModel, oldParent);
                }

                let parent = getExistingParent(editor, action.$parentId);
                // 若解除临时组后撤销，此时中间层级的 group 未被影响
                // 故对于 undo 后需要加回模板的原组内叶子节点， 其 reparent 时无法找到父节点
                // 故在 reparent 遇到 VPE 中不存在的元素时，应一并恢复出该元素
                if (!parent) {
                    recoverElement(editor, action.$parentId);
                    parent = getExistingParent(editor, action.$parentId);
                }

                const props = tempProps.find((model) => model.uuid === action.uuid);
                const yElement = yBinding.getYElement(props);
                const index = yBinding.convertFIndex(yElement, parent.elements);
                const element = editor.addElement(props, parent, index);
                Object.assign(props, yEventToProps(action.event));

                modifiedElements.add(element);
                modifiedParents.add(parent);
                break;
            }
            case YActionTag.AddLayout: {
                const id = action.uuid;
                const props = yBinding.serializeLayout(id);
                const yLayout = yBinding.yLayoutMap.get(action.uuid) as YLayout;
                const index = yBinding.convertFIndex(yLayout, editor.layouts);
                editor.addLayout(props, index);
                break;
            }
            case YActionTag.RemoveLayout: {
                const id = action.uuid;
                const layout = editor.layouts.find((layout) => layout.uuid === id);
                editor.removeLayout(layout);
                break;
            }
            case YActionTag.ReplaceLayout: {
                const id = action.uuid;
                const props = yBinding.serializeLayout(id);
                const yLayout = action.event.target as YLayout;
                const layout = editor.layouts.find((layout) => layout.uuid === id);
                const indexFromKey = yBinding.convertFIndex(yLayout, editor.layouts);
                editor.removeLayout(layout);
                editor.addLayout(props, indexFromKey);
                break;
            }
            case YActionTag.ChangeLayout: {
                const props = yEventToProps(action.event) as Partial<ILayoutModel>;
                const uuid = (action.event.target as YLayout).get('uuid') as UID;
                delete props.elements;
                const layout = editor.layouts.find((layout) => layout.uuid === uuid);

                if (!layout) {
                    console.error('Missing VPE layout');
                    return;
                }

                editor.changeLayout(props, layout);
                modifiedLayouts.add(layout);
                break;
            }
            case YActionTag.ChangeGlobal: {
                const props = action.event.target.toJSON() as IEditorGlobal;
                editor.changeGlobal(props);
                break;
            }
        }

        editor.$nextTick(() => {
            editor.$binding.config.applyingYActions = false;
        });
    }

    modifiedParents.forEach((parent) => {
        parent.elements.sort((a, b) => {
            const indexA = yBinding.getYElement(a).get('$index') as string;
            const indexB = yBinding.getYElement(b).get('$index') as string;
            if (indexA > indexB) return 1;
            else if (indexA < indexB) return -1;
            return a > b ? 1 : -1;
        });
    });

    modifiedElements.forEach((model) => {
        if ('elements' in model && model.elements.length === 0) {
            const props = yBinding.serializeElement(model.uuid, true) as IGroupElementModel;
            props.elements.forEach((child) => {
                const yChild = yBinding.getYElement(child);
                // serializeElement 时使用 elements 字段的 UID[] 获取子节点
                // 故此处恢复出的子元素可能为来自 undo 的脏数据，此时应将 YModel 作为 source of truth 进行过滤
                if (yChild.get('$parentId') === model.uuid) {
                    editor.addElement(child, model);
                }
            });
        }
    });

    if (modifiedLayouts.size > 0) {
        editor.layouts.sort((a, b) => {
            const indexA = yBinding.getYLayout(a).get('$index') as string;
            const indexB = yBinding.getYLayout(b).get('$index') as string;
            if (indexA !== indexB) return indexA > indexB ? 1 : -1;
            return a.uuid > b.uuid ? 1 : -1;
        });
    }
}

export async function applyYChanges(binding: YBinding, events: Y.YEvent[]) {
    const { editor } = binding;

    if (isSetTemplet(events[0])) {
        let templet = binding.serializeTemplet();

        if (!templet.layouts.length) {
            logYActions('resetTemplet', events[0], templet);
            editor.resetTemplet(true);
            this.editor.options?.captureErrorHook(new Error('resetTemplet'));

            return;
        }

        logYActions('SetTemplet', events[0], templet);

        if (editor?.options?.collabOptions?.setTempletHook) {
            templet = (await editor.options.collabOptions.setTempletHook(templet)) || templet;
        }

        await editor.setTemplet(templet, 0, true);
        return; // setTemplet 为特殊处理的单次异步操作
    }

    const actions = toActions(editor, events);
    const tempProps = toTempProps(editor, actions);

    logYActions(actions);

    applyYActions(editor, tempProps, actions);
}
