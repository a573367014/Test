import _get from "lodash/get";
import _debounce from "lodash/debounce";
import Promise from 'bluebird';
import utils from "@gaoding/editor-framework/lib/utils/utils";
import inherit from "@gaoding/editor-framework/lib/utils/vue-inherit";
import BaseElement from "@gaoding/editor-framework/lib/base/base-element";
import template from "./nine-patch-element.html";
import _autoStretchImage from "@gaoding/editor-utils/lib/auto-stretch-image"; // TODK: QQ 浏览器对 borderImageSlice、borderImageRepeat 支持有些问题
// 需用 canvas 绘制

var isQQBrowser = navigator.userAgent.includes('QQBrowser');
export default inherit(BaseElement, {
  name: 'nine-patch-element',
  template: template,
  data: function data() {
    return {
      // TODO：统一先用 canvas，css borderimage 在缩放状态下会出现异常
      // https://jira.huanleguang.com/browse/PRODBUG-8
      canvasRendered: true
    };
  },
  computed: {
    canvasRender: function canvasRender() {
      return this.canvasRendered || isQQBrowser || this.model.width < this.model.originWidth || this.model.height < this.model.originHeight;
    },
    mainStyle: function mainStyle() {
      var model = this.model,
          zoom = this.global.zoom;
      var url = model.url,
          imageSlice = model.imageSlice; // ['top', 'right', 'bottom', 'left']

      var offsets = [imageSlice.top, imageSlice.right, imageSlice.bottom, imageSlice.left];
      var unitStr = offsets.map(function (v) {
        return v * 1 * zoom * model.effectScale + 'px';
      }).join(' ');
      return {
        borderImageSource: "url(" + url + ")",
        borderImageSlice: offsets.join(' ') + ' fill',
        borderImageWidth: unitStr,
        borderImageRepeat: 'repeat',
        borderStyle: 'solid'
      };
    }
  },
  methods: {
    // loader
    load: function load() {
      var _this = this;

      var url = this.model.url;
      if (!url) return Promise.resolve();
      return utils.loadImage(url, this.options.fitCrossOrigin).then(function (img) {
        _this.$img = img;
        _this.model.originWidth = img.naturalWidth;
        _this.model.originHeight = img.naturalHeight;
        return _this.render();
      });
    },
    autoStretchImage: function autoStretchImage(url) {
      var _this$model = this.model,
          width = _this$model.width,
          height = _this$model.height,
          imageSlice = _this$model.imageSlice,
          effectScale = _this$model.effectScale;
      return _autoStretchImage(url, {
        targetWidth: Math.round(width),
        targetHeight: Math.round(height),
        imageSlice: imageSlice,
        targetImageSlice: {
          left: imageSlice.left * effectScale,
          top: imageSlice.top * effectScale,
          right: imageSlice.right * effectScale,
          bottom: imageSlice.bottom * effectScale
        },
        canvas: this.$refs.canvas
      });
    },
    render: function render() {
      if (!this.$refs.canvas || !this.canvasRender) return;
      var _this$model2 = this.model,
          url = _this$model2.url,
          $img = _this$model2.$img;
      this.canvasRendered = true;
      return this.autoStretchImage($img || url);
    },
    exportImage: function exportImage() {
      var _this2 = this;

      var url = this.model.url; // 协同模式时其他用户可能无法展示 blob url

      if (_get(this, 'options.collabOptions.enable')) {
        return Promise.resolve().then(function () {
          _this2.model.imageUrl = null;
        });
      }

      return this.autoStretchImage(url).then(function (canvas) {
        var imageType = 'image/png';

        if (_this2.options.resource.blobUrlEnable) {
          return new Promise(function (resolve) {
            canvas.toBlob(function (blob) {
              resolve(URL.createObjectURL(blob));
            }, imageType, 1);
          });
        }

        return canvas.toDataURL(imageType, 1);
      }).then(function (url) {
        _this2.model.imageUrl = url || null;
      });
    }
  },
  watch: {
    canvasRender: function canvasRender() {
      this.render();
    },
    'model.url': function modelUrl() {
      this.checkLoad();
    }
  },
  events: {
    'element.transformEnd': function elementTransformEnd(model, drag, _ref) {
      var action = _ref.action;
      var parents = this.editor.getParentGroups(this.model);
      var isInclude = parents.map(function (item) {
        return item.$id;
      }).concat(this.model.$id).includes(this.model.$id);
      if (action !== 'resize' || !isInclude) return;
      this.lazyExportImage();
    }
  },
  mounted: function mounted() {
    var _this3 = this;

    this.lazyExportImage = _debounce(function () {
      _this3.exportImage();
    }, 350); // 裁切参数变更时重绘

    this.$watch(function () {
      var _this3$model = _this3.model,
          width = _this3$model.width,
          height = _this3$model.height,
          url = _this3$model.url;
      return [width, height, url];
    }, function () {
      if (!_this3.editor.global.$draging && !_this3.isDesignMode) {
        _this3.lazyExportImage();
      } else {
        _this3.render();
      }
    });

    if (!this.model.imageUrl) {
      this.lazyExportImage();
    }
  }
});