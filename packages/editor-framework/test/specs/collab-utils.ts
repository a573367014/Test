import { get } from 'lodash';
import {
    ElementModel,
    IGroupElementModel,
    ILayoutModel,
    ITextElementModel,
    IVPEditor,
    UID,
} from '../../src/types/editor';
import { assert } from '../runtime';
import { CollabTemplet } from '../resources/mock-data';
import type { EditorDriver } from '../runtime/driver';
import Promise from 'bluebird';

export const E0 = 'Element 0';
export const E1 = 'Element 1';
export const E2 = 'Element 2';
export const E3 = 'Element 3';
export const E4 = 'Element 4';
export const E5 = 'Element 5';
export const E6 = 'Element 6';
export const E7 = 'Element 7';
type NameStruct = string | NameStruct[];
type UIDStruct =
    | {
          uuid: UID;
          $index?: number;
          $parentId?: UID;
          $tempGroupId?: UID;
          $cacheParentId?: UID;
          elements?: UIDStruct[];
      }
    | UIDStruct[];

export function assertPathProp(
    editorA: IVPEditor,
    editorB: IVPEditor,
    path: string,
    expected: string | number | boolean,
) {
    const actualA = get(editorA, path);
    const actualB = get(editorB, path);
    const success =
        typeof expected === 'number'
            ? assert.almostEqual(actualA, expected) && assert.almostEqual(actualB, expected)
            : actualA === expected && actualB === expected;

    if (success) {
        assert.ok(true, `path ${path} 取值结果正常`);
    } else {
        console.error(
            'path:',
            path,
            'expected:',
            expected,
            'actualA',
            actualA,
            'actualB:',
            actualB,
        );
        assert.fail('元素字段属性不匹配');
    }
}

export function assertLayout(editor: IVPEditor, expected: NameStruct, msg?: string) {
    function toElementSturcture(element: ElementModel): NameStruct {
        if (element.type !== 'group') return (element as ITextElementModel).content;
        return element.elements.map(toElementSturcture);
    }
    const actual = editor.currentLayout.elements.map(toElementSturcture);
    assert.deepEqual(actual, expected, msg);
}

export function assertEqualUID(editorA: IVPEditor, editorB: IVPEditor) {
    function toUIDStruct(node: ILayoutModel | ElementModel): UIDStruct {
        // group 或 layout
        if ('elements' in node) {
            // group
            if ('type' in node) {
                return {
                    uuid: node.uuid,
                    $parentId: node.$parentId,
                    $cacheParentId: node.$cacheParentId,
                    $tempGroupId: node.$tempGroupId,
                    elements: node.elements.map(toUIDStruct),
                };
            }
            // layout
            else {
                return {
                    uuid: node.uuid,
                    elements: node.elements.map(toUIDStruct),
                };
            }
        }
        // 其他 element
        else {
            return {
                uuid: node.uuid,
                $parentId: node.$parentId,
                $cacheParentId: node.$cacheParentId,
                $tempGroupId: node.$tempGroupId,
            };
        }
    }
    const structA = editorA.layouts.map(toUIDStruct);
    const structB = editorB.layouts.map(toUIDStruct);
    assert.deepEqual(structB, structA, '模板 uuid 结构一致');
}
window.assertEqualUID = assertEqualUID;

export function assertValidTemplet(editor: IVPEditor, msg = '') {
    let isValid = true;
    const visited = new Set<UID>();

    function compareSerializedTemplet(editor: IVPEditor) {
        const tpl = editor.$binding.serializeTemplet();
        const serializedChildIds = [];
        const modelChildIds = [];

        tpl.layouts.forEach((layout) => {
            serializedChildIds.push(layout.uuid);
            editor.walkTemplet(
                (el) => {
                    if (editor.isGroup(el) && 'elements' in el) {
                        serializedChildIds.push(el.elements.map((item) => item.uuid));
                    }
                },
                true,
                [layout],
            );
        });

        editor.layouts.forEach((layout) => {
            modelChildIds.push(layout.uuid);
            editor.walkTemplet(
                (el) => {
                    if (editor.isGroup(el) && 'elements' in el) {
                        modelChildIds.push(el.elements.map((item) => item.uuid));
                    }
                },
                true,
                [layout],
            );
        });

        if (serializedChildIds.toString() !== modelChildIds.toString()) {
            console.error(
                'layout 子节点不同步',
                'serializedChildIds:',
                serializedChildIds,
                'modelChildIds',
                modelChildIds,
            );
            isValid = false;
        }
    }

    function less(
        elementA: ILayoutModel | ElementModel,
        elementB: ILayoutModel | ElementModel,
        indexA: string,
        indexB: string,
    ) {
        if (indexA < indexB) return true;
        if (indexA === indexB) {
            return elementA.uuid < elementB.uuid;
        }

        return false;
    }

    function compare(parent: ILayoutModel | IGroupElementModel, child: ElementModel) {
        const yChild = editor.$binding.getYElement(child);
        if (!yChild) {
            isValid = false;
            console.error('yElement 不同步', child);
            return;
        }

        if (visited.has(child.uuid)) {
            isValid = false;
            console.error('冗余的 uuid', child.uuid);
        }
        if (parent.uuid !== child.$parentId) {
            isValid = false;
            console.error('错误的 uuid 父子关系', 'parent:', parent, 'child:', child);
        }
        const index = parent.elements.indexOf(child);
        if (index < parent.elements.length - 1) {
            const next = parent.elements[index + 1];
            const $index = editor.$binding.getYElement(child).get('$index') as string;
            const $indexNext = editor.$binding.getYElement(next).get('$index') as string;

            if (!less(child, next, $index, $indexNext)) {
                console.log(
                    parent.elements.map((a) => editor.$binding.getYElement(a).get('$index')),
                );
                isValid = false;
                console.error(
                    '错误的 $index 结构',
                    'parent:',
                    parent,
                    'childIndex:',
                    $index,
                    'nextIndex:',
                    $indexNext,
                    'index:',
                    index,
                );
            }
        }

        visited.add(child.uuid);

        if ('elements' in child) {
            child.elements.forEach((element) => compare(child, element));
        }
    }

    compareSerializedTemplet(editor);
    editor.layouts.forEach((layout) => {
        layout.elements.forEach((element) => compare(layout, element));
    });
    if (isValid) assert.ok(true, msg || '模板结构正常');
    else assert.fail('存在模板节点结构异常');
}
window.assertValidTemplet = assertValidTemplet;

export function elementAt(editor: IVPEditor, ...indices: Array<number>): ElementModel {
    let parent: ILayoutModel | IGroupElementModel = editor.currentLayout;
    for (let i = 0; i < indices.length - 1; i++) {
        parent = parent.elements[i] as IGroupElementModel;
    }
    const lastIndex = indices[indices.length - 1];
    return parent.elements[lastIndex];
}

export function waitRemoteUpdate(editor: IVPEditor): Promise<void> {
    return new Promise((resolve) => {
        editor.$events.$once('base.remoteUpdate', () => {
            resolve();
        });
    });
}

export async function initWithGroup(driver: EditorDriver, count: 2 | 3) {
    const editorA = driver.editorAt(0);
    const editorB = driver.editorAt(1);
    await editorA.setTemplet(CollabTemplet);
    await waitRemoteUpdate(editorB);
    await driver.dragCoords([
        { x: 0, y: 0 },
        { x: count * 100, y: count * 100 },
    ]);
    editorA.addGroupByElements();
    await driver.wait();
}

export async function initWithFlex(driver: EditorDriver, count: 2 | 3) {
    const editorA = driver.editorAt(0);
    const editorB = driver.editorAt(1);
    await editorA.setTemplet(CollabTemplet);
    await waitRemoteUpdate(editorB);
    await driver.dragCoords([
        { x: 0, y: 0 },
        { x: count * 100, y: count * 100 },
    ]);

    editorA.addFlexByElements();
    await driver.wait();
}

export async function initWithNestedGroup(driver: EditorDriver, level = 2) {
    const editorA = driver.editorAt(0);
    const editorB = driver.editorAt(1);
    await initWithGroup(driver, 2);
    assertLayout(editorB, [[E0, E1], E2, E3], '成组后状态');
    assertValidTemplet(editorB);
    assertEqualUID(editorA, editorB);

    await driver.dragCoords([
        { x: 0, y: 0 },
        { x: 300, y: 300 },
    ]);
    editorA.addGroupByElements();

    if (level === 3) {
        await driver.wait();
        await driver.dragCoords([
            { x: 0, y: 0 },
            { x: 400, y: 400 },
        ]);
        editorA.addGroupByElements();
    }

    await driver.wait();
}

export async function selectAll(driver: EditorDriver) {
    const layout = driver.editor.currentLayout;
    await driver.dragCoords([
        { x: layout.width, y: layout.height },
        { x: 0, y: 0 },
    ]);
}

export function printTempletStructure(editor: IVPEditor) {
    let result = '';

    function _print(parent: ElementModel | ILayoutModel, level: number) {
        for (let i = 0; i < level * 2; i++) result += ' ';

        let hint = '';
        let index = '';
        if ('type' in parent) {
            if (parent.type === 'text') hint = parent.content;
            else hint = parent.type;
            index = editor.$binding.getYElement(parent).get('$index') as string;
        } else {
            hint = 'layout';
            index = editor.$binding.getYLayout(parent).get('$index') as string;
        }
        result += `${hint} - ${parent.uuid} (${index})\n`;
        if ('elements' in parent) {
            for (const element of parent.elements) {
                _print(element, level + 1);
            }
        }
    }

    for (const layout of editor.layouts) {
        _print(layout, 0);
    }

    console.log(result);
}
window.printTempletStructure = printTempletStructure;
