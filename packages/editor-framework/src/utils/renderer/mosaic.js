import Promise from 'bluebird';
import CanvasFilters from 'canvas-filters';
import tinycolor from 'tinycolor2';
import { createCanvas, resizeImageByCanvas } from '@gaoding/editor-utils/canvas';
import BackgroundRender from './background';
import Pixelate from './utils/pixelate';
import utils from '../utils';
import { random } from 'lodash';
import { BaseRender } from './base';

class RenderBrush extends BaseRender {
    constructor(options) {
        super(options);
        this.tileCanvas2 = createCanvas();
        this.tileCanvas = createCanvas();
    }

    setTileCanvas(image) {
        this.tileCanvas.width = image.width;
        this.tileCanvas.height = image.height;

        this.tileCanvas2.width = image.width;
        this.tileCanvas2.height = image.height;
    }

    async renderBrush(ctx) {
        const canvas = ctx.canvas;
        const [tileImage, image] = await Promise.all([this.load(), this.loadBackgroundImage()]);

        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        this.setTileCanvas(tileImage);

        const tileCtx = this.tileCanvas.getContext('2d');
        tileCtx.drawImage(tileImage, 0, 0);

        const { width, height, data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const wNum = Math.ceil(width / this.tileWidth);
        const hNum = Math.ceil(height / this.tileHeight);

        for (let y = 0; y < hNum; y++) {
            for (let x = 0; x < wNum; x++) {
                const tileCanvas = this.getTileCanvas(
                    { width, height, data },
                    x * this.tileWidth + random(-10, 10),
                    y * this.tileHeight + random(-10, 10),
                    canvas,
                );

                const xPos =
                    x * this.tileWidth -
                    (tileCanvas.width - this.tileWidth) / 2 -
                    this.tileWidth / 2;
                const yPos =
                    y * this.tileHeight -
                    (tileCanvas.height - this.tileHeight) / 2 -
                    this.tileHeight / 2;

                const xCenter = xPos + tileCanvas.width / 2;
                const yCenter = yPos + tileCanvas.width / 2;

                ctx.save();
                ctx.globalAlpha = random(0.8, 1) * 0.75;
                ctx.translate(xCenter, yCenter);
                ctx.rotate((Math.PI * 180) / random(0, 360));
                ctx.translate(-xCenter, -yCenter);
                ctx.drawImage(tileCanvas, xPos, yPos);
                ctx.restore();

                ctx.save();
                ctx.globalAlpha = random(0.8, 1) * 0.75;
                ctx.translate(xCenter, yCenter);
                ctx.rotate((Math.PI * 180) / random(0, 360));
                ctx.translate(-xCenter, -yCenter);
                ctx.drawImage(tileCanvas, xPos, yPos);
                ctx.restore();
            }
        }
    }

    getTileCanvas(imgData, x, y, { width, height }) {
        const wNum = Math.ceil(width / this.tileWidth);
        const hNum = Math.ceil(height / this.tileHeight);

        y = Math.round(Math.min(Math.max(0, y), hNum * this.tileWidth));
        x = Math.round(Math.min(Math.max(0, x), wNum * this.tileHeight));

        const index = y * width * 4 + x * 4;
        const color = `rgb(${imgData.data[index]}, ${imgData.data[index + 1]}, ${
            imgData.data[index + 2]
        })`;

        const canvas = this.tileCanvas2;
        const ctx = canvas.getContext('2d');

        ctx.save();
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'destination-in';
        ctx.drawImage(this.tileCanvas, 0, 0);
        ctx.restore();

        return canvas;
    }
}
export default class Mosaic extends RenderBrush {
    constructor({ layout, canvas, editor, options, ratio }) {
        super({
            renderProvide: {
                layout,
                background() {
                    return layout.background && JSON.stringify(layout.background);
                },
            },
            renderDiffKeys: [
                'background',
                'layout.mosaic.type',
                'layout.mosaic.url',
                'layout.mosaic.tileWidth',
                'layout.mosaic.tileHeight',
                'layout.mosaic.blur',
                'layout.width',
                'layout.height',
            ],
        });

        this.layout = layout;
        this.canvas = canvas || createCanvas();
        this.editor = editor;
        this.options = options || editor.options;
        this.ratio = ratio;
    }

    get mosaic() {
        return this.layout.mosaic;
    }

    get mosaicUrl() {
        return this.mosaic.url;
    }

    get mosaicType() {
        return this.mosaic.type;
    }

    get zoom() {
        // 图案类型不做缩小优化
        if (this.mosaicType === 0) return 1;
        return this.ratio || Math.min(800 / this.layout.width, 800 / this.layout.height, 1);
    }

    get mosaicBlur() {
        return Math.round(this.mosaic.blur);
    }

    get mosaicColor() {
        return tinycolor(this.mosaic.color).toString('rgb');
    }

    get mosaicPaths() {
        return this.mosaic.paths;
    }

    get backgroundImage() {
        return this.layout.backgroundEffectImage || this.layout.background?.image;
    }

    get tileWidth() {
        return Math.round(this.mosaic.tileWidth * this.zoom);
    }

    get tileHeight() {
        return Math.round(this.mosaic.tileHeight * this.zoom);
    }

    initCanvas() {
        const canvas = this.canvas;
        canvas.width = Math.round(this.layout.width * this.zoom);
        canvas.height = Math.round(this.layout.height * this.zoom);

        if (!this.offCanvas) {
            this.offCanvas = createCanvas();
        }
    }

    initOffCanvas() {
        this.offCanvas.width = Math.round(this.layout.width * this.zoom);
        this.offCanvas.height = Math.round(this.layout.height * this.zoom);
    }

    async load() {
        return utils.loadImage(this.mosaicUrl).then((image) => {
            if (this.mosaicType === 3) {
                const ratio =
                    Math.min(this.tileWidth / image.width, this.tileHeight / image.height) * 1.8;
                return resizeImageByCanvas(
                    image,
                    image.width * ratio,
                    image.height * ratio,
                    {},
                    false,
                );
            }
            return image;
        });
    }

    async loadBackgroundImage() {
        const bgRender = this.backgroundRender;
        if (
            !bgRender ||
            bgRender.canvas.width !== this.layout.width ||
            bgRender.canvas.height !== this.layout.height
        ) {
            this.backgroundRender = new BackgroundRender({
                layout: this.layout,
                editor: this.editor,
            });
        }

        return this.backgroundRender.render();
    }

    async export() {
        const { editor, layout } = this;
        if (!layout.mosaic.enable || !layout.mosaic.paths.length) return;
        if (editor.getComponentById(layout.$id)) {
            const layoutVm = this.editor.getComponentById(layout.$id);
            const image =
                layoutVm.$refs.backgroundMosaic && layoutVm.$refs.backgroundMosaic.$refs.image;
            const canvas =
                layoutVm.$refs.backgroundMosaic && layoutVm.$refs.backgroundMosaic.$refs.canvas;
            const result =
                image && window.getComputedStyle(image).display !== 'none' ? image : canvas;

            if (result && window.getComputedStyle(result).display !== 'none') {
                await Promise.delay(10);
                this._promise && (await this._promise);

                return result;
            }
        }

        await this.render();
        return this.canvas;
    }

    render(options = { force: false }) {
        const editor = this.editor;
        this._promise = Promise.try(async () => {
            this.initCanvas();
            editor.$events.$emit('mosaicRenderer.renderBefore', this.layout);

            const { canvas } = this;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.globalAlpha = 1;
            const offCanvas = await this.renderUnderlying(options.force);
            ctx.save();

            this.mosaicPaths.forEach((el) => {
                ctx.save();
                this.renderPath(ctx, el);
                ctx.restore();
            });

            ctx.globalCompositeOperation = 'source-in';

            ctx.drawImage(offCanvas, 0, 0);
            ctx.restore();
            return canvas;
        });

        return this._promise.finally(() => {
            editor.$events.$emit('mosaicRenderer.renderAfter', this.layout);
        });
    }

    async renderUnderlying(forcibly) {
        const { offCanvas, mosaicType } = this;

        if (forcibly || this.isNeedRender()) {
            this.setPreData();
            this._renderUnderlyingPromise = Promise.try(async () => {
                this.initOffCanvas();
                const offCtx = offCanvas.getContext('2d');
                offCtx.clearRect(0, 0, offCanvas.width, offCanvas.height);
                if (mosaicType === -1) {
                    this.renderColor(offCtx);
                } else if (mosaicType === 0) {
                    await this.renderImage(offCtx);
                } else if (mosaicType === 1) {
                    await this.renderPixelated(offCtx);
                } else if (mosaicType === 2) {
                    await this.renderGaussianBlur(offCtx);
                } else if (mosaicType === 3) {
                    await this.renderBrush(offCtx);
                }

                return offCtx.canvas;
            });
        }

        return this._renderUnderlyingPromise;
    }

    renderColor(ctx) {
        const canvas = ctx.canvas;
        ctx.fillStyle = tinycolor(this.mosaicColor);
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    renderPath(ctx, pathModel) {
        if (pathModel.hidden) return;
        const isBrush = pathModel.type === 'mosaicBrush';
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.lineWidth = pathModel.strokeWidth || 0;

        const center = {
            x: pathModel.left + pathModel.width / 2,
            y: pathModel.top + pathModel.height / 2,
        };

        ctx.scale(this.zoom, this.zoom);
        ctx.translate(center.x, center.y);
        ctx.rotate(utils.degToRad(pathModel.rotate));
        ctx.scale(pathModel.transform.scale.x, pathModel.transform.scale.y);
        ctx.translate(-center.x, -center.y);
        ctx.translate(pathModel.left, pathModel.top);

        const path = new Path2D(pathModel.path);
        isBrush ? ctx.stroke(path) : ctx.fill(path);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    async renderImage(ctx) {
        let img = await this.load();

        if (this.tileWidth && this.tileHeight) {
            img = await resizeImageByCanvas(img, this.tileWidth, this.tileHeight, {}, false);
        }

        const pattern = ctx.createPattern(img, 'repeat');
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    async renderPixelated(offCtx) {
        const image = await this.loadBackgroundImage();
        offCtx.drawImage(image, 0, 0, offCtx.canvas.width, offCtx.canvas.height);

        return new Pixelate({
            ctx: offCtx,
            tileHeight: this.tileHeight,
            tileWidth: this.tileWidth,
        }).render();
    }

    async renderGaussianBlur(ctx) {
        const canvas = ctx.canvas;
        const image = await this.loadBackgroundImage();

        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const filterdImgData = CanvasFilters.StackBlur(imgData, this.mosaicBlur);
        ctx.putImageData(filterdImgData, 0, 0);
    }
}
