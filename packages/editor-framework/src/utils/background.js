import BackgroundRender from './renderer/background';
import GlobalBackgroundRender from './renderer/global-background';
import MosaicRender from './renderer/mosaic';
import renderBackgroundMask from './renderer/background-mask';
import { renderLayoutWatermark } from './renderer/watermark';
import tinycolor from 'tinycolor2';
import get from 'lodash/get';

export async function renderBackground({ layout, ctx, options, editor, element }) {
    if (element) {
        await new BackgroundRender({
            element,
            editor,
            canvas: ctx.canvas,
        }).render();
        return;
    }

    if (!layout.mosaic && !layout.background?.image) return Promise.resolve();

    options = options || editor.options;
    await new BackgroundRender({
        layout,
        editor,
        canvas: ctx.canvas,
    }).render();

    const MosaicCanvas = await new MosaicRender({ layout, editor }).export();
    MosaicCanvas && ctx.drawImage(MosaicCanvas, 0, 0, layout.width, layout.height);

    if (get(options, 'watermarkImages.exportEnable') && get(layout, 'background.watermarkEnable')) {
        renderLayoutWatermark(layout, ctx, options);
    }

    const maskCanvas = renderBackgroundMask({ editor, layout });
    maskCanvas && ctx.drawImage(maskCanvas, 0, 0);
}

export async function renderGlobalBackground({ layout, ctx, editor }) {
    const { backgroundImage = '', backgroundColor = '' } = editor.global.layout || {};

    // 包含全局背景图片或者非透明颜色
    const hasGlobalBackground =
        backgroundImage || (backgroundColor && tinycolor(backgroundColor).getAlpha());
    if (!hasGlobalBackground) {
        return;
    }

    return new GlobalBackgroundRender({
        layout,
        editor,
        canvas: ctx.canvas,
    }).render();
}
