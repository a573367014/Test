import { ITextElementModel, ILayoutModel, ElementModel } from '../../src/types/editor';
import { describe, it, assert, mountCollab, D } from '../runtime';
import {
    CollabTemplet,
    EmptyTemplet,
    EmptyCollabTemplet,
    MultiLayoutTestTemplet1,
    MultiLayoutTestTemplet2,
    GroupTestLayout,
    DemoGroup,
    DemoImage,
    DemoText,
    DemoMask,
    DemoImageUrl,
    DemoMaskUrl,
    DemoFlex,
    DemoNestedGroup,
} from '../resources/mock-data';
import {
    E0,
    E1,
    E2,
    E3,
    E4,
    E5,
    E6,
    E7,
    assertEqualUID,
    assertLayout,
    assertPathProp,
    assertValidTemplet,
    elementAt,
    waitRemoteUpdate,
    initWithGroup,
    initWithNestedGroup,
    selectAll,
} from './collab-utils';
import { cloneDeep } from 'lodash';
import { reorderElements, validateElements } from '../../src/base/y-model/sync-utils';

describe('基础操作', () => {
    it('空模板状态', async () => {
        const { editorA, editorB } = await mountCollab();

        await editorA.setTemplet(EmptyCollabTemplet);
        await waitRemoteUpdate(editorB);

        assertLayout(editorB, []);
        assertValidTemplet(editorA);
        assertEqualUID(editorA, editorB);
    });

    it('默认状态', async () => {
        const { editorA, editorB } = await mountCollab();

        await editorA.setTemplet(CollabTemplet);
        await waitRemoteUpdate(editorB);

        assertLayout(editorB, [E0, E1, E2, E3]);
        assertValidTemplet(editorA);
        assertEqualUID(editorA, editorB);
    });

    it('可拖拽', async () => {
        const { driver, editorA, editorB } = await mountCollab();

        await editorA.setTemplet(CollabTemplet);
        await waitRemoteUpdate(editorB);
        await driver.drag(D.TopElement, D.Center, -100, -100);

        assert.leftTopEqual(elementAt(editorB, 3), 250, 200);
    });

    it('可撤销', async () => {
        const { driver, editorA, editorB } = await mountCollab();

        await editorA.setTemplet(CollabTemplet);
        await waitRemoteUpdate(editorB);
        await driver.drag(D.TopElement, D.Center, -100, -100);
        editorA.undo();
        await driver.wait();

        assert.leftTopEqual(elementAt(editorB, 3), 350, 300);
    });

    it('可添加元素', async () => {
        const { driver, editorA, editorB } = await mountCollab();

        await editorA.setTemplet(CollabTemplet);
        await waitRemoteUpdate(editorB);

        await driver.addElement(DemoImage);
        assert.equal(elementAt(editorB, 4).type, 'image');
        assertValidTemplet(editorA);
        assertEqualUID(editorA, editorB);
    });

    it('可删除元素', async () => {
        const { driver, editorA, editorB } = await mountCollab();

        await editorA.setTemplet(CollabTemplet);
        await waitRemoteUpdate(editorB);

        await driver.click(D.BottomElement);
        editorA.removeElement(editorA.currentElement);
        await driver.wait();

        assertLayout(editorB, [E1, E2, E3]);
        assertValidTemplet(editorA);
        assertEqualUID(editorA, editorB);
    });

    it('可删除后撤销', async () => {
        const { driver, editorA, editorB } = await mountCollab();

        await editorA.setTemplet(CollabTemplet);
        await waitRemoteUpdate(editorB);

        await driver.click(D.BottomElement);
        editorA.removeElement(editorA.currentElement);
        await driver.wait();

        editorA.undo();
        await driver.wait();

        assertValidTemplet(editorB);
        assertLayout(editorA, [E0, E1, E2, E3], '撤销后状态');
    });

    it('可多选删除元素', async () => {
        const { driver, editorA, editorB } = await mountCollab();

        await editorA.setTemplet(CollabTemplet);
        await waitRemoteUpdate(editorB);

        await driver.click(D.BottomElement);
        // 注意不可直接传原始 layout.elements 引用
        editorA.removeElement([...editorA.currentLayout.elements]);
        await driver.wait();

        assertLayout(editorB, []);
        assertValidTemplet(editorA);
        assertEqualUID(editorA, editorB);
    });

    it('可多选拖动元素', async () => {
        const { driver, editorA, editorB } = await mountCollab();

        await editorA.setTemplet(CollabTemplet);
        await waitRemoteUpdate(editorB);

        await driver.dragCoords([
            { x: 0, y: 0 },
            { x: 200, y: 200 },
        ]);
        await driver.dragCoords([
            { x: 100, y: 100 },
            { x: 200, y: 100 },
        ]);
        await driver.wait();

        assert.almostEqual(elementAt(editorB, 0).left, 150);
        assert.almostEqual(elementAt(editorB, 1).left, 250);
    });

    it('可多选缩放元素', async () => {
        const { driver, editorA, editorB } = await mountCollab();

        await editorA.setTemplet(CollabTemplet);
        await waitRemoteUpdate(editorB);

        await driver.dragCoords([
            { x: 0, y: 0 },
            { x: 200, y: 200 },
        ]);

        const btnPoint = driver.getCoordBySelector('.editor-grip-nw');
        await driver.dragCoords([btnPoint, { x: 150, y: 100 }]);

        assert.almostEqual(elementAt(editorB, 0).width, 224, 1);
        assert.almostEqual(elementAt(editorB, 1).height, 45, 1);
    });

    it('可多选旋转元素', async () => {
        const { driver, editorA, editorB } = await mountCollab();

        await editorA.setTemplet(CollabTemplet);
        await waitRemoteUpdate(editorB);

        await driver.dragCoords([
            { x: 0, y: 0 },
            { x: 200, y: 200 },
        ]);

        const btnPoint = driver.getCoordBySelector('.editor-rotator');
        await driver.dragCoords([btnPoint, { x: btnPoint.x + 100, y: btnPoint.y - 50 }]);
        await driver.wait(1000);

        assert.almostEqual(elementAt(editorB, 0).rotate, -48, 1);
        assert.almostEqual(elementAt(editorB, 1).rotate, -48, 1);
    });

    it('可切换元素顺序', async () => {
        const { editorA, editorB } = await mountCollab();

        await editorA.setTemplet(CollabTemplet);
        await waitRemoteUpdate(editorB);

        const layout = editorA.layouts[0];
        editorA.goElementIndex(layout.elements[0], 1);
        assertLayout(editorB, [E1, E0, E2, E3], '调整层级后状态');
        assertValidTemplet(editorA);
        assertEqualUID(editorA, editorB);

        editorA.goElementIndex([layout.elements[0], layout.elements[1]], 2);
        assertLayout(editorB, [E2, E3, E1, E0], '批量调整层级后状态');
        assertValidTemplet(editorA);
        assertEqualUID(editorA, editorB);
    });

    it('可更新 global', async () => {
        const { editorA, editorB } = await mountCollab();

        await editorA.setTemplet(CollabTemplet);
        await waitRemoteUpdate(editorB);

        editorA.changeGlobal({ dpi: 100 });
        assert.equal(editorB.global.dpi, 100);
    });

    it('可替换元素', async () => {
        const { driver, editorA, editorB } = await mountCollab();

        await editorA.setTemplet(CollabTemplet);
        await waitRemoteUpdate(editorB);

        editorA.replaceElement(elementAt(editorA, 0), DemoImage);
        await driver.wait();

        assert.equal(elementAt(editorB, 0).type, DemoImage.type);
        assert.almostEqual(elementAt(editorB, 0).width, DemoImage.width);
        assert.almostEqual(elementAt(editorB, 0).height, DemoImage.height);
    });

    it('可交替拖动元素后撤销', async () => {
        const { driver, editorA, editorB } = await mountCollab();
        await editorA.setTemplet(CollabTemplet);
        await waitRemoteUpdate(editorB);

        const props1 = { left: 100 };
        editorA.changeElement(props1, editorA.layouts[0].elements[0]);
        await driver.markOperation('A 拖动一次后');

        const props2 = { left: 150 };
        editorA.changeElement(props2, editorA.layouts[0].elements[0]);
        await driver.markOperation('A 拖动两次后');

        const props3 = { left: 200 };
        editorB.changeElement(props3, editorB.layouts[0].elements[0]);
        await driver.markOperation('B 拖动一次后');

        editorA.undo();
        await driver.markOperation('A 撤销一次后');
        assert.equal(editorA.layouts[0].elements[0].left, 100);
    });

    it('可校验并修正元素索引顺序', async () => {
        const { deepEqual: is } = assert;
        const v = validateElements;
        const r = reorderElements;

        let m = '应传入匹配的数组长度';
        is(v([], [], []), true, m);
        is(v(['a'], [], []), false, m);

        m = '应允许出现相同 index，此时应以 id 为排序基准';
        is(v(['a1', 'a1'], ['1', '2'], []), true, m);
        is(v(['a1', 'a1'], ['2', '1'], []), false, m);

        m = '应优先以 index 而非 id 为准';
        is(v(['a1', 'a2', 'a3', 'a4'], ['1', '2', '3', '4'], []), true, m);
        is(v(['a1', 'a2', 'a3', 'a4'], ['4', '2', '1', '3'], []), true, m);
        is(v(['a1', 'a2', 'a3', 'a4'], ['1', '1', '1', '1'], []), true, m);
        is(v(['a2', 'a1', 'a3', 'a4'], ['1', '2', '3', '4'], []), false, m);

        m = '应允许出现 null';
        // 若 id 为 null，index 应当也为 null
        // 但若 index 为 null，id 不一定为 null，因为新创建的元素可能还没有 index
        is(v(['a1', null, 'a3', 'a4'], ['1', null, '3', '4'], []), true, m);
        is(v(['a1', null, null, 'a4'], ['1', null, null, '4'], []), true, m);
        is(v(['a1', null, null, 'a4'], ['1', '2', '3', '4'], []), true, m);
        is(v(['a1', null, null, 'a4'], ['1', '2', '3', '4'], []), true, m);
        is(v([null, null, null, null], ['1', '2', '3', '4'], []), true, m);
        is(v([null, null, null, null], [null, null, '3', '4'], []), true, m);
        is(v(['a2', null, null, 'a1'], ['1', '2', '3', '4'], []), false, m);
        is(v(['a2', null, null, 'a1'], ['1', null, null, '4'], []), false, m);
        is(v(['a1', null, 'a1'], ['2', null, '1'], []), false, m);

        m = '应允许跳过元素';
        is(v(['xx', 'a2', 'a3', 'a4'], ['1', '2', '3', '4'], []), false, m);
        is(v(['xx', 'a2', 'a3', 'a4'], ['1', '2', '3', '4'], [0]), true, m);
        is(v(['a1', 'xx', 'a3', 'a4'], ['1', null, '3', '4'], []), false, m);
        is(v(['a1', 'xx', 'a3', 'a4'], ['1', null, '3', '4'], [1]), true, m);
        is(v(['a1', 'xx', 'a3', '00'], ['1', null, '3', null], [1]), false, m);
        is(v(['a1', 'xx', 'a3', '00'], ['1', null, '3', null], [1, 3]), true, m);
        is(v(['a1', null, null, null], ['1', null, '3', null], [1, 2, 3]), true, m);
        is(v(['a1', null, null, null], ['1', null, '3', null], []), true, m);
        is(v(['a1', null, null, null], ['1', null, '3', null], [0]), true, m);
        is(v(['a1', null, null, null], ['1', null, '3', null], [0, 1]), true, m);
        is(v(['a1', null, null, null], ['1', null, '3', null], [0, 1, 2, 3]), true, m);

        m = '应允许 falsy 值';
        is(v(['a1', undefined, 'a3', 'a4'], ['1', null, '3', '4'], []), true, m);
        is(v(['a1', undefined, null, 'a4'], ['1', null, null, '4'], []), true, m);
        is(v(['a1', undefined, 'a3', 'a4'], ['1', undefined, '3', '4'], []), true, m);
        is(v(['a1', undefined, null, 'a4'], ['1', null, null, '4'], []), true, m);

        m = '应可校正问题元素顺序';
        is(
            r(['a2', 'a1'], ['1', '2'], []),
            [
                [0, 1],
                [1, 0],
            ],
            m,
        );
        is(
            r(['a1', 'a1'], ['2', '1'], []),
            [
                [0, 1],
                [1, 0],
            ],
            m,
        );
        is(
            r(['a1', null, 'a1'], ['2', null, '1'], []),
            [
                [0, 2],
                [2, 0],
            ],
            m,
        );
        is(
            r(['a1', 'a2', 'a1'], ['2', '1', '0'], []),
            [
                [0, 1, 2],
                [1, 2, 0],
            ],
            m,
        );
        is(
            r(['a1', 'a2', 'a1'], ['2', '1', '0'], [1]),
            [
                [0, 2],
                [2, 0],
            ],
            m,
        );
        is(
            r(['a2', 'a1', 'a3', 'a4'], ['1', '2', '3', '4'], []),
            [
                [0, 1, 2, 3],
                [1, 0, 2, 3],
            ],
            m,
        );
        is(
            r(['a2', null, null, 'a1'], ['1', '2', '3', '4'], []),
            [
                [0, 3],
                [3, 0],
            ],
            m,
        );
        is(
            r(['xx', 'a2', 'a3', 'a4'], ['1', '2', '3', '4'], []),
            [
                [0, 1, 2, 3],
                [3, 0, 1, 2],
            ],
            m,
        );
        is(
            r(['a1', 'xx', 'a3', 'a4'], ['1', null, '3', '4'], []),
            [
                [0, 1, 2, 3],
                [0, 3, 1, 2],
            ],
            m,
        );
        is(
            r(['a1', 'xx', 'a3', '00'], ['1', null, '3', null], []),
            [
                [0, 1, 2, 3],
                [1, 3, 2, 0],
            ],
            m,
        );
        is(
            r(['a1', null, 'a3', '00'], ['1', null, '3', null], [1]),
            [
                [0, 2, 3],
                [2, 3, 0],
            ],
            m,
        );
    });

    it('可实际修复异常索引', async () => {
        const { driver, editorA, editorB } = await mountCollab();
        await editorA.setTemplet(CollabTemplet);
        await waitRemoteUpdate(editorB);

        // 将 E0 移动到最后
        editorA.$binding.getYElement(editorA.layouts[0].elements[0]).set('$index', 'b');
        await selectAll(driver);
        editorA.addGroupByElements();
        await driver.wait();
        assertLayout(editorA, [[E1, E2, E3, E0]]);
        assertValidTemplet(editorA);
        assertEqualUID(editorA, editorB);

        editorA.undo();
        // a1, a2, a3, b
        assertLayout(editorA, [E1, E2, E3, E0]);
        await driver.wait();

        // 设置 E1 与 E3 的 $index 为相同
        // a1, a2, a1, b
        editorA.$binding.getYElement(editorA.layouts[0].elements[0]).set('$index', 'a1');
        editorA.$binding.getYElement(editorA.layouts[0].elements[2]).set('$index', 'a1');

        await selectAll(driver);
        editorA.addGroupByElements();
        await driver.wait();
        assertLayout(editorA, [[E1, E3, E2, E0]]);
        assertValidTemplet(editorA);
        assertEqualUID(editorA, editorB);
    });
});

describe('组合与临时组操作', () => {
    it('可成解组后撤销', async () => {
        const { driver, editorA, editorB } = await mountCollab();

        await initWithGroup(driver, 3);
        assertLayout(editorB, [[E0, E1, E2], E3], '成组后状态');
        assertValidTemplet(editorA);
        assertEqualUID(editorA, editorB);
        editorA.$binding.undoMgr.stopCapturing();

        editorA.flatGroup();
        await driver.wait();
        assertLayout(editorB, [E0, E1, E2, E3], '解组后状态');
        assertValidTemplet(editorA);
        assertEqualUID(editorA, editorB);

        editorA.undo();
        await driver.wait();
        assertLayout(editorB, [[E0, E1, E2], E3], '撤销后状态');
        assertValidTemplet(editorA);
        assertEqualUID(editorA, editorB);
    });

    it('组内元素缩放操作', async () => {
        const { driver, editorA, editorB } = await mountCollab();

        await initWithGroup(driver, 3);
        assertLayout(editorB, [[E0, E1, E2], E3], '成组后状态');

        const btnPoint = driver.getCoordBySelector('.editor-grip-nw');
        await driver.dragCoords([btnPoint, { x: 150, y: 100 }]);

        assert.almostEqual(elementAt(editorB, 0, 1).width, 239, 1);
        assert.almostEqual(elementAt(editorB, 0, 1).height, 48, 1);

        assertValidTemplet(editorA);
        assertEqualUID(editorA, editorB);
    });

    it('可撤销对组的删除', async () => {
        const { driver, editorA, editorB } = await mountCollab();

        await initWithGroup(driver, 3);
        assertLayout(editorB, [[E0, E1, E2], E3], '成组后状态');
        assertValidTemplet(editorA);
        assertEqualUID(editorA, editorB);

        editorA.removeElement(editorA.currentLayout.elements[0]);
        await driver.wait();
        assertLayout(editorB, [E3], '删除后状态');
        assertEqualUID(editorA, editorB);
        assertValidTemplet(editorA);

        editorA.undo();
        await driver.wait();
        assertLayout(editorB, [E0, E1, E2, E3], '撤销后状态');
        assertValidTemplet(editorA);
        assertEqualUID(editorA, editorB);
    });

    it('可成嵌套组', async () => {
        const { driver, editorA, editorB } = await mountCollab();

        await initWithNestedGroup(driver);
        editorA.createTempGroup();
        await driver.wait();

        editorA.cancelTempGroup();
        await driver.wait();

        assertLayout(editorB, [[[E0, E1], E2], E3], '嵌套组状态');
        assertValidTemplet(editorB);
        assertEqualUID(editorA, editorB);
    });

    it('可删除并恢复嵌套组', async () => {
        const { driver, editorA, editorB } = await mountCollab();

        await initWithNestedGroup(driver);
        assertLayout(editorB, [[[E0, E1], E2], E3], '嵌套组状态');

        editorB.removeElement(editorB.currentLayout.elements[0]);
        await driver.wait();
        assertLayout(editorB, [E3], '删除后状态');

        editorB.undo();
        await driver.wait();
        assertLayout(editorB, [[[E0, E1], E2], E3], '撤销后状态');
        assertEqualUID(editorA, editorB);
        assertValidTemplet(editorB);

        await driver.wait(200);
        await driver.clickCoord(100, 50);
        assert.equal(
            (editorA.currentSubElement as ITextElementModel).content,
            'Element 0',
            '恢复后的组可选中',
        );
    });

    it('可成解临时组', async () => {
        const { driver, editorA, editorB } = await mountCollab();

        await initWithGroup(driver, 3);
        assertLayout(editorB, [[E0, E1, E2], E3], '成组后状态');
        assertEqualUID(editorA, editorB);

        editorA.createTempGroup();
        await driver.wait();
        assertLayout(editorB, [E0, E1, E2, E3], '成临时组后状态');
        assertValidTemplet(editorA);
        assertEqualUID(editorA, editorB);

        editorA.cancelTempGroup();
        await driver.wait();
        assertLayout(editorB, [[E0, E1, E2], E3], '解临时组后状态');
        assertValidTemplet(editorB);
        assertEqualUID(editorA, editorB);
    });

    it('可恢复嵌套临时组', async () => {
        const { driver, editorA, editorB } = await mountCollab();

        await initWithNestedGroup(driver);
        assertLayout(editorB, [[[E0, E1], E2], E3], '嵌套组状态');

        editorA.createTempGroup();
        await driver.wait();
        assertLayout(editorB, [E0, E1, E2, E3], '成临时组后状态');
        assertValidTemplet(editorB);
        assertEqualUID(editorA, editorB);

        editorA.cancelTempGroup();
        await driver.wait();
        assertLayout(editorB, [[[E0, E1], E2], E3], '解临时组后状态');
        assertValidTemplet(editorB);
        assertEqualUID(editorA, editorB);
    });

    it('可撤销嵌套临时组', async () => {
        const { driver, editorA, editorB } = await mountCollab();

        // 3 层嵌套以验证需可能需多次 recoverParent 场景
        await initWithNestedGroup(driver, 3);
        assertLayout(editorB, [[[[E0, E1], E2], E3]], '嵌套组状态');

        editorA.createTempGroup();
        await driver.wait();
        assertLayout(editorB, [E0, E1, E2, E3], '成临时组后状态');

        editorA.$binding.undoMgr.stopCapturing();
        const props = { left: 0 };
        editorA.changeElement(props, elementAt(editorA, 2));
        await driver.wait();

        editorA.cancelTempGroup();
        assertLayout(editorA, [[[[E0, E1], E2], E3]], '解除临时组后状态');
        assertEqualUID(editorA, editorB);

        editorA.undo();
        await driver.wait();
        assertLayout(editorA, [E0, E1, E2, E3], '撤销后状态');

        editorA.undo();
        await driver.wait();
        assertLayout(editorA, [E0, E1, E2, E3], '撤销后状态');
        assertEqualUID(editorA, editorB);
    });

    it('可临时解组后连续撤销重做', async () => {
        const { driver, editorA, editorB } = await mountCollab();
        await editorA.setTemplet(EmptyCollabTemplet);
        await waitRemoteUpdate(editorB);

        const DemoText1 = { ...DemoText, content: 'Text1', left: 250 } as ITextElementModel;
        editorA.addElement({ ...DemoImage, width: 200, height: 200 });
        editorA.addElement(DemoText1);
        await driver.markOperation('添加两个元素后');

        await selectAll(driver);
        editorA.addGroupByElements();
        await driver.markOperation('选中两个元素并成组后');

        editorA.createTempGroup();
        await driver.markOperation('建立临时组后');

        const DemoText2 = { ...DemoText, content: 'Text2', left: 250 } as ITextElementModel;
        editorA.removeElement(editorA.layouts[0].elements[1]);
        await driver.markOperation('删除原文本后');
        editorA.addElement(DemoText2);
        await driver.wait();
        await selectAll(driver);
        await driver.markOperation('重新添加文本后');
        editorA.addGroupByElements();
        await driver.markOperation('重新成组后');

        editorA.createTempGroup();
        await driver.markOperation('重新建立临时组后');

        const count = editorA.$binding.undoMgr.undoStack.length;

        for (let i = 0; i < count; i++) {
            editorA.undo();
            await driver.markOperation('撤销');
        }
        for (let i = 0; i < count - 1; i++) {
            editorA.redo();
            await driver.markOperation('重做');
        }
    });

    it('可 A 成组后 B 再次成组，而后由 A 撤销', async () => {
        const { driver, editorA, editorB } = await mountCollab();
        const templetClone = cloneDeep(CollabTemplet);
        templetClone.layouts[0].elements.pop();
        await editorA.setTemplet(templetClone);
        await waitRemoteUpdate(editorB);
        assertLayout(editorB, [E0, E1, E2], 'A 成组前状态');

        await driver.dragCoords([
            { x: 0, y: 0 },
            { x: 200, y: 200 },
        ]);
        editorA.addGroupByElements();
        await driver.wait();
        assertLayout(editorB, [[E0, E1], E2], 'A 成组后状态');

        editorA.$binding.undoMgr.stopCapturing();
        editorB.addGroupByElements(editorB.layouts[0].elements);
        await driver.wait();
        assertLayout(editorB, [[[E0, E1], E2]], 'B 成组后状态');

        editorA.undo();
        // 存在相同 $index 时排序结果与随机 uuid 有关，故没有稳定值，仅需保证双边一致即可
        await driver.markOperation('A 撤销后状态');
        // assertLayout(editorB, [[E2], E0, E1], 'A 撤销后状态'); // 该断言不可用

        editorA.redo();
        await driver.wait();
        assertLayout(editorB, [[[E0, E1], E2]], 'A 重做后状态');
    });

    it('可交替成组并撤销', async () => {
        const { driver, editorA, editorB } = await mountCollab();
        await editorA.setTemplet(EmptyCollabTemplet);
        await waitRemoteUpdate(editorB);

        editorA.addElement({ ...DemoImage, left: 50, width: 200, height: 200 });
        await driver.markOperation('A 添加图片后');

        const DemoText1 = { ...DemoText, content: 'Text1', left: 150 } as ITextElementModel;
        editorB.addElement(DemoText1);
        await driver.markOperation('B 添加文字后');

        await selectAll(driver);
        editorA.addGroupByElements();
        await driver.markOperation('A 成组后');

        const DemoText2 = {
            ...DemoText,
            content: 'Text2',
            left: 250,
            top: 200,
        } as ITextElementModel;
        editorB.addElement(DemoText2);
        await driver.markOperation('B 添加新文本后');

        editorA.$binding.undoMgr.stopCapturing();
        editorB.addGroupByElements(editorB.layouts[0].elements);
        await driver.markOperation('B 再次成组后');

        editorA.undo();
        // 对比验证 Yjs 与 VPE 的 model 层级
        await driver.markOperation('A 撤销一次后');

        editorA.undo();
        await driver.markOperation('A 撤销两次后');

        editorA.redo();
        editorA.redo();
        await driver.markOperation('连续撤销重做后');
    });

    it('可在 A 成临时组后，由 B 删除元素', async () => {
        const { driver, editorA, editorB } = await mountCollab();

        await initWithGroup(driver, 3);
        assertLayout(editorB, [[E0, E1, E2], E3], '成组后状态');

        editorA.createTempGroup();
        await driver.wait();
        assertLayout(editorB, [E0, E1, E2, E3], '成临时组后状态');

        // 在 A 上成临时组后，在 B 删除元素
        editorB.removeElement(elementAt(editorB, 2));
        await driver.wait();
        assertLayout(editorA, [E0, E1, E3], '删除元素后状态');
        assertValidTemplet(editorB);
        assertEqualUID(editorA, editorB);

        editorA.cancelTempGroup();
        await driver.wait();
        assertLayout(editorB, [[E0, E1], E3], '取消临时组后状态');
        assertValidTemplet(editorB);
        assertEqualUID(editorA, editorB);
    });

    it('可在 A 成临时组后，由 B 删除单个元素并撤销', async () => {
        const { driver, editorA, editorB } = await mountCollab();

        await initWithGroup(driver, 3);
        editorA.createTempGroup();
        await driver.wait();
        assertLayout(editorB, [E0, E1, E2, E3], '成临时组后状态');

        // 在 A 上成临时组后，在 B 删除元素
        editorB.removeElement(elementAt(editorB, 2));
        await driver.wait();
        assertLayout(editorB, [E0, E1, E3], '删除元素后状态');
        assertValidTemplet(editorB);
        assertEqualUID(editorA, editorB);

        // 再在 B 上撤销
        editorB.undo();
        await driver.wait();
        assertLayout(editorA, [E0, E1, E2, E3], '撤销后状态');
        assertValidTemplet(editorB);
        assertEqualUID(editorA, editorB);

        editorA.cancelTempGroup();
        await driver.wait();
        assertLayout(editorA, [[E0, E1, E2], E3], '取消临时组后状态');
    });

    it('可在 A 成临时组后，由 B 多次删除元素并撤销重做', async () => {
        const { driver, editorA, editorB } = await mountCollab();

        await initWithGroup(driver, 3);
        editorA.createTempGroup();
        await driver.wait();
        assertLayout(editorB, [E0, E1, E2, E3], '成临时组后状态');

        // 在 A 上成临时组后，在 B 删除元素
        editorB.removeElement(elementAt(editorB, 2));
        assertLayout(editorA, [E0, E1, E3], '首次删除元素后状态');

        await driver.wait();
        editorB.removeElement(elementAt(editorB, 2));
        await driver.wait();
        assertLayout(editorA, [E0, E1], '再次删除元素后状态');
        assertValidTemplet(editorB);
        assertEqualUID(editorA, editorB);

        // 再在 B 上撤销
        editorB.undo();
        await driver.wait();
        assertLayout(editorA, [E0, E1, E2, E3], '撤销后状态');
        assertValidTemplet(editorB);
        assertEqualUID(editorA, editorB);

        // 再在 B 上重做
        editorB.redo();
        await driver.wait();
        assertLayout(editorA, [E0, E1], '重做后状态');
        assertValidTemplet(editorB);
        assertEqualUID(editorA, editorB);

        editorA.cancelTempGroup();
        await driver.wait();
        assertLayout(editorA, [[E0, E1]], '取消临时组后状态');
    });

    it('可在 A 建组后 B 删除组，然后 AB 各撤销一次', async () => {
        const { driver, editorA, editorB } = await mountCollab();

        await initWithGroup(driver, 3);
        await driver.wait();
        assertLayout(editorB, [[E0, E1, E2], E3], '成组后状态');

        editorB.removeElement(editorB.currentLayout.elements[0]);
        await driver.wait();
        assertLayout(editorA, [E3], '删除后状态');
        assertValidTemplet(editorB);

        editorA.undo();
        await driver.wait();
        assertLayout(editorB, [E3], 'A 撤销后状态');
        // assertValidTemplet(editorB); // FIXME

        editorB.undo();
        await driver.wait();
        assertLayout(editorA, [[E0, E1, E2], E3], 'B 撤销后状态');
        assertEqualUID(editorA, editorB);
        // assertValidTemplet(editorB); // FIXME
    });

    it('可在 A 建组后，B 成临时组并拖动，再由 A 撤销', async () => {
        const { driver, editorA, editorB } = await mountCollab();

        await initWithGroup(driver, 3);

        editorB.currentElement = editorB.currentLayout.elements[1];
        editorB.createTempGroup();

        await driver.wait();
        editorB.changeElement({ left: 100 }, editorB.currentSubElement);
        editorA.undo();

        assertLayout(editorA, [E0, E1, E2, E3], 'A 撤销后状态');
        assertValidTemplet(editorB);
        assertEqualUID(editorA, editorB);
    });

    it('可在 A 成组，再由 B 生成嵌套组，再由 A 撤销', async () => {
        const { driver, editorA, editorB } = await mountCollab();

        await editorA.setTemplet(EmptyCollabTemplet);
        await waitRemoteUpdate(editorB);

        editorA.addElement({ ...DemoImage, left: 0, top: 0, width: 200, height: 200 });
        editorA.addElement({ ...DemoImage, left: 200, top: 0, width: 200, height: 200 });
        editorA.addGroupByElements(editorA.currentLayout.elements);
        await driver.wait();

        editorB.addElement({ ...DemoText, left: 150, top: 350 });
        await driver.wait();

        editorA.addGroupByElements(editorA.currentLayout.elements);
        await driver.wait();

        editorA.undo();
        await driver.wait();

        assertValidTemplet(editorA);
        assertValidTemplet(editorB);
        assertEqualUID(editorA, editorB);
    });

    it('可在 A 添加组，由 B 临时机组，再由 A 撤销重做， 由 B 关闭临时组，A 再次撤销重做', async () => {
        const { driver, editorA, editorB } = await mountCollab();

        await editorA.setTemplet(EmptyTemplet);
        await waitRemoteUpdate(editorB);

        // 添加组
        const { left, top } = DemoGroup;
        editorA.addElement(DemoGroup);
        await driver.wait();

        editorB.createTempGroup(editorB.currentLayout.elements[0]);
        await driver.wait();

        // editorA.undo();
        // editorA.redo();

        editorA.undo();
        await driver.wait();
        editorA.redo();
        await driver.wait();

        editorB.$refs.tempGroup.syncRect(editorB.currentLayout.elements[0]);
        editorB.cancelTempGroup();
        await driver.wait(100);

        editorA.undo();
        await driver.wait(100);

        editorA.redo();

        assert.equal(elementAt(editorA, 0).dragable, true);
        assert.almostEqual(elementAt(editorA, 0).left, left, 1);
        assert.almostEqual(elementAt(editorA, 0).top, top, 1);

        assertValidTemplet(editorA);
        assertEqualUID(editorA, editorB);
    });

    it('可临时解组后 A 与 B 各自撤销，无 uuid 重复与定位异常', async () => {
        const { driver, editorA, editorB } = await mountCollab();

        await editorA.setTemplet(EmptyTemplet);
        await waitRemoteUpdate(editorB);

        // 添加组
        DemoGroup.uuid = 'test-group';

        const elem = editorA.addElement(DemoNestedGroup);
        await driver.wait();

        editorA.createTempGroup(elem);
        await driver.wait();

        editorB.removeElement(elementAt(editorB, 0));
        await driver.wait();

        editorA.cancelTempGroup();
        await driver.wait();

        editorB.undo();
        await driver.wait();

        editorA.undo();
        editorA.undo();
        editorA.undo();

        await driver.wait();

        editorA.redo();
        editorA.redo();
        editorA.redo();
        await driver.wait(1000);

        editorA.cancelTempGroup();
        await driver.wait();

        assertValidTemplet(editorA);
        assertValidTemplet(editorB);
        assertEqualUID(editorA, editorB);
    });

    it('可在 A 添加组，由 B 临时解组并取消临时组，再由 A、B 相继撤销', async () => {
        const { driver, editorA, editorB } = await mountCollab();

        await editorA.setTemplet(EmptyTemplet);
        await waitRemoteUpdate(editorB);

        editorA.addElement(DemoNestedGroup);
        await driver.wait();

        editorB.createTempGroup(editorB.currentLayout.elements[0]);
        await driver.wait(500);

        const images = editorB.currentLayout.elements.filter((el) => el.type === 'image');

        await editorB.removeElement(images[0]);
        await driver.wait(500);
        await editorB.removeElement(images[1]);
        await driver.wait(500);
        editorB.cancelTempGroup();
        await driver.wait();

        editorA.createTempGroup(editorA.currentLayout.elements[0]);
        await driver.wait(500);
        editorA.cancelTempGroup();
        await driver.wait(500);

        assertValidTemplet(editorA);
        assertValidTemplet(editorB);
        assertEqualUID(editorA, editorB);
    });

    it('可在 A 添加组，由 B 临时解组并取消临时组，再由 A、B 相继撤销2', async () => {
        const { driver, editorA, editorB } = await mountCollab();

        await editorA.setTemplet(EmptyTemplet);
        await waitRemoteUpdate(editorB);

        editorA.addElement(DemoNestedGroup);
        await driver.wait();

        editorB.createTempGroup(editorB.currentLayout.elements[0]);
        await driver.wait(500);

        const images = editorB.currentLayout.elements.filter((el) => el.type === 'image');

        await editorB.removeElement(images[1]);
        await driver.wait(500);
        await editorB.removeElement(images[0]);
        await driver.wait(500);
        editorB.cancelTempGroup();
        await driver.wait();

        // 回撤 addElement
        editorA.undo();

        await driver.wait();

        // 回撤 临时解组
        editorB.undo();
        // 回撤 remove
        editorB.undo();
        // 回撤 remove
        editorB.undo();
        await driver.wait();

        editorB.cancelTempGroup();

        assertValidTemplet(editorA);
        assertValidTemplet(editorB);
        assertEqualUID(editorA, editorB);
    });

    it('可成解临时组 2', async () => {
        const { driver, editorA, editorB } = await mountCollab();
        const resp = await fetch('/resources/poster-temp-group.json');
        const json = await resp.json();
        await editorA.setTemplet(json);
        await waitRemoteUpdate(editorB);
        await driver.dragCoords([
            { x: 0, y: 500 },
            { x: 800, y: 2000 },
        ]);
        editorA.addGroupByElements();
        await driver.wait();
        assertValidTemplet(editorA);
        assertEqualUID(editorA, editorB);

        editorA.createTempGroup();
        await driver.wait();
        assertValidTemplet(editorA);
        assertEqualUID(editorA, editorB);

        editorA.cancelTempGroup();
        await driver.wait();
        assertValidTemplet(editorA);
        assertEqualUID(editorA, editorB);
    });
});

describe('flex 元素操作', () => {
    it('可添加 flex 元素', async () => {
        const { driver, editorA, editorB } = await mountCollab();

        await editorA.setTemplet(EmptyTemplet);
        await waitRemoteUpdate(editorB);
        editorA.addElement(DemoFlex);
        await driver.wait();

        assertValidTemplet(editorA);
        assertEqualUID(editorA, editorB);
    });
});

describe('layout 操作', () => {
    it('可添加 layout', async () => {
        const { driver, editorA, editorB } = await mountCollab();

        await editorA.setTemplet(EmptyCollabTemplet);
        await waitRemoteUpdate(editorB);

        const { elements } = GroupTestLayout;
        editorA.addLayout({ ...GroupTestLayout, elements: [elements[0]] });
        await driver.wait();

        editorA.toggleLayout(1);
        editorB.toggleLayout(1);
        await driver.wait();

        assertLayout(editorB, [E7]);
        assertValidTemplet(editorA);
        assertEqualUID(editorA, editorB);
    });

    it('可更新 layout', async () => {
        const { driver, editorA, editorB } = await mountCollab();

        await editorA.setTemplet(CollabTemplet);
        await waitRemoteUpdate(editorB);

        editorA.changeLayout({ width: 900 }, editorA.layouts[0]);
        await driver.wait();
        assert.equal(editorB.layouts[0].width, 900);
    });

    it('可分别添加 layout 并删除', async () => {
        const { driver, editorA, editorB } = await mountCollab();
        await editorA.setTemplet(EmptyCollabTemplet);
        await waitRemoteUpdate(editorB);

        const { elements } = GroupTestLayout;
        editorA.addLayout({ ...GroupTestLayout, elements: [elements[0]] }, 0);
        await driver.wait();

        editorB.addLayout({ ...GroupTestLayout, elements: [elements[0]] }, 1);
        await driver.wait();

        editorA.toggleLayout(0);
        editorB.toggleLayout(0);
        await driver.wait();

        assertValidTemplet(editorA);
        assertEqualUID(editorA, editorB);

        editorA.removeLayout(editorA.layouts[0]);
        await driver.wait();

        editorB.removeLayout(editorB.layouts[1]);
        await driver.wait();

        editorA.toggleLayout(0);
        editorB.toggleLayout(0);
        await driver.wait();

        assertValidTemplet(editorA);
        assertEqualUID(editorA, editorB);
    });

    it('可删除 layout 并撤销', async () => {
        const { driver, editorA, editorB } = await mountCollab();

        await editorA.setTemplet(CollabTemplet);
        await waitRemoteUpdate(editorB);
        const layoutId = editorA.layouts[0].uuid;

        const { elements } = GroupTestLayout;
        editorA.addLayout({ ...GroupTestLayout, elements: [elements[0]] });
        await driver.wait();

        editorA.toggleLayout(1);
        editorB.toggleLayout(1);
        await driver.wait();
        assertLayout(editorB, [E7]);
        assertValidTemplet(editorA);
        assertEqualUID(editorA, editorB);

        editorA.removeLayout(editorA.layouts[1]);
        await driver.wait();
        assertValidTemplet(editorA);
        assertEqualUID(editorA, editorB);
        assert.equal(editorA.currentLayout.uuid, layoutId, '删除后 layout uuid 匹配');

        editorA.undo();
        await driver.wait();

        editorA.toggleLayout(1);
        editorB.toggleLayout(1);
        await driver.wait();
        assertLayout(editorB, [E7]);
        assertValidTemplet(editorA);
        assertEqualUID(editorA, editorB);
    });

    it('可替换 layout 并撤销', async () => {
        const { driver, editorA, editorB } = await mountCollab();

        await editorA.setTemplet(CollabTemplet);
        await waitRemoteUpdate(editorB);

        const oldLayoutWidth = editorA.layouts[0].width;
        editorA.replaceLayout(editorA.layouts[0], {
            backgroundColor: 'red',
            width: 333,
            height: 333,
            elements: [DemoText as ElementModel],
        });

        editorA.undo();

        await driver.wait();
        assert.equal(editorB.layouts[0].width, oldLayoutWidth);
    });

    it('可切换 layout 顺序', async () => {
        const { editorA, editorB } = await mountCollab();

        await editorA.setTemplet(CollabTemplet);
        await waitRemoteUpdate(editorB);
        editorA.addLayout(GroupTestLayout);
        const newLayoutB = editorB.layouts[1];

        editorA.switchLayout(0, 1);
        assert.equal(editorB.layouts.indexOf(newLayoutB), 0, '交换后下标正确');

        // 此时下标 0 应为新插入的 layout
        editorB.toggleLayout(0);
        editorA.toggleLayout(0);
        assertLayout(editorA, [E7, [E6, [E4, E5]]]);
        assertValidTemplet(editorB);
        assertEqualUID(editorA, editorB);
    });

    it('可移动 layout 顺序', async () => {
        const { driver, editorA, editorB } = await mountCollab();

        await editorA.setTemplet(CollabTemplet);
        await waitRemoteUpdate(editorB);
        editorA.addLayout(GroupTestLayout);
        const oldLayoutB = editorB.layouts[0];
        const newLayoutB = editorB.layouts[1];
        await driver.wait();

        editorB.shiftLayout(newLayoutB, 0);
        assert.equal(editorB.layouts.indexOf(newLayoutB), 0, '新 layout 可正确移动到 0');
        assert.equal(editorB.layouts.indexOf(oldLayoutB), 1, '旧 layout 可正确移动到 1');
        await driver.wait();

        editorA.toggleLayout(0);
        editorB.toggleLayout(0);
        await driver.wait();

        assertValidTemplet(editorB);
        assertEqualUID(editorA, editorB);
    });

    it('可删除带嵌套组的 layout 并撤销', async () => {
        const { driver, editorA, editorB } = await mountCollab();

        await editorA.setTemplet(CollabTemplet);
        await waitRemoteUpdate(editorB);
        const layoutId = editorA.layouts[0].uuid;

        editorA.addLayout(GroupTestLayout);
        await driver.wait();

        editorA.toggleLayout(1);
        editorB.toggleLayout(1);
        await driver.wait();

        assertLayout(editorB, [E7, [E6, [E4, E5]]]);
        assertValidTemplet(editorA);
        assertEqualUID(editorA, editorB);

        editorA.removeLayout(editorA.layouts[1]);
        await driver.wait();
        assertValidTemplet(editorA);
        assertEqualUID(editorA, editorB);
        assert.equal(editorA.currentLayout.uuid, layoutId, '删除后 layout uuid 匹配');
        editorA.undo();
        await driver.wait();

        editorA.toggleLayout(1);
        editorB.toggleLayout(1);
        await driver.wait();
        assertLayout(editorB, [E7, [E6, [E4, E5]]]);
        assertValidTemplet(editorA);
        assertEqualUID(editorA, editorB);
    });

    it('可在删除 layout 后将其添加到新位置，保持正确顺序', async () => {
        const { driver, editorA, editorB } = await mountCollab();

        await editorA.setTemplet(EmptyTemplet);
        await waitRemoteUpdate(editorB);
        editorA.addLayout({
            width: 800,
            height: 800,
            backgroundColor: 'red',
            elements: [],
        } as ILayoutModel);

        const oldLayout = editorA.layouts[0];
        const redLayout = editorA.layouts[1];
        editorA.removeLayout(redLayout);
        editorA.addLayout(redLayout, 0);
        await driver.wait();

        assert.equal(
            editorA.layouts.findIndex(({ uuid }) => uuid === redLayout.uuid),
            0,
            '红 layout 位置正确',
        );
        assert.equal(
            editorA.layouts.findIndex(({ uuid }) => uuid === oldLayout.uuid),
            1,
            '原 layout 位置正确',
        );

        editorA.undo();
        await driver.wait();

        assert.equal(
            editorA.layouts.findIndex(({ uuid }) => uuid === oldLayout.uuid),
            0,
            '原 layout 位置正确',
        );
        assert.equal(
            editorA.layouts.findIndex(({ uuid }) => uuid === redLayout.uuid),
            1,
            '红 layout 位置正确',
        );

        assertValidTemplet(editorA);
        assertEqualUID(editorA, editorB);
    });

    it('可设置模板后同步增删 layout 并撤销', async () => {
        const { driver, editorA, editorB } = await mountCollab();

        await editorA.setTemplet(MultiLayoutTestTemplet1);
        await waitRemoteUpdate(editorB);
        editorA.removeLayout(editorA.layouts[0]);
        editorA.addLayout(
            {
                width: 800,
                height: 800,
                backgroundColor: 'red',
                elements: [],
            } as ILayoutModel,
            0,
        );

        await driver.wait();
        assertValidTemplet(editorB);
        assertEqualUID(editorA, editorB);

        editorA.undo();
        await driver.wait();
        assertValidTemplet(editorA);
        assertEqualUID(editorA, editorB);
    });

    // it.only('可设置模板后同步增删 layout 并撤销', async () => {
    //     const { driver, editorA, editorB } = await mountCollab();

    //     await editorA.setTemplet(MultiLayoutTestTemplet2)
    //     await waitRemoteUpdate(editorB);

    //     let layout = editorA.layouts[1];
    //     editorA.removeLayout(layout);
    //     editorA.addLayout(layout, 0);

    //     editorA.undo();

    //     assertValidTemplet(editorA);
    //     assertValidTemplet(editorB);
    //     assertEqualUID(editorA, editorB);
    // });
});

describe('元素更新粒度', () => {
    it('可 A 修改位置 B 修改颜色，各自独立撤销', async () => {
        const { driver, editorA, editorB } = await mountCollab();

        await editorA.setTemplet(CollabTemplet);
        await waitRemoteUpdate(editorB);

        await driver.drag(D.TopElement, D.Center, -100, 0);
        const black = 'rgb(0, 0, 0)';
        editorB.changeElement({ color: black }, editorB.currentLayout.elements[3]);
        await driver.wait();

        assertPathProp(editorA, editorB, 'layouts[0].elements[3].color', black);
        assertPathProp(editorA, editorB, 'layouts[0].elements[3].left', 250);

        editorA.undo();
        await driver.wait();
        assertPathProp(editorA, editorB, 'layouts[0].elements[3].left', 350);
    });

    it('可 B 修改文字 A 修改位置，各自独立撤销', async () => {
        const { driver, editorA, editorB } = await mountCollab();

        await editorA.setTemplet(CollabTemplet);
        await waitRemoteUpdate(editorB);

        const props = {
            content: 'Hello',
            contents: [
                {
                    content: 'Hello',
                },
            ],
        };
        editorB.changeElement(props, editorB.layouts[0].elements[3]);

        await driver.wait();
        await driver.drag(D.TopElement, D.Center, -100, 0);
        await driver.wait();

        assertPathProp(editorA, editorB, 'layouts[0].elements[3].content', 'Hello');
        assertPathProp(editorA, editorB, 'layouts[0].elements[3].left', 250);

        editorB.undo();
        await driver.wait();
        assertPathProp(editorA, editorB, 'layouts[0].elements[3].content', 'Element 3');

        editorA.undo();
        await driver.wait();
        assertPathProp(editorA, editorB, 'layouts[0].elements[3].left', 350);
    });

    it('可替换图片元素后撤销', async () => {
        const { driver, editorA, editorB } = await mountCollab();

        const templetCopy = cloneDeep(EmptyTemplet);
        templetCopy.layouts[0].elements.push(DemoImage);
        await editorA.setTemplet(templetCopy);
        await waitRemoteUpdate(editorB);

        // 替换成 mask 元素
        editorA.replaceElement(elementAt(editorA, 0), DemoMask);
        await driver.wait();
        assert.equal(elementAt(editorB, 0).type, DemoMask.type);

        editorA.undo();
        assert.equal(elementAt(editorB, 0).type, DemoImage.type);
        assertValidTemplet(editorA);
        assertEqualUID(editorA, editorB);
    });

    it('可添加图片并替换成图框后撤销', async () => {
        const { driver, editorA, editorB } = await mountCollab();

        await editorA.setTemplet(EmptyTemplet);
        await waitRemoteUpdate(editorB);
        editorA.addElement(DemoImage);
        editorA.$binding.undoMgr.stopCapturing();

        // 替换成 mask 元素
        editorA.replaceElement(elementAt(editorA, 0), DemoMask);
        assert.equal(elementAt(editorB, 0).type, DemoMask.type);

        editorA.undo();
        await driver.wait();

        assert.equal(elementAt(editorB, 0).type, DemoImage.type, '撤销后元素类型匹配');
        assertValidTemplet(editorA);
        assertEqualUID(editorA, editorB);
    });

    it('可在空模板中合并添加与替换元素操作至单次撤销', async () => {
        const { driver, editorA, editorB } = await mountCollab();

        await editorA.setTemplet(EmptyTemplet);
        await waitRemoteUpdate(editorB);
        editorA.addElement(DemoImage);
        await driver.wait();

        // 替换成 mask 元素
        editorA.replaceElement(elementAt(editorA, 0), DemoMask);
        assert.equal(elementAt(editorB, 0).type, DemoMask.type);

        editorA.undo();
        await driver.wait();

        assert.equal(editorB.currentLayout.elements.length, 0, '撤销后应不存在元素');
        assertValidTemplet(editorA);
        assertEqualUID(editorA, editorB);
    });

    it('可本地替换 base64 图片并撤销', async () => {
        const { driver, editorA, editorB } = await mountCollab();

        const templetCopy = cloneDeep(EmptyTemplet);
        editorA.options.resource.upload = async () => DemoImageUrl;
        templetCopy.layouts[0].elements.push(DemoImage);
        await editorA.setTemplet(cloneDeep(templetCopy));
        await waitRemoteUpdate(editorB);

        editorA.replaceElement(elementAt(editorA, 0), DemoMask);
        editorA.$binding.undoMgr.stopCapturing();

        const props = {
            mask: DemoMaskUrl,
        };
        editorA.changeElement(props, elementAt(editorA, 0));

        await driver.wait(1000);
        editorA.undo();
        editorA.undo();

        assert.equal(elementAt(editorA, 0).type, DemoImage.type);
        assertValidTemplet(editorA);
        assertEqualUID(editorA, editorB);
    });

    it('反复更改同元素字段后应能正常撤销重做', async () => {
        const { driver, editorA, editorB } = await mountCollab();

        const templetCopy = cloneDeep(EmptyTemplet);
        editorA.options.resource.upload = async () => DemoImageUrl;
        await editorA.setTemplet(templetCopy);
        await waitRemoteUpdate(editorB);

        // 第一次操作
        const element = editorA.addElement(DemoText);
        await driver.wait();
        editorA.$binding.undoMgr.stopCapturing();

        // 第二次操作
        editorA.changeElement({ left: 100, top: 100 }, element);
        await driver.wait();
        editorA.$binding.undoMgr.stopCapturing();

        // 第三次操作
        editorA.changeElement({ left: 200, top: 200 }, element);
        await driver.wait();
        editorA.$binding.undoMgr.stopCapturing();

        // 第四次操作
        editorA.changeElement({ left: 300, top: 300 }, element);
        await driver.wait();
        editorA.$binding.undoMgr.stopCapturing();

        editorA.undo(); // 200, 200
        editorA.undo(); // 100, 100
        editorA.undo(); // 0, 0
        editorA.undo(); // nil

        editorA.redo(); // 0, 0
        editorA.redo(); // 100, 100
        editorA.redo(); // 200, 200

        // 三次 redo 会在低版本 Yjs 上出现字段丢失问题
        assertPathProp(editorA, editorB, 'layouts[0].elements[0].left', 200);

        // XXX: 第四次 redo 复现的问题 https://github.com/yjs/yjs/issues/355
        editorA.redo();
        assertPathProp(editorA, editorB, 'layouts[0].elements[0].left', 300);
        assertValidTemplet(editorA);
        assertEqualUID(editorA, editorB);
    });
});
