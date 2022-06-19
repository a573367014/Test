import Promise from 'bluebird';
import loader from '@gaoding/editor-utils/loader';
import { LRUMap } from 'lru_map';
import { loadFontsSubset, getUpdateFontsSubset } from '../../subset';

const fontCaches = new LRUMap(10);

export function loadImage(url) {
    return new Promise(function (resolve, reject) {
        const img = new Image();
        img.onload = function () {
            URL.revokeObjectURL(url);
            resolve(img);
        };
        img.onerror = () => {
            reject(new Error('svg 图片加载失败，存在非法字符'));
        };
        img.src = url;
    });
}

function featchFont(font, url) {
    url = url || font.woff || font.ttf;
    if (!url) return Promise.resolve(font);
    return fetch(url, {
        method: 'get',
        responseType: 'blob',
    })
        .then((res) => {
            return res.blob();
        })
        .then((blob) => {
            if (window.safari && blob.size >= 10 * 1024 * 1024) {
                throw new Error('字体大于10M，safari无法走浏览器缓存');
            }

            return new Promise(function (resolve) {
                const f = new FileReader();
                f.onload = function () {
                    resolve(f.result);
                };
                f.readAsDataURL(blob);
            });
        })
        .then(function (dataURL) {
            return {
                ...font,
                dataURL,
            };
        });
}

export function loadFont(font) {
    if (!fontCaches.get(font.name)) {
        const promise = loader
            .loadFont(font)
            .then(() => {
                return featchFont(font);
            })
            .catch(() => {
                return featchFont(font);
            });

        fontCaches.set(font.name, promise);
    }

    return fontCaches.get(font.name);
}

export function loadFonts(fonts, editor) {
    const exportEnableCallback = editor.options.fontSubset.exportEnableCallback;
    const exportEnable = exportEnableCallback && exportEnableCallback(editor);
    if (exportEnable) {
        loadFontsSubset(editor.layouts, editor.options);
    }

    // 获取需要更新的字体子集
    const needUpdateSubsetsData = getUpdateFontsSubset(editor.layouts, editor.options);

    console.log(
        'exportEnable:' + exportEnable,
        // 'needUpdateSubsetsData', needUpdateSubsetsData
    );

    return Promise.map(fonts, (font) => {
        // 字体子集是否够用
        const subsetValid =
            !needUpdateSubsetsData ||
            (!needUpdateSubsetsData[font.name] && !needUpdateSubsetsData[font.family]);

        if (subsetValid) {
            const fontSubset = editor.options.fontSubsetsMap[font.name];

            return fontSubset
                ? fontSubset.subsetPromise
                      .then((url) => {
                          const subsetName = font.name + editor.options.subsetSuffix;
                          const fontFace =
                              loader._documentFonts && loader._documentFonts[subsetName];

                          if (fontFace && fontFace.status === 'error') {
                              throw new Error('font file parse error');
                          }

                          return featchFont(font, url);
                      })
                      .catch((e) => {
                          console.warn(e);
                          return loadFont(font);
                      })
                : loadFont(font);
        } else {
            return loadFont(font);
        }
    });
}
