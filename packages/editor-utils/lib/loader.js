"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
exports.loadImage = loadImage;

var _bluebird = _interopRequireDefault(require("bluebird"));

var _fontfacePolyfill = _interopRequireDefault(require("./fontface-polyfill"));

var _readFile = _interopRequireDefault(require("./read-file"));

var _lru_map = require("lru_map");

const documentFonts = {};
const caches = {
  image: new _lru_map.LRUMap(30),
  audio: new _lru_map.LRUMap(20),
  video: new _lru_map.LRUMap(20),
  font: new _lru_map.LRUMap(20),
  fontSubset: new _lru_map.LRUMap(20),
  xml: new _lru_map.LRUMap(200),
  xmlStr: new _lru_map.LRUMap(50)
};
const crossOriginParam = 'cross_origin=1';

const isCrossOriginUrl = url => {
  const origin = location.host;
  return url.indexOf('data:') !== 0 && url.indexOf(origin) < 0;
};

const getComputedUrl = (url = '', fitCrossOrigin = false) => {
  if (!url || !fitCrossOrigin) {
    return url;
  }

  if (isCrossOriginUrl(url) && url.indexOf(crossOriginParam) < 0) {
    url += url.indexOf('?') < 0 ? '?' : '&';
    url += crossOriginParam;
  }

  return url;
};

const _loadImage = url => {
  return new _bluebird.default((resolve, reject) => {
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
  return new _bluebird.default((resolve, reject) => {
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

    media.currentTime = time === 0 ? 0.001 : 0;
    media.src = url;
  });
};

const _loadXML = url => {
  return new _bluebird.default((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.overrideMimeType('application/xml');

    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;

      if (xhr.status >= 200 && xhr.status < 300 || xhr.status === 304) {
        resolve(xhr.responseXML, xhr);
      } else {
        reject(new Error(xhr.responseText));
      }
    };

    xhr.send(null);
  });
};

const parseXML = content => {
  return _bluebird.default.try(() => {
    if (DOMParser && DOMParser.prototype.parseFromString) {
      const parser = new DOMParser();
      return parser.parseFromString(content, 'application/xml');
    }

    const blob = new Blob([content], {
      type: 'xml/svg'
    });
    const url = URL.createObjectURL(blob);
    return _loadXML(url).then(xml => {
      URL.revokeObjectURL(url);
      return xml;
    });
  });
};

function loadImage(url, fitCrossOrigin = false, tryLoadVideo = false) {
  const imgCaches = caches.image;
  url = getComputedUrl(url, fitCrossOrigin);

  if (!imgCaches.get(url)) {
    !tryLoadVideo ? imgCaches.set(url, _loadImage(url)) : imgCaches.set(url, _loadImage(url).catch(e => {
      return _loadMedia(url, 0).then(video => {
        video.naturalWidth = video.width = video.videoWidth;
        video.naturalHeight = video.height = video.videoHeight;
        return video;
      }).catch(() => {
        throw e;
      });
    }));
  }

  return imgCaches.get(url);
}

var _default = {
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
      videoCaches.set(key, _loadMedia(url, currentTime, 'video').then(video => {
        video.naturalWidth = video.width = video.videoWidth;
        video.naturalHeight = video.height = video.videoHeight;
        return video;
      }));
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
      xmlCaches.set(url, _loadXML(url).catch(err => {
        err.message = 'Svg load error: ' + err.message;
        throw err;
      }));
    }

    return xmlCaches.get(url);
  },

  loadXMLStr(url) {
    const xmlCaches = caches.xmlStr;

    if (!xmlCaches.get(url)) {
      xmlCaches.set(url, _bluebird.default.try(() => {
        return fetch(url).then(res => res.text());
      }).catch(err => {
        err.message = 'Svg str load error: ' + err.message;
        throw err;
      }));
    }

    return xmlCaches.get(url);
  },

  loadFont(options, timeout = 10000) {
    const fontCaches = caches.font;
    const subsetCaches = caches.fontSubset;
    const {
      name,
      family,
      useLocal
    } = options;

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
        display: options.display || 'auto'
      };

      const registerFont = (urls, hasSubset) => {
        return _bluebird.default.try(() => {
          let font;
          let subsetName, subsetFamily;

          if (hasSubset) {
            subsetName = name + options.subset.suffix;
            subsetFamily = family + options.subset.suffix;
          }

          try {
            font = new _fontfacePolyfill.default(subsetName || name, urls.join(','), fontParams);
          } catch (e) {
            font = new _fontfacePolyfill.default(subsetFamily || family, urls.join(','), fontParams);
          }

          document.fonts.add(font);
          documentFonts[subsetName] = font;
          return font.load();
        }).timeout(timeout, `Font [${family}] load timeout(${timeout}ms)`).catch(err => {
          delete fontCaches[name];
          throw err;
        });
      };

      if (options.subset && options.subset.promise) {
        const promiseFn = () => options.subset.promise.then(url => {
          return registerFont([`local("${name}")`, 'url("' + url + '")'], true);
        }).catch(() => {
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

  readFile: _readFile.default
};
exports.default = _default;