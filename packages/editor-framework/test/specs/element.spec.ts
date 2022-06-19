import { describe, it, assert, mount, D } from '../runtime';
import { EmptyTemplet, DemoImage } from '../resources/mock-data';

async function initWithDemoImage() {
    const driver = await mount();
    await driver.setTemplet(EmptyTemplet);
    await driver.addElement(DemoImage);
    return driver;
}

describe('元素选中', () => {
    it('可选中', async () => {
        const driver = await initWithDemoImage();
        await driver.click(D.TopElement);

        assert.equal(driver.currentElement.type, 'image');
    });

    it('可取消选中', async () => {
        const driver = await initWithDemoImage();
        await driver.click(D.TopElement);
        await driver.click(D.Layout, D.TopRight);

        assert.equal(driver.currentElement, null);
    });
});

describe('元素拖拽', () => {
    it('可直接拖拽', async () => {
        const driver = await initWithDemoImage();
        await driver.drag(D.TopElement, D.Center, 200, 200);

        assert.leftTopEqual(driver.currentElement, 200, 200);
    });

    it('可选中后拖拽', async () => {
        const driver = await initWithDemoImage();
        await driver.click(D.TopElement);
        await driver.drag(D.TopElement, D.Center, 200, 200);

        assert.leftTopEqual(driver.currentElement, 200, 200);
    });

    it('可多次拖拽', async () => {
        const driver = await initWithDemoImage();
        await driver.drag(D.TopElement, D.Center, 100, 100);
        await driver.drag(D.TopElement, D.Center, 100, 100);

        assert.leftTopEqual(driver.currentElement, 200, 200);
    });
});

describe('元素缩放', () => {
    it('可缩放右下角控制点', async () => {
        const driver = await initWithDemoImage();
        await driver.click(D.TopElement);
        await driver.drag(D.TopElement, D.BottomRight, 200, 200);

        assert.sizeEqual(driver.currentElement, 600, 600);
    });

    it('可缩放下方控制点', async () => {
        const driver = await initWithDemoImage();
        await driver.click(D.TopElement);
        await driver.drag(D.TopElement, D.Bottom, 0, 200);

        assert.sizeEqual(driver.currentElement, 400, 600);
    });

    it('可缩放左下角控制点', async () => {
        const driver = await initWithDemoImage();
        await driver.click(D.TopElement);
        await driver.drag(D.TopElement, D.BottomLeft, 200, -200);

        assert.sizeEqual(driver.currentElement, 200, 200);
    });
});

describe('元素旋转', () => {
    it('可顺时针旋转', async () => {
        const driver = await initWithDemoImage();
        await driver.click(D.TopElement);
        await driver.rotate(D.TopElement, 45);

        assert.almostEqual(driver.currentElement.rotate, 45);
    });

    it('可逆时针旋转', async () => {
        const driver = await initWithDemoImage();
        await driver.click(D.TopElement);
        await driver.rotate(D.TopElement, -30);

        assert.almostEqual(driver.currentElement.rotate, 330);
    });
});
