import type { ITextElementModel } from '../../src/types/editor';
import { describe, it, assert, mount, D } from '../runtime';
import { EmptyTemplet, DemoText } from '../resources/mock-data';

async function initWithDemoText() {
    const driver = await mount();
    await driver.setTemplet(EmptyTemplet);
    await driver.addElement(DemoText);
    return driver;
}

describe('文本选中与拖拽', () => {
    it('可选中', async () => {
        const driver = await initWithDemoText();
        await driver.click(D.TopElement);

        assert.equal(driver.currentElement.type, 'text');
    });

    it('可选中后拖拽', async () => {
        const driver = await initWithDemoText();
        await driver.drag(D.TopElement, D.Center, 200, 200);

        assert.leftTopEqual(driver.currentElement, 200, 200);
    });
});

describe('文本编辑', () => {
    it('可选中后双击进入编辑', async () => {
        const driver = await initWithDemoText();
        await driver.click(D.TopElement);
        await driver.doubleClick(D.TopElement);

        assert.equal(driver.currentElement.type, 'text');
    });

    it('可输入文本', async () => {
        const driver = await initWithDemoText();
        await driver.click(D.TopElement);
        await driver.doubleClick(D.TopElement);
        await driver.type('hello');

        assert.equal((driver.currentElement as ITextElementModel).content, 'hello');
    });
});
