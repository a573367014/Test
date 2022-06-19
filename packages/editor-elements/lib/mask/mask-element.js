import utils from "@gaoding/editor-framework/lib/utils/utils";
import inherit from "@gaoding/editor-framework/lib/utils/vue-inherit";
import ImageBaseElement from "../image-base-element";
import template from "./mask-element.html";
import { i18n } from "../i18n";
export default inherit(ImageBaseElement, {
  name: 'mask-element',
  template: template,
  data: function data() {
    return {
      readyForDrop: false,
      insideDropArea: false
    };
  },
  computed: {
    mainStyle: function mainStyle() {
      var padding = this.padding,
          borderRadius = this.borderRadius;
      return {
        padding: padding,
        borderRadius: borderRadius
      };
    },
    maskDropAreaDimension: function maskDropAreaDimension() {
      var dimensions = [{
        width: 120,
        height: 50,
        size: 'big',
        breakpoint: 300
      }, {
        width: 80,
        height: 42,
        size: 'medium',
        breakpoint: 170
      }, {
        width: 40,
        height: 40,
        size: 'small',
        breakpoint: 80
      }];
      var width = this.model.width * this.global.zoom;
      return dimensions.find(function (dimension) {
        return dimension.breakpoint < width;
      }) || {
        size: 'small',
        width: width * 0.4,
        height: width * 0.4
      };
    },
    maskDropAreaStyle: function maskDropAreaStyle() {
      var zoom = this.global.zoom;
      var _this$maskDropAreaDim = this.maskDropAreaDimension,
          width = _this$maskDropAreaDim.width,
          height = _this$maskDropAreaDim.height;
      return {
        width: width + "px",
        height: height + "px",
        left: (this.model.width * zoom - width) / 2 + "px",
        top: (this.model.height * zoom - height) / 2 + "px"
      };
    },
    dropAreaText: function dropAreaText() {
      var text = '';

      if (this.maskDropAreaDimension.size === 'medium') {
        text = this.insideDropArea ? i18n.$tsl('释放') : i18n.$tsl('拖入');
      } else {
        text = this.insideDropArea ? i18n.$tsl('释放图片') : i18n.$tsl('拖入图片');
      }

      return text;
    }
  },
  methods: {
    load: function load() {
      var _this = this;

      if (!this.model.url) {
        return this.imageRenderer.renderBackground({
          force: true
        });
      }

      if (this.imageUrl && !this.isGif && !this.model.isVideo) {
        this.isFirstRendered = true;
        return Promise.all([!this.isPreviewMode ? utils.loadImage(this.model.url, this.options.fitCrossOrigin, true) : null, utils.loadImage(this.imageUrl, this.options.fitCrossOrigin)]).then(function (_ref) {
          var originalImg = _ref[0];
          originalImg && _this.initDataByImg(originalImg);
        });
      }

      return this.baseLoad().then(this.loadGifOrApng);
    },
    lazyRender: function lazyRender() {
      if (!this.isDesignMode || this.isGif || this.isVideo) return;

      if (this.hasFilters || this.hasEffects) {
        var _this$imageRenderer;

        return (_this$imageRenderer = this.imageRenderer).lazyRender.apply(_this$imageRenderer, arguments);
      }

      return this.render.apply(this, arguments);
    }
  },
  events: {
    'element.readyForDrop': function elementReadyForDrop(model, imageElement, mousePos) {
      var _this2 = this;

      if (model !== this.model || !imageElement || !model.editable || !this.isDesignMode) return;
      if (imageElement && !imageElement.editable || !this.editor.options.dragImageToMaskEnable) return;
      if (model !== this.model || !imageElement) return;

      if (!imageElement.enableDragToMask) {
        return;
      }

      this.readyForDrop = true;
      var url = imageElement.imageUrl || imageElement.url;
      var zoom = this.global.zoom;
      var currentLayout = this.editor.getLayoutByPoint(mousePos);
      var _this$model = this.model,
          width = _this$model.width,
          height = _this$model.height,
          left = _this$model.left,
          top = _this$model.top;

      var calcPosition = function calcPosition(vm) {
        var groups = _this2.editor.getParentGroups(vm.model, currentLayout);

        groups.forEach(function (group) {
          mousePos.x -= group.left;
          mousePos.y -= group.top;
          mousePos = utils.getPointPosition(mousePos, {
            x: group.width / 2,
            y: group.height / 2
          }, -group.rotate, -group.skewX, -group.skewY);
        });
      }; // 支持组嵌套


      calcPosition(this);
      var _this$maskDropAreaDim2 = this.maskDropAreaDimension,
          areaWidth = _this$maskDropAreaDim2.width,
          areaHeight = _this$maskDropAreaDim2.height,
          areaSize = _this$maskDropAreaDim2.size;
      var dropWidthDiff = (1 - zoom) * areaWidth / zoom;
      var dropHeightDiff = (1 - zoom) * areaHeight / zoom;
      var dropAreaLeft = left + (width - areaWidth) / 2 - dropWidthDiff / 2;
      var dropAreaTop = top + (height - areaHeight) / 2 - dropHeightDiff / 2;
      var dropAreaRight = dropAreaLeft + areaWidth + dropWidthDiff;
      var dropAreaBottom = dropAreaTop + areaHeight + dropHeightDiff; // 大的放置区域的响应区域外扩自身的 1/8

      var expandWidth = areaSize === 'big' ? areaWidth / 8 : 0;
      var rect = utils.getElementRect({
        left: dropAreaLeft - expandWidth,
        top: dropAreaTop - expandWidth,
        width: dropAreaRight - dropAreaLeft + 2 * expandWidth,
        height: dropAreaBottom - dropAreaTop + 2 * expandWidth,
        rotate: this.model.rotate
      }, 1);
      var insideDropArea = utils.pointInRect(mousePos.x, mousePos.y - currentLayout.top, rect);

      if (insideDropArea) {
        var imgWidth = imageElement.naturalWidth;
        var imgHeight = imageElement.naturalHeight; // 短边放大，cover

        var ratio = Math.max(this.model.width / imgWidth, this.model.height / imgHeight);
        imgWidth *= ratio;
        imgHeight *= ratio; // 临时绘制拖拽进入的图片不要滤镜，渲染太慢了

        this.insideDropArea !== insideDropArea && this.render({
          resizeByPica: false,
          renderFilter: false,
          renderEffect: false,
          imgWidth: imgWidth,
          imgHeight: imgHeight,
          img: url,
          force: true
        });
        imageElement.$insideDropArea = true;
        this.$events.$emit('element.imageInsideDropArea', imageElement);
      } else {
        if (this.model.url && this.insideDropArea !== insideDropArea) {
          this.render({
            img: model.url,
            force: true
          });
        } else if (this.insideDropArea !== insideDropArea) {
          this.imageRenderer.renderBackground({
            force: true
          });
        }

        this.$events.$emit('element.imageOutsideDropArea', imageElement);
        imageElement.$insideDropArea = false;
      }

      this.insideDropArea = insideDropArea;
    },
    'element.resetReadyForDrop': function elementResetReadyForDrop(model) {
      if (model && !model.editable && !this.editor.options.dragImageToMaskEnable) return;
      if (!this.isDesignMode) return;

      if (model === this.model && this.readyForDrop) {
        this.readyForDrop = false;
        this.insideDropArea = false;
      }
    },
    'element.applyImageDrop': function elementApplyImageDrop(model, imageElement) {
      var _this3 = this;

      if (model === this.model && imageElement && this.insideDropArea && imageElement.enableDragToMask) {
        var url = imageElement.imageUrl || imageElement.url;
        utils.loadImage(url, this.options.fitCrossOrigin, true).then(function (img) {
          var _this3$editor$options;

          var width = img.naturalWidth;
          var height = img.naturalHeight;

          _this3.editor.removeElement(imageElement, null, true);

          _this3.editor.changeElement({
            resourceType: imageElement.resourceType
          }, model);

          _this3.editor.replaceImage(url, {
            forwardEdit: false,
            width: width,
            height: height
          }, model);

          (_this3$editor$options = _this3.editor.options) === null || _this3$editor$options === void 0 ? void 0 : _this3$editor$options.changeMetaInfoHook({
            oldElement: imageElement,
            newElement: model,
            type: 'replace'
          });

          _this3.editor.focusElement(model);

          _this3.$events.$emit('element.applyImageDrop.success', model, imageElement);
        });
      }

      this.readyForDrop = false;
      this.insideDropArea = false;
    }
  },
  mounted: function mounted() {
    var _this4 = this;

    // 参数变更时触发重绘
    this.$watch(function () {
      var _this4$model = _this4.model,
          width = _this4$model.width,
          height = _this4$model.height,
          $imageWidth = _this4$model.$imageWidth,
          $imageHeight = _this4$model.$imageHeight,
          $imageLeft = _this4$model.$imageLeft,
          $imageTop = _this4$model.$imageTop,
          imageTransform = _this4$model.imageTransform,
          resourceType = _this4$model.resourceType;
      var rotation = imageTransform.rotation;
      var result = [width, height, $imageWidth, $imageHeight, $imageLeft, $imageTop].map(function (v) {
        return Math.round(v);
      }); // 取整、避免 naturalWidth 重置导致的误算

      result.push(rotation, resourceType);
      return result.join(' ');
    }, function () {
      if (!_this4.isDesignMode) return;

      if (_this4.editor.$binding.config.applyingYActions) {
        _this4.lazyRender();
      } else if (_this4.model.$imageDraging || _this4.options.supportAdaptiveElements.includes(_this4.model.type)) {
        _this4.render({
          resizeByPica: false,
          renderFilter: false,
          renderEffect: false,
          force: true
        });
      } // 存在特效时是按原图绘制，拖拽时没必要实时更新
      else if (!_this4.editor.global.$draging && !_this4.hasEffects) {
        _this4.lazyRender({
          force: true
        });

        if (_this4.isNeedRenderAnimatioFrame) {
          _this4.renderAnimationImage();
        }
      }
    });
  }
});