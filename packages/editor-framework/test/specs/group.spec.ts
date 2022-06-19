import { describe, it, assert, mount, D } from '../runtime';
import { GroupTestTemplet } from '../resources/mock-data';

async function initWithSelectedElements() {
    const driver = await mount();
    await driver.setTemplet(GroupTestTemplet);

    // 从首个元素的左上角，拖拽到最后一个元素的右下角
    await driver.dragCoords([
        driver.coord(D.FirstElement, D.TopLeft, -10, -10),
        driver.coord(D.LastElement, D.BottomRight, 10, 10),
    ]);

    return driver;
}

describe('成组', () => {
    it('可拖选', async () => {
        const driver = await initWithSelectedElements();
        assert.equal(driver.currentElement.type, '$selector');
    });

    it('可成组', async () => {
        const driver = await initWithSelectedElements();
        await driver.addGroupByElements();

        assert.equal(driver.currentElement.type, 'group');
    });

    it.skip('可成组后拖拽', async () => {
        const driver = await initWithSelectedElements();
    });

    it.skip('可成组后缩放', async () => {
        const driver = await initWithSelectedElements();
    });

    it.skip('可取消组合', async () => {
        const driver = await initWithSelectedElements();
    });
});
