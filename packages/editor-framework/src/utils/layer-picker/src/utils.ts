import tinycolor from 'tinycolor2';

export const getNewColor = (colorMap = new Map()): string => {
    let [max, count] = [100, 0];
    while (true) {
        const newColor = tinycolor.random().toHexString();
        count++;
        if (!colorMap.get(newColor) && newColor !== '#ffffff') return newColor;
        if (count > max) throw new Error('Could not generate new hit test color.');
    }
};

interface Transform {
    a: number;
    b: number;
    c: number;
    d: number;
    tx: number;
    ty: number;
}

interface Options {
    transform?: Transform;
    x?: number;
    y?: number;
    width: number;
    height: number;
    inputCanvas?: HTMLCanvasElement;
    color?: string;
    effectedResult?: { left: number; top: number };
}

export function transformLayer(ctx: CanvasRenderingContext2D, options: Options) {
    const {
        transform,
        x = 0,
        y = 0,
        width,
        height,
        inputCanvas,
        color,
        effectedResult = { left: 0, top: 0 },
    } = options;
    ctx.save();
    if (transform) {
        const { a = 1, b = 0, c = 0, d = 1, tx = 0, ty = 0 } = transform;
        const [midX, midY] = [x + width / 2, y + height / 2];
        // 图片变换的基准一般是图片的中点，
        ctx.translate(midX, midY);
        ctx.transform(a, b, c, d, tx, ty);
        ctx.translate(-midX, -midY);
    }

    if (inputCanvas) {
        ctx.drawImage(inputCanvas, x + effectedResult.left, y + effectedResult.top);
    } else {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, width, height);
    }
    ctx.restore();
}
