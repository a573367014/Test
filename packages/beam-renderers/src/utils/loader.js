import tinycolor from 'tinycolor2';

export const getTexture = (src) =>
    new Promise((resolve) => {
        if (tinycolor(src).isValid()) {
            src = getCanvas(src);
        }

        if (src instanceof HTMLCanvasElement) {
            return resolve(src);
        }
        if (/^http/.test(src)) {
            loadImage(src).then((image) => {
                resolve(image);
            });
        } else {
            resolve(null);
        }
    });

export const loadImage = (src) =>
    new Promise((resolve) => {
        if (tinycolor(src).isValid()) {
            src = getCanvas(src);
        }

        if (src instanceof HTMLCanvasElement) {
            return resolve(src);
        }

        const image = new Image();
        image.crossOrigin = '';
        image.onload = () => resolve(image);
        image.src = src;
    });

export const loadCubeMaps = (url) =>
    new Promise((resolve) => {
        extractCubeMapsFromImage(url, 9).then(resolve);
    });

const getOffset = (n, maxLevel) => {
    if (n === 0) return 0;
    return Math.pow(2, maxLevel - n + 1) + getOffset(n - 1, maxLevel);
};

const getSpecularXY = (dirIndex, baseOffset, size) => {
    if (dirIndex >= 4) {
        return [baseOffset * 2 + size * (dirIndex - 4), baseOffset + size];
    }
    return [baseOffset * 2 + size * dirIndex, baseOffset];
};

export const buildSpriteCanvas = () => {
    // const dirs = ['right', 'back', 'left', 'front', 'bottom', 'top']
    return loadImage(
        'https://st-gdx.dancf.com/gaodingx/83883312/design/20190529-224419-c445.png',
    ).then((image) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);

        return canvas;
    });
};

const extractToCanvas = (spriteCanvas, x, y, size) => {
    const spriteCtx = spriteCanvas.getContext('2d');
    const imageData = spriteCtx.getImageData(x, y, size, size);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = size;
    canvas.height = size;
    ctx.putImageData(imageData, 0, 0);
    return canvas;
};

export const extractCubeMaps = (canvas, level) => {
    const maxSpecularSize = Math.pow(2, level);
    const diffuseSize = canvas.width - maxSpecularSize * 4;
    const dirCount = 6;
    const cubeMaps = [
        { level: 0, images: [] },
        { level, images: [] },
    ];

    for (let i = 0; i <= level; i++) {
        const baseOffset = getOffset(i, level);
        const size = Math.pow(2, level - i);
        for (let j = 0; j < dirCount; j++) {
            const index = j * (level + 1) + i;
            const [x, y] = getSpecularXY(j, baseOffset, size);
            cubeMaps[1].images[index] = extractToCanvas(canvas, x, y, size);
        }
    }

    const diffuseOffset = maxSpecularSize * 4;
    for (let i = 0; i < dirCount; i++) {
        const [x, y] = [diffuseOffset, i * diffuseSize];
        cubeMaps[0].images[i] = extractToCanvas(canvas, x, y, diffuseSize);
    }

    return cubeMaps;
};

export const loadExtractedCubeMaps = (name, level) => {
    return buildSpriteCanvas(name, level).then((canvas) => {
        // document.body.appendChild(canvas)
        return extractCubeMaps(canvas, level);
    });
};

export const extractCubeMapsFromImage = (url, level) => {
    return loadImage(url)
        .then((image) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = image.width;
            canvas.height = image.height;
            ctx.drawImage(image, 0, 0);

            return canvas;
        })
        .then((canvas) => {
            return extractCubeMaps(canvas, level);
        });
};

export const getCanvas = (color, width = 2, height = 2) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return canvas;
};

// export const getCubeMapsByColor = (color) => {
//     const cubeMaps = [{ level: 0, images: [] }, { level: 9, images: [] }];

//     const canvas = getCanvas(color, 128, 128);
//     for(let i = 0; i < 6; i++) {
//         cubeMaps[0].images.push(canvas);
//     }

//     for(let i = 0; i < 6; i++) {
//         for(let j = 9; j >= 0; j--) {
//             const size = Math.pow(2, j);
//             const canvas = getCanvas(color, size, size);
//             cubeMaps[1].images.push(canvas);
//         }
//     }

//     return cubeMaps;
// };
