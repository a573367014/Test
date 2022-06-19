import * as Y from '@gaoding/yjs';
import type { ILayoutModel, ElementModel, IEditorGlobal, UID } from '../../types/editor';
import type { YElement, YLayout, YGlobal } from '../../types/y';
import { uuid } from '@gaoding/editor-utils/string';
import { irrelevantRenderProps } from '../editor-defaults/element.js';

function shouldIgnore(key: string): boolean {
    if (key === '$cacheParentId' || key === '$tempGrouId') return false;
    if (key[0] === '$' || key[0] === '_') return true;
    if (key === 'elements') return true;
    return false;
}

// https://stackoverflow.com/questions/31538010/test-if-a-variable-is-a-primitive-rather-than-an-object
function isPrimitive(a: unknown) {
    return a !== Object(a);
}

function toYArray(val: unknown[]): Y.Array<unknown> {
    const yArray = new Y.Array();
    for (const child of val) {
        yArray.push([syncNode(child)]);
    }
    return yArray;
}

function syncNode(node: unknown) {
    // 记录 undefined yjs 可能会报错
    if (node === undefined) return null;
    if (isPrimitive(node) || node === null) {
        return node;
    } else if (Array.isArray(node)) {
        return toYArray(node);
    } else if (typeof node === 'object') {
        const yMap = new Y.Map();
        Object.keys(node).forEach((key) => {
            let val = node[key];

            if (shouldIgnore(key)) return;

            // transform 循环引用导致异常
            if ((key === 'transform' || key === 'imageTransform') && val && val.toJSON) {
                val = val.toJSON();
            }

            const yNode = syncNode(val);
            yMap.set(key, yNode);
        });
        return yMap;
    } else {
        console.error('unable to sync node:', node);
    }
}

function compareNode(yVal: unknown, b: unknown): boolean {
    if (isPrimitive(yVal) || yVal === null || b === null) {
        return yVal === b;
    } else if (Array.isArray(b) && yVal instanceof Y.Array) {
        return yVal.length === b.length && b.every((child, i) => compareNode(yVal.get(i), child));
    } else if (typeof b === 'object' && yVal instanceof Y.Map) {
        const keys = new Set<string>();
        yVal.forEach((_, key) => keys.add(key));
        Object.keys(b).forEach((key) => keys.add(key));
        let flag = true;
        keys.forEach((key) => {
            if (shouldIgnore(key)) return;
            if (!compareNode(yVal.get(key), b[key])) {
                flag = false;
            }
        });
        return flag;
    }
    return false;
}

function syncTopLevelProp(
    key: string,
    yModel: YElement | YLayout,
    props: ElementModel | Partial<ILayoutModel>,
    setCallback?: (key: string) => void,
) {
    if (shouldIgnore(key)) return;

    let val = props[key];
    // 对 transform 避免对比其深层结构，使用其 toJSON 后的模板数据格式
    if ((key === 'transform' || key === 'imageTransform') && val && val.toJSON) {
        val = val.toJSON();
    }

    if (!compareNode(yModel.get(key), val)) {
        yModel.set(key, syncNode(val));
        setCallback?.(key);
    }
}

export function syncGlobalProps(yGlobal: YGlobal, props: Partial<IEditorGlobal>) {
    Object.keys(props).forEach((key) => {
        if (shouldIgnore(key)) return;
        if (key === 'zoom') return;
        const yNode = syncNode(props[key]);
        yGlobal.set(key, yNode);
    });
}

export function syncModelProps(
    yModel: YElement | YLayout,
    props: Partial<ElementModel | ILayoutModel>,
    setTopPropCallback?: (key: string) => void,
) {
    // 特殊处理需转换格式的 elements 字段
    if ('elements' in props) {
        yModel.set('elements', new Y.Array());
    }

    Object.keys(props).forEach((key) => syncTopLevelProp(key, yModel, props, setTopPropCallback));
}

export function yEventToProps(event: Y.YEvent) {
    const yMap = event.target as Y.Map<unknown>;
    const props = {};
    event.changes.keys.forEach((_, key) => {
        const yVal = yMap.get(key);
        // $tempGroupId 可能在更新后被置空，普通属性不会
        if (yVal === undefined && key !== '$tempGroupId') {
            console.error(`${key}: is undefined`, yMap);
            return;
        }
        if (isPrimitive(yVal)) {
            props[key] = yVal;
        } else {
            props[key] = (yVal as Y.Map<unknown> | Y.Array<unknown>).toJSON();
        }
    });
    return props;
}

function less(indexA: string, indexB: string, idA: string, idB: string) {
    if (indexA < indexB) return true;
    // index 相同时按照 UUID 排序
    if (indexA === indexB) {
        if (idA < idB) return true;
    }
    return false;
}

/** 校验 elements 序列是否满足 $index 的 less 关系 */
export function validateElements(keys: string[], ids: UID[], ignores: number[]): boolean {
    if (keys.length !== ids.length) return false;

    // 选出所有可供校验的元素，临时数组中存储的是某个 fractional index 的下标而非其值
    // 注意某个 fractional index 可以为 null，这时对应的元素同样应被忽略
    const availableKeyIndices: number[] = [];
    for (let i = 0; i < keys.length; i++) {
        if (typeof keys[i] === 'string' && !ignores.includes(i)) {
            availableKeyIndices.push(i);
        }
    }

    let flag = true;
    for (let i = 0; i < availableKeyIndices.length - 1; i++) {
        // 依次比较相邻的 fractional index 是否满足 less 关系
        const left = availableKeyIndices[i];
        const right = availableKeyIndices[i + 1];
        const leftIndex = keys[left];
        const rightIndex = keys[right];

        if (!less(leftIndex, rightIndex, ids[left], ids[right])) {
            flag = false;
        }
    }

    return flag;
}

/** 根据 $index 重排存在错误的元素下标 */
export function reorderElements(keys: string[], ids: UID[], ignores: number[]) {
    const result: [number[], number[]] = [[], []];
    // 为 fractional index 附带上 id 为后缀，以保证始终存在 less 关系
    keys = keys.map((key, i) => (key === null ? null : key + '.' + ids[i]));

    const availableKeyIndices: number[] = [];
    const availableKeys: string[] = [];
    for (let i = 0; i < keys.length; i++) {
        if (typeof keys[i] === 'string' && !ignores.includes(i)) {
            availableKeyIndices.push(i);
            availableKeys.push(keys[i]);
        }
    }

    const newAvailableKeys = [...availableKeys];
    newAvailableKeys.sort((a, b) => (a > b ? 1 : -1));

    for (const i of availableKeyIndices) {
        const key = keys[i];
        const newIndex = newAvailableKeys.indexOf(key);
        const oldKey = availableKeys[newIndex];
        const oldIndex = keys.indexOf(oldKey);
        result[0].push(i);
        result[1].push(oldIndex);
    }

    return result;
}

/** 使 uuid 与 imageUrl/effectResult 绑定 */
export function getSyncFallBackMethod(yModel: YElement | YLayout, element: ElementModel) {
    let needUpdate = false;
    return (key: string) => {
        if (needUpdate) return;
        if (key[0] !== '$' && !irrelevantRenderProps.has(key)) {
            needUpdate = true;
        }

        const id = uuid();
        yModel.set('$fallbackId', id);
        element.$fallbackId = id;
    };
}
