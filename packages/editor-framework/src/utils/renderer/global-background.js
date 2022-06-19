import BackgroundRender from './background';
import { createCanvas } from '@gaoding/editor-utils/canvas';

export default class GlobalBackgroundRender extends BackgroundRender {
    constructor({ editor, layout, canvas }) {
        const currentLayout = layout;
        canvas = canvas || createCanvas(Math.round(layout.width), Math.round(layout.height));

        layout = Object.assign({}, editor.global.layout, {
            width: editor.width,
            height: editor.height,
        });

        super({
            canvas,
            editor,
            layout,
        });

        this.currentLayout = currentLayout;
    }

    _clearCtx(ctx) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    async renderImage(ctx) {
        const image = await this.load();

        const {
            model,
            currentLayout,
            effectImage: { repeat, imageTransform },
        } = this;

        const isNoRepeat = !repeat || repeat === 'none' || repeat === 'no-repeat';

        const anchorPointX = model.width / 2;
        const anchorPointY = model.height / 2;

        ctx.save();

        if (!isNoRepeat) {
            const tempCtx = createCanvas(model.$imageWidth, model.$imageHeight).getContext('2d');
            tempCtx.drawImage(image, 0, 0, model.$imageWidth, model.$imageHeight);
            ctx.fillStyle = ctx.createPattern(tempCtx.canvas, repeat);
        }

        ctx.translate(0, -currentLayout.top);
        ctx.translate(anchorPointX, anchorPointY);
        ctx.scale(imageTransform.scale.x < 0 ? -1 : 1, imageTransform.scale.y < 0 ? -1 : 1);
        ctx.rotate(imageTransform.rotation);
        ctx.translate(-anchorPointX, -anchorPointY);

        if (isNoRepeat) {
            ctx.drawImage(
                image,
                model.$imageLeft,
                model.$imageTop,
                model.$imageWidth,
                model.$imageHeight,
            );
        } else {
            ctx.fillRect(
                0,
                0,
                Math.max(model.width, model.$imageWidth),
                Math.max(model.height, model.$imageHeight),
            );
        }

        ctx.restore();

        return ctx.canvas;
    }
}
