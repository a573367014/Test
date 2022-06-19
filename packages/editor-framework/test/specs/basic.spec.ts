import { describe, it, assert, mount } from '../runtime';
import { EmptyTemplet } from '../resources/mock-data';

describe('加载编辑器', () => {
    it('无模板默认状态', async () => {
        const { editor } = await mount();
        assert.equal(editor.currentElement, null);
        assert.equal(editor.currentLayout, null);
    });

    it('空模板默认状态', async () => {
        const { editor } = await mount();
        await editor.setTemplet(EmptyTemplet);

        assert.equal(editor.currentElement, null);
        assert.notEqual(editor.currentLayout, null);
        assert.equal(editor.currentLayout.elements.length, 0);
    });
});
