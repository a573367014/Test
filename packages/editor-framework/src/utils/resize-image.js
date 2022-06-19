/**
 * utils/resize-image
 */

import Promise from 'bluebird';

// pica 默认入口使用 ES6 语法，会导致某些打包出来的代码可能无法执行，引入 dist 包
import Pica from '../../third-party/pica';

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
