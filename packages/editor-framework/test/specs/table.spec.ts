import { mount } from '../runtime';
import mockTemplet from '../resources/table.json';

async function initCanvas() {
    const { editor } = await mount();
    await editor.setTemplet(mockTemplet);
    editor.focusElement(editor.layouts[0].elements[0]);
    return editor;
}

function getCellSelector(row, col) {
    return `.table-controller table tr:nth-child(${row}) td:nth-child(${col})`;
}

describe('表格元素变换：', async () => {
    let _editor;
    beforeEach(async () => {
        _editor = await initCanvas();
    })

    it('拖拽右侧拉伸按钮，表格元素左上角坐标不变', () => {
        const tableDom = document.querySelector('.table-controller');
        const selector = '.table-controller-transform__grip-e'
        let expected
        cy.get(selector)
            .trigger('mousedown')
            .then(() => {
                expected = tableDom.getBoundingClientRect();
            })
        cy.get('body')
            .trigger('mousemove', { screenX: 500, screenY: 500 })
            .trigger('mouseup')
            .wait(300)
            .then(() => {
                const actual = tableDom.getBoundingClientRect();
                assert.equal(actual.left.toFixed(1), expected.left.toFixed(1), 'left')
                assert.equal(actual.top.toFixed(1), expected.top.toFixed(1), 'top')
                assert.notEqual(actual.width, expected.width, 'width')
            })
    })
});

describe('表格元素框选：', () => {
    let _editor
    beforeEach(async () => {
        _editor = await initCanvas();
    })
    it('单击单元格进入选中可编辑状态', () => {
        const content = 'hello world'
        cy.get(getCellSelector(2, 2))
            .click()
            .clear()
            .type(content)
            .then(() => {
                const actualRange = _editor.currentElement.$currentRange.row + '' + _editor.currentElement.$currentRange.col;
                assert.equal(actualRange, '22', 'currentTableRange')
                assert.equal(_editor.currentElement.tableData.cells[1][1].content, content, '内容同步');
                // assert.equal(rangerRect.top.toFixed(), tdRect.top.toFixed(), '选框top')
                // assert.equal(rangerRect.left.toFixed(), tdRect.left.toFixed(), '选框left')
            })
    })

    it('可选中多个单元格', () => {
        const expected = {
            row: 1,
            col: 1,
            rowspan: 3,
            colspan: 3,
        }
        cy.get(getCellSelector(expected.row, expected.col))
            .trigger('mousedown', { button: 0 })
        cy.get(getCellSelector(expected.row + expected.rowspan - 1, expected.col + expected.colspan - 1))
            .trigger('mousemove')
            .trigger('mouseup')
            .then(() => {
                assert.equal(JSON.stringify(_editor.currentElement.$currentRange), JSON.stringify(expected));
            })
    })

    it('拖拽选框右下角可复制内容', () => {
        cy.get(getCellSelector(1, 1)).click()
        cy.get('.table-controller__ranger__cube')
            .trigger('mousedown', { button: 0 })
        cy.get(getCellSelector(2, 1))
            .trigger('mousemove')
            .trigger('mouseup')
            .then(() => {
                const cells = _editor.currentElement.tableData.cells;
                const actual = cells[0][0].content === cells[1][0].content;
                assert.equal(actual, true, '单行纵向复制');
            })

        cy.get(getCellSelector(1, 1)).click()
        cy.get('.table-controller__ranger__cube')
            .trigger('mousedown', { button: 0 })
        cy.get(getCellSelector(1, 2))
            .trigger('mousemove')
            .trigger('mouseup')
            .then(() => {
                const cells = _editor.currentElement.tableData.cells;
                const actual = cells[0][0].content === cells[0][1].content;
                assert.equal(actual, true, '单列横向复制');
            })

        cy.get(getCellSelector(1, 1)).click()
        cy.get('.table-controller__ranger__cube')
            .trigger('mousedown', { button: 0 })
        cy.get(getCellSelector(3, 3))
            .trigger('mousemove')
            .trigger('mouseup')
            .then(() => {
                const cells = _editor.currentElement.tableData.cells;
                const actual = cells[0][0].content === cells[2][0].content;
                assert.equal(actual, true, '纵向复制优先级高于横向');
            })
    })

    it('多选单元格内容可复制', () => {
        // _editor.currentTableCell
    })
})