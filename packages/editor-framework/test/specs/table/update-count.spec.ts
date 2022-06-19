function mockCell(count = 1) {
    return new Array(count).fill(0).map(() => ({ content: '' }))
}

function mockCells(rlen, clen) {
    return new Array(rlen).fill(0).map(() => mockCell(clen));
}

function mockRule(order, props) {
    return { coefficient: 0, remainder: order, ...props };
}

function getRuleByOrder(rules, order) {
    return rules.find(r => r.remainder === order);
}

describe('添加行或列', () => {
    it('在表中间添加2行后再添加2列', () => {
        const rows = new Array(3).fill(0).map((_, i) => mockRule(i + 1, { height: 10 * (i + 1) }));
        const cols = new Array(3).fill(0).map((_, i) => mockRule(i + 1, { width: 10 * (i + 1) }));
        const cells = mockCells(3, 3);
        const addIndex = 1;
        const addCount = 2;
        let table = createStrips({ tableData: { rows, cols, cells } }, 'r', addIndex, addCount, { height: 40 });
        table = createStrips({ tableData: table }, 'c', addIndex, addCount, { width: 80 });
        assert.equal(table.cells.length, cells.length + addCount, 'cells行加2');
        assert.equal(table.cells[0].length, cells.length + addCount, 'cells列加2');
        assert.equal(table.rows.length, 5, '增加行规则');
        assert.equal(table.cols.length, 5, '增加列规则');
        assert.equal(getRuleByOrder(table.rows, addIndex + 1).height, 40, '插入行位置规则为新规则')
        assert.equal(getRuleByOrder(table.rows, addIndex + 1 + addCount).height, getRuleByOrder(rows, addIndex + 1).height, '插入行位置之后的规则自动增加')
        assert.equal(getRuleByOrder(table.cols, addIndex + 1).width, 80, '插入列位置规则为新规则')
    })
})