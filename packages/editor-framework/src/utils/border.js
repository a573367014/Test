import autoStretchImage from '@gaoding/editor-utils/auto-stretch-image';

const sliceKeys = ['left', 'top', 'right', 'bottom'];

export async function renderBorder(layout, ctx) {
    const { border, width, height } = layout;
    if (border && border.enable) {
        const {
            type,
            imageRepeat,
            imageSlice: slice,
            width: borderWidth,
            direction,
            opacity,
            image,
        } = border;

        if (type === 'image') {
            const borderUrl = image;
            const maxSliceWidth = Math.max.apply(
                this,
                sliceKeys.map((key) => slice[key]),
            );
            const ratio = borderWidth / maxSliceWidth;

            const targetSlice = {
                left: slice.left * ratio,
                top: slice.top * ratio,
                right: slice.right * ratio,
                bottom: slice.bottom * ratio,
            };

            const borderCanvas = await autoStretchImage(borderUrl, {
                targetWidth: width,
                targetHeight: height,
                imageSlice: slice,
                targetImageSlice: targetSlice,
                repeat: imageRepeat,
            });

            ctx.save();
            ctx.globalAlpha = opacity;
            ctx.drawImage(borderCanvas, 0, 0);
            ctx.restore();
            return;
        } else if (type === 'color') {
            ctx.save();
            ctx.globalAlpha = opacity;
            ctx.fillStyle = border.color;
            ctx.stroke();

            if (direction) {
                [
                    () => ctx.fillRect(0, 0, width, borderWidth),
                    () => ctx.fillRect(width - borderWidth, 0, borderWidth, height),
                    () => ctx.fillRect(0, height - borderWidth, width, borderWidth),
                    () => ctx.fillRect(0, 0, borderWidth, height),
                ].forEach((fn, i) => {
                    direction[i] && fn();
                });
            }

            ctx.restore();
            return;
        } else if (type === 'gradient') {
            return Promise.resolve();
        }
    }

    return Promise.resolve();
}
