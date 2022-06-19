"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _objectAssign = _interopRequireDefault(require("object-assign"));

var _webworkify = _interopRequireDefault(require("./webworkify"));

var _mathlib = _interopRequireDefault(require("pica/lib/mathlib"));

var _pool = _interopRequireDefault(require("pica/lib/pool"));

var _utils = _interopRequireDefault(require("pica/lib/utils"));

var _worker = _interopRequireDefault(require("pica/lib/worker"));

var _stepper = _interopRequireDefault(require("pica/lib/stepper"));

var _tiler = _interopRequireDefault(require("pica/lib/tiler"));

const singletones = {};
let NEED_SAFARI_FIX = false;

try {
  if (typeof navigator !== 'undefined' && navigator.userAgent) {
    NEED_SAFARI_FIX = navigator.userAgent.indexOf('Safari') >= 0;
  }
} catch (e) {}

let concurrency = 1;

if (typeof navigator !== 'undefined') {
  concurrency = Math.min(navigator.hardwareConcurrency || 1, 4);
}

const DEFAULT_PICA_OPTS = {
  tile: 1024,
  concurrency,
  features: ['js', 'wasm', 'ww'],
  idle: 2000
};
const DEFAULT_RESIZE_OPTS = {
  quality: 3,
  alpha: false,
  unsharpAmount: 0,
  unsharpRadius: 0.0,
  unsharpThreshold: 0
};
let CAN_NEW_IMAGE_DATA;
let CAN_CREATE_IMAGE_BITMAP;

function workerFabric() {
  return {
    value: (0, _webworkify.default)(_worker.default),
    destroy: function () {
      this.value.terminate();

      if (typeof window !== 'undefined') {
        let url = window.URL || window.webkitURL || window.mozURL || window.msURL;

        if (url && url.revokeObjectURL && this.value.objectURL) {
          url.revokeObjectURL(this.value.objectURL);
        }
      }
    }
  };
}

function Pica(options) {
  if (!(this instanceof Pica)) return new Pica(options);
  this.options = (0, _objectAssign.default)({}, DEFAULT_PICA_OPTS, options || {});
  let limiter_key = `lk_${this.options.concurrency}`;
  this.__limit = singletones[limiter_key] || _utils.default.limiter(this.options.concurrency);
  if (!singletones[limiter_key]) singletones[limiter_key] = this.__limit;
  this.features = {
    js: false,
    wasm: false,
    cib: false,
    ww: false
  };
  this.__workersPool = null;
  this.__requested_features = [];
  this.__mathlib = null;
}

Pica.prototype.init = function () {
  if (this.__initPromise) return this.__initPromise;

  if (CAN_NEW_IMAGE_DATA !== false && CAN_NEW_IMAGE_DATA !== true) {
    CAN_NEW_IMAGE_DATA = false;

    if (typeof ImageData !== 'undefined' && typeof Uint8ClampedArray !== 'undefined') {
      try {
        new ImageData(new Uint8ClampedArray(400), 10, 10);
        CAN_NEW_IMAGE_DATA = true;
      } catch (__) {}
    }
  }

  if (CAN_CREATE_IMAGE_BITMAP !== false && CAN_CREATE_IMAGE_BITMAP !== true) {
    CAN_CREATE_IMAGE_BITMAP = false;

    if (typeof ImageBitmap !== 'undefined') {
      if (ImageBitmap.prototype && ImageBitmap.prototype.close) {
        CAN_CREATE_IMAGE_BITMAP = true;
      } else {
        this.debug('ImageBitmap does not support .close(), disabled');
      }
    }
  }

  let features = this.options.features.slice();

  if (features.indexOf('all') >= 0) {
    features = ['cib', 'wasm', 'js', 'ww'];
  }

  this.__requested_features = features;
  this.__mathlib = new _mathlib.default(features);

  if (features.indexOf('ww') >= 0) {
    if (typeof window !== 'undefined' && 'Worker' in window) {
      try {
        let wkr = (0, _webworkify.default)(function () {});
        wkr.terminate();
        this.features.ww = true;
        let wpool_key = `wp_${JSON.stringify(this.options)}`;

        if (singletones[wpool_key]) {
          this.__workersPool = singletones[wpool_key];
        } else {
          this.__workersPool = new _pool.default(workerFabric, this.options.idle);
          singletones[wpool_key] = this.__workersPool;
        }
      } catch (__) {}
    }
  }

  let initMath = this.__mathlib.init().then(mathlib => {
    (0, _objectAssign.default)(this.features, mathlib.features);
  });

  let checkCibResize;

  if (!CAN_CREATE_IMAGE_BITMAP) {
    checkCibResize = Promise.resolve(false);
  } else {
    checkCibResize = _utils.default.cib_support().then(status => {
      if (this.features.cib && features.indexOf('cib') < 0) {
        this.debug('createImageBitmap() resize supported, but disabled by config');
        return;
      }

      if (features.indexOf('cib') >= 0) this.features.cib = status;
    });
  }

  this.__initPromise = Promise.all([initMath, checkCibResize]).then(() => this);
  return this.__initPromise;
};

Pica.prototype.resize = function (from, to, options) {
  this.debug('Start resize...');
  let opts = (0, _objectAssign.default)({}, DEFAULT_RESIZE_OPTS);

  if (!isNaN(options)) {
    opts = (0, _objectAssign.default)(opts, {
      quality: options
    });
  } else if (options) {
    opts = (0, _objectAssign.default)(opts, options);
  }

  opts.toWidth = to.width;
  opts.toHeight = to.height;
  opts.width = from.naturalWidth || from.width;
  opts.height = from.naturalHeight || from.height;

  if (to.width === 0 || to.height === 0) {
    return Promise.reject(new Error(`Invalid output size: ${to.width}x${to.height}`));
  }

  if (opts.unsharpRadius > 2) opts.unsharpRadius = 2;
  let canceled = false;
  let cancelToken = null;

  if (opts.cancelToken) {
    cancelToken = opts.cancelToken.then(data => {
      canceled = true;
      throw data;
    }, err => {
      canceled = true;
      throw err;
    });
  }

  let DEST_TILE_BORDER = 3;
  let destTileBorder = Math.ceil(Math.max(DEST_TILE_BORDER, 2.5 * opts.unsharpRadius | 0));
  return this.init().then(() => {
    if (canceled) return cancelToken;

    if (this.features.cib) {
      let toCtx = to.getContext('2d', {
        alpha: Boolean(opts.alpha)
      });
      this.debug('Resize via createImageBitmap()');
      return createImageBitmap(from, {
        resizeWidth: opts.toWidth,
        resizeHeight: opts.toHeight,
        resizeQuality: _utils.default.cib_quality_name(opts.quality)
      }).then(imageBitmap => {
        if (canceled) return cancelToken;

        if (!opts.unsharpAmount) {
          toCtx.drawImage(imageBitmap, 0, 0);
          imageBitmap.close();
          toCtx = null;
          this.debug('Finished!');
          return to;
        }

        this.debug('Unsharp result');
        let tmpCanvas = document.createElement('canvas');
        tmpCanvas.width = opts.toWidth;
        tmpCanvas.height = opts.toHeight;
        let tmpCtx = tmpCanvas.getContext('2d', {
          alpha: Boolean(opts.alpha)
        });
        tmpCtx.drawImage(imageBitmap, 0, 0);
        imageBitmap.close();
        let iData = tmpCtx.getImageData(0, 0, opts.toWidth, opts.toHeight);

        this.__mathlib.unsharp(iData.data, opts.toWidth, opts.toHeight, opts.unsharpAmount, opts.unsharpRadius, opts.unsharpThreshold);

        toCtx.putImageData(iData, 0, 0);
        iData = tmpCtx = tmpCanvas = toCtx = null;
        this.debug('Finished!');
        return to;
      });
    }

    let cache = {};

    const invokeResize = opts => {
      return Promise.resolve().then(() => {
        if (!this.features.ww) return this.__mathlib.resizeAndUnsharp(opts, cache);
        return new Promise((resolve, reject) => {
          let w = this.__workersPool.acquire();

          if (cancelToken) cancelToken.catch(err => reject(err));

          w.value.onmessage = ev => {
            w.release();
            if (ev.data.err) reject(ev.data.err);else resolve(ev.data.result);
          };

          w.value.postMessage({
            opts,
            features: this.__requested_features,
            preload: {
              wasm_nodule: this.__mathlib.__
            }
          }, [opts.src.buffer]);
        });
      });
    };

    const tileAndResize = (from, to, opts) => {
      let srcCtx;
      let srcImageBitmap;
      let toCtx;

      const processTile = tile => this.__limit(() => {
        if (canceled) return cancelToken;
        let srcImageData;

        if (_utils.default.isCanvas(from)) {
          this.debug('Get tile pixel data');
          srcImageData = srcCtx.getImageData(tile.x, tile.y, tile.width, tile.height);
        } else {
          this.debug('Draw tile imageBitmap/image to temporary canvas');
          let tmpCanvas = document.createElement('canvas');
          tmpCanvas.width = tile.width;
          tmpCanvas.height = tile.height;
          let tmpCtx = tmpCanvas.getContext('2d', {
            alpha: Boolean(opts.alpha)
          });
          tmpCtx.globalCompositeOperation = 'copy';
          tmpCtx.drawImage(srcImageBitmap || from, tile.x, tile.y, tile.width, tile.height, 0, 0, tile.width, tile.height);
          this.debug('Get tile pixel data');
          srcImageData = tmpCtx.getImageData(0, 0, tile.width, tile.height);
          tmpCtx = tmpCanvas = null;
        }

        let o = {
          src: srcImageData.data,
          width: tile.width,
          height: tile.height,
          toWidth: tile.toWidth,
          toHeight: tile.toHeight,
          scaleX: tile.scaleX,
          scaleY: tile.scaleY,
          offsetX: tile.offsetX,
          offsetY: tile.offsetY,
          quality: opts.quality,
          alpha: opts.alpha,
          unsharpAmount: opts.unsharpAmount,
          unsharpRadius: opts.unsharpRadius,
          unsharpThreshold: opts.unsharpThreshold
        };
        this.debug('Invoke resize math');
        return Promise.resolve().then(() => invokeResize(o)).then(result => {
          if (canceled) return cancelToken;
          srcImageData = null;
          let toImageData;
          this.debug('Convert raw rgba tile result to ImageData');

          if (CAN_NEW_IMAGE_DATA) {
            toImageData = new ImageData(new Uint8ClampedArray(result), tile.toWidth, tile.toHeight);
          } else {
            toImageData = toCtx.createImageData(tile.toWidth, tile.toHeight);

            if (toImageData.data.set) {
              toImageData.data.set(result);
            } else {
              for (let i = toImageData.data.length - 1; i >= 0; i--) {
                toImageData.data[i] = result[i];
              }
            }
          }

          this.debug('Draw tile');

          if (NEED_SAFARI_FIX) {
            toCtx.putImageData(toImageData, tile.toX, tile.toY, tile.toInnerX - tile.toX, tile.toInnerY - tile.toY, tile.toInnerWidth + 1e-5, tile.toInnerHeight + 1e-5);
          } else {
            toCtx.putImageData(toImageData, tile.toX, tile.toY, tile.toInnerX - tile.toX, tile.toInnerY - tile.toY, tile.toInnerWidth, tile.toInnerHeight);
          }

          return null;
        });
      });

      return Promise.resolve().then(() => {
        toCtx = to.getContext('2d', {
          alpha: Boolean(opts.alpha)
        });

        if (_utils.default.isCanvas(from)) {
          srcCtx = from.getContext('2d', {
            alpha: Boolean(opts.alpha)
          });
          return null;
        }

        if (_utils.default.isImage(from)) {
          if (!CAN_CREATE_IMAGE_BITMAP) return null;
          this.debug('Decode image via createImageBitmap');
          return createImageBitmap(from).then(imageBitmap => {
            srcImageBitmap = imageBitmap;
          });
        }

        throw new Error('".from" should be image or canvas');
      }).then(() => {
        if (canceled) return cancelToken;
        this.debug('Calculate tiles');
        let regions = (0, _tiler.default)({
          width: opts.width,
          height: opts.height,
          srcTileSize: this.options.tile,
          toWidth: opts.toWidth,
          toHeight: opts.toHeight,
          destTileBorder
        });
        let jobs = regions.map(tile => processTile(tile));

        function cleanup() {
          if (srcImageBitmap) {
            srcImageBitmap.close();
            srcImageBitmap = null;
          }
        }

        this.debug('Process tiles');
        return Promise.all(jobs).then(() => {
          this.debug('Finished!');
          cleanup();
          return to;
        }, err => {
          cleanup();
          throw err;
        });
      });
    };

    const processStages = (stages, from, to, opts) => {
      if (canceled) return cancelToken;
      let [toWidth, toHeight] = stages.shift();
      let isLastStage = stages.length === 0;
      opts = (0, _objectAssign.default)({}, opts, {
        toWidth,
        toHeight,
        quality: isLastStage ? opts.quality : Math.min(1, opts.quality)
      });
      let tmpCanvas;

      if (!isLastStage) {
        tmpCanvas = document.createElement('canvas');
        tmpCanvas.width = toWidth;
        tmpCanvas.height = toHeight;
      }

      return tileAndResize(from, isLastStage ? to : tmpCanvas, opts).then(() => {
        if (isLastStage) return to;
        opts.width = toWidth;
        opts.height = toHeight;
        return processStages(stages, tmpCanvas, to, opts);
      });
    };

    let stages = (0, _stepper.default)(opts.width, opts.height, opts.toWidth, opts.toHeight, this.options.tile, destTileBorder);
    return processStages(stages, from, to, opts);
  });
};

Pica.prototype.resizeBuffer = function (options) {
  const opts = (0, _objectAssign.default)({}, DEFAULT_RESIZE_OPTS, options);
  return this.init().then(() => this.__mathlib.resizeAndUnsharp(opts));
};

Pica.prototype.toBlob = function (canvas, mimeType, quality) {
  mimeType = mimeType || 'image/png';
  return new Promise(resolve => {
    if (canvas.toBlob) {
      canvas.toBlob(blob => resolve(blob), mimeType, quality);
      return;
    }

    const asString = atob(canvas.toDataURL(mimeType, quality).split(',')[1]);
    const len = asString.length;
    const asBuffer = new Uint8Array(len);

    for (let i = 0; i < len; i++) {
      asBuffer[i] = asString.charCodeAt(i);
    }

    resolve(new Blob([asBuffer], {
      type: mimeType
    }));
  });
};

Pica.prototype.debug = function () {};

var _default = Pica;
exports.default = _default;