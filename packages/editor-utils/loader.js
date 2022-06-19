/**
 * utils/loader
 */

import Promise from 'bluebird';
import FontFace from './fontface-polyfill';
import readFile from './read-file';
import { LRUMap } from 'lru_map';

const documentFonts = {};

// @TODO: 待优化缓存清理
const caches = {
    image: new LRUMap(30),
    audio: new LRUMap(20),
    video: new LRUMap(20),
    font: new LRUMap(20),
    fontSubset: new LRUMap(20),

    // svg 性能较弱，提示缓存数量缓解
    xml: new LRUMap(200),
    xmlStr: new LRUMap(50),
};

const crossOriginParam = 'cross_origin=1';

const isCrossOriginUrl = (url) => {
    const origin = location.host;

    return url.indexOf('data:') !== 0 && url.indexOf(origin) < 0;
};

const getComputedUrl = (url = '', fitCrossOrigin = false) => {
    if (!url || !fitCrossOrigin) {
        return url;
    }

    // 浏览器默认缓存忽略 origin 头，可能导致跨域问题，此处强制刷新
    if (isCrossOriginUrl(url) && url.indexOf(crossOriginParam) < 0) {
        url += url.indexOf('?') < 0 ? '?' : '&';
        url += crossOriginParam;
    }

    return url;
};

const _loadImage = (url) => {
    return new Promise((resolve, reject) => {
        const img = new Image();

        if (isCrossOriginUrl(url)) {
            img.crossOrigin = 'Anonymous';
        }

        img.onload = () => {
            resolve(img);
        };

        img.onerror = function () {
            const msg = 'Image load error: ' + url;

            reject(new Error(msg));
        };

        img.src = url;
    });
};

const _loadMedia = (url, time = 0, tag = 'video') => {
    return new Promise((resolve, reject) => {
        const media = document.createElement(tag);

        if (isCrossOriginUrl(url)) {
            media.crossOrigin = 'Anonymous';
        }

        media.onloadeddata = () => {
            media.currentTime = time;
        };

        media.ontimeupdate = () => {
            resolve(media);
        };

        media.onerror = function () {
            const msg = 'Video load error: ' + url;

            reject(new Error(msg));
        };

        // 默认 currentTime 是 0, 如果要 seek 的也是 0 的话, 部分浏览器不会触发 ontimeupdate 事件
        media.currentTime = time === 0 ? 0.001 : 0;
        media.src = url;
    });
};

// TODO: 没按 fetch + DomParser 实现，因为目前 parseFromString 方法会有兼容性问题
const _loadXML = (url) => {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.overrideMimeType('application/xml');
        xhr.onreadystatechange = function () {
            if (xhr.readyState !== 4) return;
            if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304) {
                resolve(xhr.responseXML, xhr);
            } else {
                reject(new Error(xhr.responseText));
            }
        };
        xhr.send(null);
    });
};

const parseXML = (content) => {
    return Promise.try(() => {
        if (DOMParser && DOMParser.prototype.parseFromString) {
            const parser = new DOMParser();
            return parser.parseFromString(content, 'application/xml');
        }

        const blob = new Blob([content], { type: 'xml/svg' });
        const url = URL.createObjectURL(blob);

        return _loadXML(url).then((xml) => {
            URL.revokeObjectURL(url);
            return xml;
        });
    });
};

/**
 * 加载图片
 * @returns {Promise<HTMLImageElement>}
 */
export function loadImage(url, fitCrossOrigin = false, tryLoadVideo = false) {
    const imgCaches = caches.image;
    url = getComputedUrl(url, fitCrossOrigin);

    if (!imgCaches.get(url)) {
        !tryLoadVideo
            ? imgCaches.set(url, _loadImage(url))
            : imgCaches.set(
                  url,
                  _loadImage(url).catch((e) => {
                      return _loadMedia(url, 0)
                          .then((video) => {
                              video.naturalWidth = video.width = video.videoWidth;
                              video.naturalHeight = video.height = video.videoHeight;
                              return video;
                          })
                          .catch(() => {
                              throw e;
                          });
                  }),
              );
    }

    return imgCaches.get(url);
}

export default {
    isCrossOriginUrl,
    getComputedUrl,
    parseXML,
    _documentFonts: documentFonts,
    _loadImage,
    _loadVideo: _loadMedia,
    _loadXML,
    loadImage,
    loadVideo(url, currentTime = 0, fitCrossOrigin = false) {
        const videoCaches = caches.video;

        url = getComputedUrl(url, fitCrossOrigin);

        const key = url + currentTime;
        if (!videoCaches.get(key)) {
            videoCaches.set(
                key,
                _loadMedia(url, currentTime, 'video').then((video) => {
                    video.naturalWidth = video.width = video.videoWidth;
                    video.naturalHeight = video.height = video.videoHeight;
                    return video;
                }),
            );
        }

        return videoCaches.get(key);
    },

    loadAudio(url, currentTime = 0, fitCrossOrigin = false) {
        const audioCaches = caches.audio;

        url = getComputedUrl(url, fitCrossOrigin);

        if (!audioCaches.get(url)) {
            audioCaches.set(url, _loadMedia(url, currentTime, 'audio'));
        }

        return audioCaches.get(url);
    },

    loadXML(url) {
        const xmlCaches = caches.xml;

        if (!xmlCaches.get(url)) {
            xmlCaches.set(
                url,
                _loadXML(url).catch((err) => {
                    err.message = 'Svg load error: ' + err.message;
                    throw err;
                }),
            );
        }

        return xmlCaches.get(url);
    },
    loadXMLStr(url) {
        const xmlCaches = caches.xmlStr;

        if (!xmlCaches.get(url)) {
            xmlCaches.set(
                url,
                Promise.try(() => {
                    return fetch(url).then((res) => res.text());
                }).catch((err) => {
                    err.message = 'Svg str load error: ' + err.message;

                    throw err;
                }),
            );
        }

        return xmlCaches.get(url);
    },

    loadFont(options, timeout = 10000) {
        const fontCaches = caches.font;
        const subsetCaches = caches.fontSubset;
        const { name, family, useLocal } = options;

        if (!fontCaches.get(name)) {
            let urls = [];
            if (useLocal) {
                urls = [`local("${name}")`];
                if (family && family !== name) {
                    urls.push(`local("${family}")`);
                }
            }

            if (options.woff || options.url) {
                urls.push(`url("${options.woff || options.url}")`);
            } else if (options.ttf) {
                urls.push(`url("${options.ttf}")`);
            }

            const fontParams = {
                weight: options.weight || 'normal',
                style: options.style || 'normal',
                display: options.display || 'auto',
            };

            const registerFont = (urls, hasSubset) => {
                return (
                    Promise.try(() => {
                        let font;
                        // 防止在某些情况 name 值加载失败
                        // ps: safari (字符带两边空格 | 带 “.” 字符)都会失败

                        let subsetName, subsetFamily;
                        if (hasSubset) {
                            subsetName = name + options.subset.suffix;
                            subsetFamily = family + options.subset.suffix;
                        }

                        try {
                            font = new FontFace(subsetName || name, urls.join(','), fontParams);
                        } catch (e) {
                            font = new FontFace(subsetFamily || family, urls.join(','), fontParams);
                        }

                        document.fonts.add(font);
                        documentFonts[subsetName] = font;
                        return font.load();
                    })
                        // 防止加载时间过长
                        .timeout(timeout, `Font [${family}] load timeout(${timeout}ms)`)
                        .catch((err) => {
                            // Clean
                            delete fontCaches[name];

                            throw err;
                        })
                );
            };

            if (options.subset && options.subset.promise) {
                const promiseFn = () =>
                    options.subset.promise
                        .then((url) => {
                            return registerFont([`local("${name}")`, 'url("' + url + '")'], true);
                        })
                        .catch(() => {
                            fontCaches.set(name, registerFont(urls));
                            return fontCaches.get(name);
                        });

                if (!options.subset.content) return promiseFn();

                const cacheKey = options.subset.content + '-' + name + '-' + options.subset.suffix;
                if (!subsetCaches.get(cacheKey)) {
                    subsetCaches.set(cacheKey, promiseFn());
                }

                return subsetCaches.get(cacheKey);
            } else {
                fontCaches.set(name, registerFont(urls));
            }
        }

        return fontCaches.get(name);
    },

    readFile,
};
