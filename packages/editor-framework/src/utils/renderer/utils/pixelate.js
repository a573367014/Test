// let
export default class Pixelate {
    constructor({ ctx, tileWidth, tileHeight }) {
        this.ctx = ctx;
        this.canvas = ctx.canvas;
        this.imageWidth = ctx.canvas.width;
        this.imageHeight = ctx.canvas.height;

        this.tileWidth = Math.round(tileWidth);
        this.tileHeight = Math.round(tileHeight);
    }

    getAverageRGB({ width, data }, sx, sy, tWidth, tHeight) {
        const rgba = [0, 0, 0, 0];
        let total = 0;

        for (let x = sx; x < sx + tWidth; x++) {
            for (let y = sy; y < sy + tHeight; y++) {
                const i = (y * width + x) * 4;

                if (data[i]) {
                    rgba[0] += data[i + 0];
                    rgba[1] += data[i + 1];
                    rgba[2] += data[i + 2];
                    rgba[3] += data[i + 3];
                    total++;
                }
            }
        }

        rgba[0] = Math.floor(rgba[0] / total);
        rgba[1] = Math.floor(rgba[1] / total);
        rgba[2] = Math.floor(rgba[2] / total);
        rgba[3] = 1; // Math.floor(rgba[3] / total) / 255;

        return 'rgba(' + rgba.toString() + ')';
    }

    render() {
        const { ctx, imageWidth, imageHeight, tileWidth, tileHeight } = this;

        const imageData = ctx.getImageData(0, 0, imageWidth, imageHeight);

        for (let x = 0; x < imageWidth; x += tileWidth) {
            for (let y = 0; y < imageHeight; y += tileHeight) {
                const averageRGBA = this.getAverageRGB(imageData, x, y, tileWidth, tileHeight);
                ctx.save();
                ctx.fillStyle = averageRGBA;
                ctx.fillRect(x, y, tileWidth, tileHeight);
                ctx.restore();
            }
        }

        return this.canvas;
    }
}
