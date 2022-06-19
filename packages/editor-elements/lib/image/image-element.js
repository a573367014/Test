import utils from "@gaoding/editor-framework/lib/utils/utils";
import inherit from "@gaoding/editor-framework/lib/utils/vue-inherit";
import { isVideoResource as _isVideoResource } from "@gaoding/editor-utils/lib/element";
import ImageBaseElement from "../image-base-element";
import template from "./image-element.html";
export default inherit(ImageBaseElement, {
  props: ['isBackground'],
  name: 'image-element',
  template: template,
  data: function data() {
    return {
      readyToDrop: false,
      imageInsideDropArea: false,
      video: null
    };
  },
  computed: {
    showOriginImage: function showOriginImage() {
      return !this.hasEffects && !this.hasFilters || !this.effectedImageUrl || this.model.$editing;
    },
    originUrl: function originUrl() {
      var model = this.model,
          options = this.options;
      return utils.getComputedUrl(model.url, options.fitCrossOrigin);
    },
    effectedImageUrl: function effectedImageUrl() {
      var effectsCondition = !this.hasEffects || this.model.effectedResult.width && this.model.effectedResult.height;
      return this.isBackground || effectsCondition ? this.model.imageUrl : '';
    },
    cssStyle: function cssStyle() {
      var rect = this.rect,
          readyToDrop = this.readyToDrop;
      var padding = rect.padding;
      var opacity = 1;

      if (typeof this.opacity === 'number') {
        opacity = this.opacity;
      }

      opacity = readyToDrop ? 1 : opacity;
      return {
        height: rect.height + padding[0] + padding[2] + 'px',
        width: rect.width + padding[1] + padding[3] + 'px',
        opacity: opacity
      };
    },
    imageWrapStyle: function imageWrapStyle() {
      var _this$model = this.model,
          naturalWidth = _this$model.naturalWidth,
          naturalHeight = _this$model.naturalHeight,
          width = _this$model.width,
          height = _this$model.height;
      return {
        position: 'absolute',
        left: -(naturalWidth - width) / 2 * this.zoom + 'px',
        top: -(naturalHeight - height) / 2 * this.zoom + 'px'
      };
    },
    imageStyle: function imageStyle() {
      var _this$model2 = this.model,
          imageTransform = _this$model2.imageTransform,
          naturalWidth = _this$model2.naturalWidth,
          naturalHeight = _this$model2.naturalHeight;

      var _imageTransform$toJSO = imageTransform.toJSON(),
          a = _imageTransform$toJSO.a,
          b = _imageTransform$toJSO.b,
          c = _imageTransform$toJSO.c,
          d = _imageTransform$toJSO.d,
          tx = _imageTransform$toJSO.tx,
          ty = _imageTransform$toJSO.ty;

      return {
        position: 'absolute',
        width: Math.max(1, naturalWidth * this.zoom) + 'px',
        height: Math.max(1, naturalHeight * this.zoom) + 'px',
        transform: "matrix(" + a + "," + b + "," + c + "," + d + "," + tx * this.zoom + "," + ty * this.zoom + ")"
      };
    },
    visible: function visible() {
      var model = this.model,
          imageUrl = this.imageUrl,
          hasEffects = this.hasEffects,
          canvasRendered = this.canvasRendered;
      var valid = !model.$imageDraging && (model.$editing || imageUrl || hasEffects && canvasRendered);
      return valid && !this.isGif ? 'visible' : 'hidden';
    },

    /**
     * 判断元素数据是否为视频资源
     */
    isVideoResource: function isVideoResource() {
      return _isVideoResource(this.model);
    }
  },
  methods: {
    load: function load() {
      var _this = this;

      this.usePlaceholder = false;
      var originUrl = this.originUrl,
          effectedImageUrl = this.effectedImageUrl,
          hasEffects = this.hasEffects,
          hasFilters = this.hasFilters,
          options = this.options;
      var promise = null;

      if (!originUrl) {
        this.usePlaceholder = true;
        promise = Promise.resolve();
      }

      if (!effectedImageUrl && (hasEffects || hasFilters)) {
        promise = utils.loadImage(originUrl, options.fitCrossOrigin).then(this.baseLoad);
      } else {
        this.isFirstRendered = true;
        promise = Promise.all([!this.isPreviewMode || !effectedImageUrl ? utils.loadImage(originUrl, this.options.fitCrossOrigin) : null, effectedImageUrl ? utils.loadImage(effectedImageUrl, options.fitCrossOrigin) : null]).then(function (_ref) {
          var originalImg = _ref[0];
          originalImg && _this.initDataByImg(originalImg);
        });
      }

      return promise.then(this.loadGifOrApng).catch(function (e) {
        _this.usePlaceholder = true;
        throw e;
      });
    }
  },
  events: {
    'element.readyToDrop': function elementReadyToDrop(model) {
      if (model !== this.model || !model.editable || !this.editor.options.dragImageToMaskEnable) return;
      this.model.$guider.show = false;
      this.model.$guider.marginShow = false;
      this.readyToDrop = true;
    },
    'element.resetReadyToDrop': function elementResetReadyToDrop(model) {
      if (model && model !== this.model) return;
      this.model.$guider.show = true;
      this.model.$guider.marginShow = true;
      this.readyToDrop = false;
    },
    'element.imageInsideDropArea': function elementImageInsideDropArea(model) {
      if (model !== this.model || !this.readyToDrop) return;
      this.imageInsideDropArea = true;
    },
    'element.imageOutsideDropArea': function elementImageOutsideDropArea(model) {
      if (model !== this.model || !this.readyToDrop) return;
      this.imageInsideDropArea = false;
    }
  },
  watch: {
    'model.$currentTime': function model$currentTime(time) {
      if (this.isVideoResource && this.video) {
        var naturalDuration = this.model.naturalDuration;
        this.video.currentTime = time % naturalDuration / 1000 || 0;
      }
    }
  },
  mounted: function mounted() {
    var _this2 = this;

    // 参数变更时触发重绘
    this.$watch(function () {
      var _this2$model = _this2.model,
          url = _this2$model.url,
          width = _this2$model.width,
          height = _this2$model.height,
          $imageWidth = _this2$model.$imageWidth,
          $imageHeight = _this2$model.$imageHeight,
          $imageLeft = _this2$model.$imageLeft,
          $imageTop = _this2$model.$imageTop,
          imageTransform = _this2$model.imageTransform;
      var result = [width, height, $imageWidth, $imageHeight, $imageLeft, $imageTop].map(function (v) {
        return Math.round(v);
      });
      result.push(imageTransform.rotation, url);
      return result.join(' ');
    }, function () {
      if (!_this2.isDesignMode) return;

      if (_this2.editor.$binding.config.applyingYActions) {
        _this2.lazyRender();
      } else if (!_this2.editor.global.$draging && !_this2.model.$imageDraging) {
        _this2.lazyRender();

        if (_this2.isNeedRenderAnimatioFrame) {
          _this2.renderAnimationImage();
        }
      }
    });

    if (this.isVideoResource) {
      this.video = this.$refs.video;
      var _this$model3 = this.model,
          $currentTime = _this$model3.$currentTime,
          naturalDuration = _this$model3.naturalDuration;
      this.video.currentTime = $currentTime % naturalDuration / 1000;
    }
  }
});