export function loadImage(url) {
    const image = new Image();
    return new Promise((resolve, reject) => {
        image.onload = function() {
            resolve(image);
        };

        image.onerror = function(error) {
            reject(error);
        };

        image.src = url;
    });
};
