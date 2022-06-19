import Promise from 'bluebird';
import getOrientation from './get-orientation';

function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => {
            resolve(img);
        };

        img.onerror = function () {
            const msg = 'Image load error: ' + url;

            reject(new Error(msg));
        };

        img.src = url;
    });
}

export async function correctImageOrientation(file, options = {}) {
    return Promise.try(async () => {
        if (!file || !file.type.includes('image')) return file;
        const { orientation, file: newFile } = await getOrientation(file);
        const type = file.type;

        const invalidOrientations = [3, 6, 8];
        if (!invalidOrientations.includes(orientation)) return file;

        newFile.name = file.name;
        file = newFile;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const url = URL.createObjectURL(file);
        const img = await loadImage(url);

        URL.revokeObjectURL(url);

        let { width, height } = img;
        const { maxSize } = options;

        if (maxSize && maxSize > 0) {
            const size = width * height;
            const ratio = Math.sqrt(Math.min(1, maxSize / size));

            height = Math.round(height * ratio);
            width = Math.round(width * ratio);
        }

        switch (orientation) {
            case 6:
                // 旋转90度
                canvas.width = height;
                canvas.height = width;
                ctx.rotate(Math.PI / 2);
                ctx.drawImage(img, 0, -height, width, height);
                break;
            case 3:
                canvas.width = width;
                canvas.height = height;
                // 旋转180度
                ctx.rotate(Math.PI);
                ctx.drawImage(img, -width, -height, width, height);
                break;
            case 8:
                canvas.width = height;
                canvas.height = width;
                ctx.rotate((3 * Math.PI) / 2);
                ctx.drawImage(img, -width, 0, width, height);
                break;
        }

        return new Promise((resolve) => canvas.toBlob(resolve, type)).then((blob) => {
            if (file.name) {
                blob.name = file.name;
            }

            return blob;
        });
    }).catch(() => file);
}
