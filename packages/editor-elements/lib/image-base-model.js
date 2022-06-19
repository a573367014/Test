import _createClass from "@babel/runtime/helpers/createClass";
import _assertThisInitialized from "@babel/runtime/helpers/assertThisInitialized";
import _inheritsLoose from "@babel/runtime/helpers/inheritsLoose";
import BaseModel from "@gaoding/editor-framework/lib/base/element-base-model";
import { useEffects } from "@gaoding/editor-framework/lib/utils/model-adaptation";
import editorDefaults from "@gaoding/editor-framework/lib/base/editor-defaults";
import { editorResourceMap } from "@gaoding/editor-framework/lib/utils/export-resource";

var ImageBaseModel = /*#__PURE__*/function (_BaseModel) {
  _inheritsLoose(ImageBaseModel, _BaseModel);

  function ImageBaseModel(data, options) {
    var _this;

    if (options === void 0) {
      options = {};
    }

    _this = _BaseModel.call(this, data) || this;
    _this.imageTransform = _this.parseTransform(_this.imageTransform);
    _this.imageEffects && useEffects(_assertThisInitialized(_this), true);
    var hasEffects = _this.hasEffects;
    var hasFilters = _this.hasFilters; // 旧版本图片特效重新渲染

    if (!data.effectedResult && hasEffects) {
      _this.imageUrl = '';
    } // 兼容旧版本


    if (data.isGif) {
      _this.resourceType = 'gif';
    } // 兼容 loop


    if (typeof data.loop === 'boolean') {
      _this.loop = data.loop ? 0 : 1;
    }

    _this.filterInfo = data.filterInfo || {
      id: -1,
      url: '',
      strong: 0.8,
      intensity: 0.8
    };

    if (!hasEffects && _this.effectedResult) {
      _this.effectedResult.width = 0;
      _this.effectedResult.height = 0;
      _this.effectedResult.left = 0;
      _this.effectedResult.top = 0;
    } // 处理可能存在特效结果图，但实际并没有应用特效的错误数据


    if (!hasEffects && !hasFilters) {
      _this.effectedImage = '';

      if (_this.type === 'image') {
        _this.imageUrl = '';
      }
    } else if (_this.effectedImage) {
      _this.imageUrl = _this.effectedImage;
    } // 兼容 imageWidth、imageHeight 字段


    if (!data.naturalWidth) {
      _this.naturalWidth = data.imageWidth || data.width;
      _this.naturalHeight = data.imageHeight || data.height;
      _this.$imageLeft = _this.imageTransform.position.x;
      _this.$imageTop = _this.imageTransform.position.y;
    } else {
      _this.naturalWidth = data.naturalWidth;
      _this.naturalHeight = data.naturalHeight;
    }

    if (_this.imageUrl && !_this.$renderId) {
      _this.$renderId = _this.$id;
    }

    if (_this.imageUrl && (_this.imageUrl.startsWith('data:image') || _this.isGif || _this.isApng)) {
      _this.imageUrl = '';
    } // 优先获取 editorResourceMap 中的线上地址


    if (editorResourceMap.get(_this.$renderId)) {
      _this.imageUrl = editorResourceMap.get(_this.$renderId);
    } else if (_this.imageUrl) {
      editorResourceMap.set(_this.$renderId, _this.imageUrl);
    }

    _this.url = editorResourceMap.get(_this.url) || _this.url;

    if (!_this.$clipCache) {
      _this.setClipCache();
    }

    delete _this.effectedImage;
    delete _this.effectedImageWidth;
    delete _this.effectedImageHeight;
    delete _this.effectedImageOffsetLeft;
    delete _this.effectedImageOffsetTop;
    delete _this.imageWidth;
    delete _this.imageHeight;
    delete _this.originWidth;
    delete _this.originHeight;
    delete _this.clip;
    return _this;
  }

  var _proto = ImageBaseModel.prototype;

  _proto.setClipCache = function setClipCache() {
    this.$clipCache = {
      offsetX: this.imageTransform.position.x,
      offsetY: this.imageTransform.position.y,
      scaleX: this.imageTransform.scale.x,
      scaleY: this.imageTransform.scale.y,
      width: this.width,
      height: this.height
    };
  };

  _createClass(ImageBaseModel, [{
    key: "imageWidth",
    set: function set(v) {
      if (!this.$id) return;
      this.$imageWidth = v;
      console.error(new Error('imageWidth 字段已废弃, 需用 imageTransform.scaleX * naturalWidth 实现'));
    }
  }, {
    key: "imageHeight",
    set: function set(v) {
      if (!this.$id) return;
      this.$imageHeight = v;
      console.error(new Error('imageHeight 字段已废弃, 需用 imageTransform.scaleY * naturalHeight 实现'));
    }
  }, {
    key: "$imageWidth",
    get: function get() {
      return Math.abs(this.naturalWidth * this.imageTransform.scale.x);
    },
    set: function set(v) {
      if (!this.$id || !this.imageTransform.scale) return;
      var baseNum = this.imageTransform.scale.x < 0 ? -1 : 1;
      this.imageTransform.scale.x = v / this.naturalWidth * baseNum;
    }
  }, {
    key: "$imageHeight",
    get: function get() {
      return Math.abs(this.naturalHeight * this.imageTransform.scale.y);
    },
    set: function set(v) {
      if (!this.$id || !this.imageTransform.scale) return;
      var baseNum = this.imageTransform.scale.y < 0 ? -1 : 1;
      this.imageTransform.scale.y = v / this.naturalHeight * baseNum;
    }
  }, {
    key: "$imageLeft",
    get: function get() {
      var position = this.imageTransform.position,
          $imageWidth = this.$imageWidth,
          width = this.width;
      return width / 2 - $imageWidth / 2 + position.x;
    },
    set: function set(v) {
      if (!this.$id || !this.imageTransform.scale) return;
      this.imageTransform.position.x = v + this.$imageWidth / 2 - this.width / 2;
    }
  }, {
    key: "$imageTop",
    get: function get() {
      var position = this.imageTransform.position,
          $imageHeight = this.$imageHeight,
          height = this.height;
      return height / 2 - $imageHeight / 2 + position.y;
    },
    set: function set(v) {
      if (!this.$id || !this.imageTransform.scale) return;
      this.imageTransform.position.y = v + this.$imageHeight / 2 - this.height / 2;
    }
  }, {
    key: "hasComplexFilters",
    get: function get() {
      var filterInfo = this.filterInfo;
      return filterInfo && (filterInfo.url || filterInfo.prunedZipUrl);
    }
  }, {
    key: "hasBaseFilters",
    get: function get() {
      var filter = this.filter;
      var defaultFilter = editorDefaults.element.filter;
      if (!filter) return false;
      return Object.keys(filter).some(function (key) {
        return filter[key] !== defaultFilter[key];
      });
    }
  }, {
    key: "hasFilters",
    get: function get() {
      return this.hasBaseFilters || this.hasComplexFilters;
    }
  }, {
    key: "hasEffects",
    get: function get() {
      return !!(this.imageEffects || []).find(function (item) {
        return item.enable;
      }) || !!(this.shadows || []).find(function (item) {
        return item.enable;
      });
    }
  }, {
    key: "isGif",
    get: function get() {
      return this.resourceType === 'gif';
    }
  }, {
    key: "isApng",
    get: function get() {
      return this.resourceType === 'apng';
    }
  }, {
    key: "isVideo",
    get: function get() {
      return this.resourceType === 'video' || this.resourceType === 'mp4';
    }
  }, {
    key: "$renderProps",
    get: function get() {
      return [this.width, this.height, this.opacity, this.maskInfo.enable, this.imageTransform, this.imageEffects, this.shadows];
    }
  }]);

  return ImageBaseModel;
}(BaseModel);

export default ImageBaseModel;