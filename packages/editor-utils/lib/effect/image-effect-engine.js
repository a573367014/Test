"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ImageEffectEngine = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _clip = require("./utils/clip");

var _tinycolor = _interopRequireDefault(require("tinycolor2"));

var _fill = require("./utils/fill");

var _elementExpand = require("../element-expand");

var _shadow = require("@gaoding/shadow");

var _hash = require("../hash");

var _element = require("../element");

let engineId = 0;

class ImageEffectEngine {
  constructor(envContext) {
    (0, _defineProperty2.default)(this, "id", void 0);
    (0, _defineProperty2.default)(this, "envContext", void 0);
    (0, _defineProperty2.default)(this, "viewCanvas", void 0);
    (0, _defineProperty2.default)(this, "viewCtx", void 0);
    (0, _defineProperty2.default)(this, "imgCanvas", void 0);
    (0, _defineProperty2.default)(this, "imgCtx", void 0);
    (0, _defineProperty2.default)(this, "drawerCanvas", void 0);
    (0, _defineProperty2.default)(this, "drawerCtx", void 0);
    (0, _defineProperty2.default)(this, "originalImg", null);
    (0, _defineProperty2.default)(this, "effects", []);
    (0, _defineProperty2.default)(this, "shadows", []);
    (0, _defineProperty2.default)(this, "element", null);
    (0, _defineProperty2.default)(this, "shadowExpandCacheKey", void 0);
    (0, _defineProperty2.default)(this, "expand", {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0
    });
    (0, _defineProperty2.default)(this, "effectExpand", {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0
    });
    (0, _defineProperty2.default)(this, "shadowExpand", {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0
    });
    (0, _defineProperty2.default)(this, "width", 0);
    (0, _defineProperty2.default)(this, "height", 0);
    (0, _defineProperty2.default)(this, "drawPromise", null);
    this.id = engineId++;
    this.envContext = envContext;
    this.viewCanvas = this.envContext.createCanvas(0, 0, true);
    this.viewCtx = this.viewCanvas.getContext('2d');
    this.viewCtx.imageSmoothingEnabled = false;
    this.imgCanvas = this.envContext.createCanvas(0, 0, true);
    this.imgCtx = this.imgCanvas.getContext('2d');
    this.imgCtx.imageSmoothingEnabled = false;
    this.drawerCanvas = this.envContext.createCanvas(0, 0, true);
    this.drawerCtx = this.drawerCanvas.getContext('2d');
    this.drawerCtx.imageSmoothingEnabled = false;
  }

  async applyEffects(img, element, exportImage = true) {
    const {
      imageEffects = [],
      shadows = []
    } = element;

    if (!imageEffects.length && !shadows.length) {
      return Promise.resolve({
        canvas: img,
        effectModel: {
          imageUrl: null,
          effectedResult: {
            width: 0,
            height: 0,
            left: 0,
            top: 0
          }
        }
      });
    }

    await this.initData(img, element);
    this.updateCanvasSize();
    await this.draw();
    const effectModel = {
      effectedResult: {
        width: this.width,
        height: this.height,
        left: -this.expand.left,
        top: -this.expand.top
      }
    };

    if (exportImage) {
      effectModel.imageUrl = this.viewCanvas.toDataURL('image/png');
    }

    return {
      canvas: this.viewCanvas,
      effectModel
    };
  }

  async initData(img, element) {
    var _element$imageEffects, _element$shadows;

    this.originalImg = img;
    this.element = element;
    this.effects = ((_element$imageEffects = element.imageEffects) !== null && _element$imageEffects !== void 0 ? _element$imageEffects : []).filter(ef => ef.enable);
    this.shadows = ((_element$shadows = element.shadows) !== null && _element$shadows !== void 0 ? _element$shadows : []).filter(ef => ef.enable);
    const maskHash = (0, _element.isMaskElement)(element) ? (0, _hash.murmurHash2)(element.mask) : '';
    this.shadowExpandCacheKey = element.url + element.width + element.height + this.id + maskHash;
    this.effectExpand = (0, _elementExpand.calculateEffectExpand)(this.element);

    if (this.envContext.env === 'browser') {
      this.shadowExpand = await (0, _elementExpand.calculateImageShadowExpand)(this.element, this.shadowExpandCacheKey);
    } else {
      var _this$envContext$logg, _this$envContext$logg2;

      (_this$envContext$logg = this.envContext.logger) === null || _this$envContext$logg === void 0 ? void 0 : (_this$envContext$logg2 = _this$envContext$logg.warn) === null || _this$envContext$logg2 === void 0 ? void 0 : _this$envContext$logg2.call(_this$envContext$logg, 'Non-Browser not support shadow!');
    }

    this.expand = (0, _elementExpand.getExpandByExpands)([this.shadowExpand, this.effectExpand]);
    this.width = img.width + this.expand.left + this.expand.right;
    this.height = img.height + this.expand.top + this.expand.bottom;
  }

  updateCanvasSize() {
    if (!this.originalImg) {
      throw new Error('Can not find the this.originalImg');
    }

    this.viewCanvas.width = this.width;
    this.viewCanvas.height = this.height;
    this.viewCtx.clearRect(0, 0, this.width, this.height);
    this.drawerCanvas.width = this.width;
    this.drawerCanvas.height = this.height;
    this.drawerCtx.clearRect(0, 0, this.width, this.height);
    this.imgCanvas.width = this.originalImg.width;
    this.imgCanvas.height = this.originalImg.height;
    this.imgCtx.clearRect(0, 0, this.originalImg.width, this.originalImg.height);
  }

  async draw() {
    if (this.drawPromise) {
      await this.drawPromise;
    }

    const drawQueue = [];

    if (this.envContext.env === 'browser') {
      drawQueue.push(() => this.drawShadows());
    }

    for (let i = this.effects.length - 1; i >= 0; i--) {
      drawQueue.push(() => this.drawEffect(this.effects[i]));
    }

    if (this.effects.filter(ef => ef.enable).length === 0) {
      drawQueue.push(() => this.drawFillOriginImage());
    }

    this.drawerCtx.save();
    this.drawPromise = drawQueue.reduce((p, fn) => p.then(fn), Promise.resolve());
    await this.drawPromise;
  }

  async drawShadows() {
    if (!this.originalImg) {
      throw new Error('Can not find the this.originalImg');
    }

    this.imgCtx.clearRect(0, 0, this.imgCanvas.width, this.imgCanvas.height);
    this.imgCtx.drawImage(this.originalImg, 0, 0);
    const shadowExpandCacheKey = this.shadowExpandCacheKey || String(Date.now());
    const {
      bbox,
      points,
      bottomArray
    } = (0, _shadow.getCacheBBoxData)(this.imgCanvas, shadowExpandCacheKey);
    const hasValidShadow = this.shadows.some(sh => sh.enable);

    if (!hasValidShadow) {
      return Promise.resolve();
    }

    const shadows = this.shadows;
    const shadowCanvas = (0, _shadow.render)({
      image: this.imgCanvas,
      shadows,
      bbox,
      points,
      bottomArray,
      imgUrl: shadowExpandCacheKey
    });
    const offsetX = Math.max(0, this.effectExpand.left - this.shadowExpand.left);
    const offsetY = Math.max(0, this.effectExpand.top - this.shadowExpand.top);
    this.drawerCtx.drawImage(shadowCanvas, offsetX, offsetY);
    this.drawToView();
  }

  async drawEffect(effect) {
    if (!this.originalImg) {
      throw new Error('Can not find the this.originalImg');
    }

    this.imgCtx.clearRect(0, 0, this.imgCanvas.width, this.imgCanvas.height);
    this.imgCtx.drawImage(this.originalImg, 0, 0);

    if (effect.mask && effect.mask.enable) {
      await this.drawMask(effect);
    }

    if (effect.filling && effect.filling.enable) {
      await this.drawFill(effect);
    } else {
      this.drawFillOriginImage(effect);
    }

    if (effect.insetShadow && effect.insetShadow.enable) {
      this.drawInsetShadow(effect);
    }

    if (effect.stroke && effect.stroke.enable) {
      this.drawStroke(effect);
    }
  }

  async drawMask(effect) {
    let drawMaskPromise = Promise.resolve();

    if (!effect.mask) {
      return;
    }

    if (effect.mask.type === 'image') {
      if (effect.mask.image) {
        drawMaskPromise = this.envContext.loadImage(effect.mask.image).then(img => {
          this.drawerCtx.drawImage(this.imgCanvas, 0, 0);
          this.drawerCtx.globalCompositeOperation = 'destination-in';

          if (this.imgCanvas.height * img.width > this.imgCanvas.width * img.height) {
            const w = this.imgCanvas.width;
            const h = img.height * this.imgCanvas.width / img.width;
            this.drawerCtx.drawImage(img, 0, (this.imgCanvas.height - h) / 2, w, h);
          } else {
            const w = img.width * this.imgCanvas.height / img.height;
            const h = this.imgCanvas.height;
            this.drawerCtx.drawImage(img, (this.imgCanvas.width - w) / 2, 0, w, h);
          }
        });
      }
    } else {
      (0, _clip.clipImage)(this.drawerCtx, this.imgCanvas, effect.mask);
    }

    await drawMaskPromise;
    this.imgCtx.clearRect(0, 0, this.imgCanvas.width, this.imgCanvas.height);
    this.imgCtx.drawImage(this.drawerCanvas, 0, 0);
    this.drawerCtx.clearRect(0, 0, this.width, this.height);
    this.drawerCtx.restore();
    this.drawerCtx.save();
  }

  async drawFill(effect) {
    if (!effect.filling) {
      return;
    }

    let drawFillPromise = Promise.resolve();
    this.drawerCtx.drawImage(this.imgCanvas, this.expand.left, this.expand.top);
    this.drawerCtx.globalCompositeOperation = 'source-in';

    if (['color', 0].includes(effect.filling.type)) {
      this.drawerCtx.fillStyle = (0, _tinycolor.default)(effect.filling.color).toString('rgb');
      this.drawerCtx.fillRect(0, 0, this.width, this.height);
      drawFillPromise = Promise.resolve();
    }

    if (['gradient', 2].includes(effect.filling.type) && effect.filling.gradient) {
      const w = this.imgCanvas.width / 2;
      const h = this.imgCanvas.height / 2;
      const angle = -(effect.filling.gradient.angle / 180) * Math.PI;
      const r = Math.abs(Math.cos(angle)) * w + Math.abs(Math.sin(angle)) * h;
      const lineGrad = this.drawerCtx.createLinearGradient(w - r * Math.cos(angle) + this.expand.left, h - r * Math.sin(angle) + this.expand.top, w + r * Math.cos(angle) + this.expand.left, h + r * Math.sin(angle) + this.expand.top);

      for (const colorSet of effect.filling.gradient.stops) {
        colorSet.color = (0, _tinycolor.default)(colorSet.color).toString('rgb');
        lineGrad.addColorStop(colorSet.offset, colorSet.color);
      }

      this.drawerCtx.fillStyle = lineGrad;
      this.drawerCtx.fillRect(this.expand.left, this.expand.top, this.imgCanvas.width, this.imgCanvas.height);
      drawFillPromise = Promise.resolve();
    }

    if (['image', 1].includes(effect.filling.type) && effect.filling.imageContent) {
      const {
        imageContent
      } = effect.filling;

      if (imageContent.image) {
        drawFillPromise = (0, _fill.getImageEffectFillImage)(imageContent, {
          width: this.imgCanvas.width,
          height: this.imgCanvas.height
        }, this.envContext).then(img => {
          this.drawerCtx.fillStyle = 'rgba(255,255,255,1)';
          this.drawerCtx.fillRect(0, 0, this.width, this.height);
          this.drawerCtx.drawImage(img, this.expand.left, this.expand.top);
        });
      } else {
        console.error('图片特效填充类型为图片，但没有imageUrl');
      }
    }

    await drawFillPromise;
    this.drawToView(effect);
  }

  drawFillOriginImage(effect) {
    this.drawerCtx.drawImage(this.imgCanvas, this.expand.left, this.expand.top);
    this.drawToView(effect);
  }

  drawStroke(effect) {
    if (!effect.stroke) {
      return;
    }

    let offsetX = 0;
    let offsetY = 0;

    if (effect.offset && effect.offset.enable) {
      offsetX = effect.offset.x;
      offsetY = effect.offset.y;
    }

    offsetX += this.expand.left;
    offsetY += this.expand.top;
    const {
      color,
      width: strokeWidth
    } = effect.stroke;

    if (strokeWidth <= 0) {
      return;
    }

    for (let i = 0; i < 360; i++) {
      const angle = i * Math.PI / 180;
      const x = strokeWidth * Math.cos(angle) + offsetX;
      const y = strokeWidth * Math.sin(angle) + offsetY;
      this.drawerCtx.drawImage(this.imgCanvas, x, y);
    }

    this.drawerCtx.globalCompositeOperation = 'source-in';
    this.drawerCtx.fillStyle = color;
    this.drawerCtx.fillRect(0, 0, this.width, this.height);
    this.drawerCtx.globalCompositeOperation = 'destination-out';
    this.drawerCtx.drawImage(this.imgCanvas, offsetX, offsetY);
    this.drawToView();
  }

  drawInsetShadow(effect) {
    if (!effect.insetShadow) {
      return;
    }

    const {
      blur: blurWidth,
      color,
      offsetX,
      offsetY
    } = effect.insetShadow;
    const tempCanvas = this.envContext.createCanvas(this.width + blurWidth * 2, this.height + blurWidth * 2, true);
    const tempCtx = tempCanvas.getContext('2d');
    const drawOffsetX = blurWidth + offsetX;
    const drawOffsetY = blurWidth + offsetY;
    tempCtx.drawImage(this.imgCanvas, drawOffsetX, drawOffsetY, this.width, this.height);
    tempCtx.globalCompositeOperation = 'xor';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    this.drawerCtx.save();
    this.drawerCtx.shadowBlur = blurWidth;
    this.drawerCtx.shadowColor = color;
    this.drawerCtx.shadowOffsetX = offsetX + this.expand.left;
    this.drawerCtx.shadowOffsetY = offsetY + this.expand.top;
    this.drawerCtx.drawImage(tempCanvas, -drawOffsetX, -drawOffsetY);
    this.drawerCtx.restore();
    this.drawerCtx.globalCompositeOperation = 'destination-in';
    this.drawerCtx.drawImage(this.imgCanvas, this.expand.left, this.expand.top);
    this.drawerCtx.globalCompositeOperation = 'source-over';
    this.drawToView(effect);
  }

  drawToView(effect) {
    let offsetX = 0;
    let offsetY = 0;

    if (effect && effect.offset && effect.offset.enable) {
      offsetX = effect.offset.x;
      offsetY = effect.offset.y;
    }

    this.viewCtx.drawImage(this.drawerCanvas, offsetX, offsetY);
    this.drawerCtx.clearRect(0, 0, this.width, this.height);
    this.drawerCtx.restore();
    this.drawerCtx.save();
  }

}

exports.ImageEffectEngine = ImageEffectEngine;