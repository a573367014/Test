import { describe, it, assert, mount, EditorDriver } from '../runtime';
import { DemoImageShadow, DemoText, DemoSvg, DemoImage2 } from '../resources/mock-data';

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function initWithDemoImage(): Promise<EditorDriver> {
    const driver = await mount();
    await driver.setTemplet({
        type: 'poster',
        layouts: [
            {
                height: 800,
                width: 800,
                backgroundColor: '#ffffff',
                elements: [DemoImageShadow, DemoSvg, DemoText, DemoImage2],
            },
        ],
    });

    // 等待模板加载完毕，layer-picker 完成更新
    await sleep(1000);
    return driver;
}

let driver: EditorDriver;
describe('点击检测', () => {
    beforeEach(async () => {
        driver = await initWithDemoImage();
    });

    it('选中文字/空白/svg/image/阴影图片', async () => {
        await driver.clickCoord2({ x: 399, y: 99 });
        assert.equal(driver.currentElement.type, 'text');
        await driver.clickCoord2({ x: 50, y: 518 });
        assert.equal(driver.currentElement, null);
        await driver.clickCoord2({ x: 250, y: 518 });
        assert.equal(driver.currentElement.type, 'svg');
        await driver.clickCoord2({ x: 320, y: 518 });
        assert.equal(driver.currentElement.type, 'image');
        await driver.clickCoord2({ x: 413, y: 518 });
        assert.equal(driver.currentElement.type, 'image');
        assert.equal(!!driver.currentElement.shadows.length, true);
    });
});
