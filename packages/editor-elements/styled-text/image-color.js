function createImageData(ctx, width, height) {
    if (ctx.createImageData) {
        return ctx.createImageData(width, height);
    } else {
        return ctx.getImageData(0, 0, width, height);
    }
}

const changeColorWorkerStr = `
function changeColor({
    inData,
    outData,
    width,
    height,
    color,
    progress,
}) {
    const n = width * height * 4;
    let prog = 0;
    let lastProg = 0;

    for(let i = 0; i < n; i += 4) {
        const { r, g, b } = color;

        outData.data[i] = r;
        outData.data[i + 1] = g;
        outData.data[i + 2] = b;
        outData.data[i + 3] = inData.data[i + 3];

        if(progress) {
            prog = (i / n * 100 >> 0) / 100;
            if(prog > lastProg) {
                lastProg = progress(prog);
            }
        }
    }

    return outData;
}
self.onmessage = function(e) {
    self.postMessage(changeColor(e.data));
};
`;

const changeColorWorkerBlob = new Blob([changeColorWorkerStr], { type: 'text/javascript' });
const changeColorWorker = new Worker(window.URL.createObjectURL(changeColorWorkerBlob));

function changeImgColor(url, color) {
    return new Promise((resolve, reject) => {
        const img = document.createElement('img');
        img.crossOrigin = 'anonymous';
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        img.onload = () => {
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            ctx.drawImage(img, 0, 0);
            changeCanvasColor(canvas, color).then(() => {
                resolve(canvas.toDataURL());
            });
        };

        img.onerror = reject;

        img.src = url;
    });
}

function changeCanvasColor(canvas, color) {
    const { width, height } = canvas;
    const ctx = canvas.getContext('2d');
    const inData = ctx.getImageData(0, 0, width, height);
    const outData = createImageData(ctx, width, height);
    // changeHSL({
    // inData: inData.data,
    // outData: outData.data,
    // width,
    // height,
    // options: {
    // hue: -0.04950532724505324,
    // saturation: 0.030000000000000027,
    // lightness: -0.2737254901960785
    // }
    // });
    return new Promise((resolve) => {
        changeColorWorker.onmessage = function (e) {
            ctx.putImageData(e.data, 0, 0);
            resolve(e.data);
        };
        changeColorWorker.postMessage({
            inData,
            outData,
            width,
            height,
            color,
        });
    });
}

export { changeImgColor, changeCanvasColor };
