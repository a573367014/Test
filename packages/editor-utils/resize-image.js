/**
 * utils/resize-image
 */

import Promise from 'bluebird';
import Pica from 'pica';
console.log(Pica);

const resizeImage = (src, dist, options = {}) => {
    const throwError = !!options.throwError;
    const timeout = +options.timeout || 5000;

    return (
        Promise.try(() => {
            if (!resizeImage.resizer) {
                resizeImage.resizer = new Pica({
                    // js, WebAssembly, WebWorker
                    features: ['js', 'ww', 'cib'],
                });
            }

            return resizeImage.resizer;
        })
            // 360 等浏览器下可能失败，增加超时检测
            .then((resizer) => {
                return resizer.resize(src, dist, options);
            })
            .timeout(timeout, 'Image resize timeout by pica')
            .catch((err) => {
                if (throwError) {
                    throw err;
                }

                return src;
            })
    );
};

export default resizeImage;
