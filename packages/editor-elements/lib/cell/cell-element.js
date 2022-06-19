/**
 * EditorElementCell
 */
import utils from "@gaoding/editor-framework/lib/utils/utils";
import inherit from "@gaoding/editor-framework/lib/utils/vue-inherit";
import EditorElement from "@gaoding/editor-framework/lib/base/base-element";
import EditorElementCellTpl from "./element-cell.html";
/**
 * @class EditorElementCell
 */

export default inherit(EditorElement, {
  name: 'cell-element',
  template: EditorElementCellTpl,
  props: {
    renderModel: {
      type: Object,
      required: true
    }
  },
  data: function data() {
    return {
      // 鼠标拖拽图片经过该 cell
      dragOverActive: false
    };
  },
  computed: {
    imageUrl: function imageUrl() {
      var model = this.model,
          options = this.options;
      return utils.getComputedUrl(model.url, options.fitCrossOrigin);
    },
    cssStyle: function cssStyle() {
      var renderModel = this.renderModel,
          global = this.global;
      var zoom = global.zoom;
      return {
        height: renderModel.height * zoom + 'px',
        width: renderModel.width * zoom + 'px',
        transform: "translate3d(" + renderModel.left * zoom + "px, " + renderModel.top * zoom + "px, 0)"
      };
    },
    imageStyle: function imageStyle() {
      var opacity = this.opacity,
          transform = this.transform;
      return {
        transform: transform.toString(),
        opacity: opacity
      };
    },
    borderRadius: function borderRadius() {
      var zoom = this.global.zoom;
      var borderRadius = this.model.borderRadius;
      var _this$renderModel = this.renderModel,
          width = _this$renderModel.width,
          height = _this$renderModel.height;
      var minSize = Math.min(width, height) * zoom;
      return {
        borderRadius: minSize * borderRadius / 2 + "px"
      };
    },
    background: function background() {
      return {
        backgroundColor: this.model.backgroundColor
      };
    },
    viewBox: function viewBox() {
      var renderModel = this.renderModel;
      return [0, 0, renderModel.width, renderModel.height].join(' ');
    },
    imageRect: function imageRect() {
      var model = this.model,
          imageFillMode = this.imageFillMode;
      var _this$renderModel2 = this.renderModel,
          width = _this$renderModel2.width,
          height = _this$renderModel2.height;
      var imageWidth = model.imageWidth,
          imageHeight = model.imageHeight,
          transform = model.transform,
          offset = model.offset,
          zoom = model.zoom,
          rotate = model.rotate;
      var dirRotated = rotate === 90 || rotate === 270 || rotate === -90 || rotate === -270;

      var _imageWidth = imageWidth || width;

      var _imageHeight = imageHeight || height; // 图片朝向改变


      if (dirRotated) {
        _imageWidth = imageHeight;
        _imageHeight = imageWidth;
      }

      var $width;
      var $height;
      var x;
      var y;

      if (imageFillMode === 'cover') {
        var widthRatio = width / _imageWidth;
        var heightRatio = height / _imageHeight;
        var imageRatio = _imageWidth / _imageHeight;

        if (widthRatio >= heightRatio) {
          $width = width;
          $height = $width / imageRatio;
        } else {
          $height = height;
          $width = $height * imageRatio;
        }
      } else {
        $width = _imageWidth;
        $height = _imageHeight;
      } // 图片的渲染宽高


      $width *= zoom;
      $height *= zoom;
      var dx = 0;
      var dy = 0;
      dx = width / 2 - $width / 2;
      dy = height / 2 - $height / 2;
      var offsetMakeup = {
        x: 0,
        y: 0
      };

      if (dirRotated) {
        var _width = $width;
        $width = $height;
        $height = _width;

        if (rotate === 90 || rotate === -270) {
          offsetMakeup.y = -$height;
          dy = $height / 2 - width / 2;
          dx = height / 2 - $width / 2;
        } else if (rotate === 270 || rotate === -90) {
          offsetMakeup.x = -$width;
          dy = width / 2 - $height / 2;
          dx = $width / 2 - height / 2;
        }
      } else if (rotate === 180 || rotate === -180) {
        offsetMakeup.y = -$height;
        offsetMakeup.x = -$width;
        dx = $width / 2 - width / 2;
        dy = $height / 2 - height / 2;
      }

      var imgWidth = $width;
      var imgHeight = $height;

      if (dirRotated) {
        imgHeight = $width;
        imgWidth = $height;
      }

      var maxDx = Math.abs(imgWidth / 2 - width / 2);
      var maxDy = Math.abs(imgHeight / 2 - height / 2);
      var _maxDx = maxDx;
      var _maxDy = maxDy;

      if (dirRotated) {
        _maxDx = maxDy;
        _maxDy = maxDx;
      }

      _maxDx = _maxDx / zoom;
      _maxDy = _maxDy / zoom;

      if (offset.x < -_maxDx) {
        offset.x = -_maxDx;
      } else if (offset.x > _maxDx) {
        offset.x = _maxDx;
      }

      if (offset.y < -_maxDy) {
        offset.y = -_maxDy;
      } else if (offset.y > _maxDy) {
        offset.y = _maxDy;
      }

      x = dx + offset.x * transform.scale.x * zoom + offsetMakeup.x * transform.scale.x;
      y = dy + offset.y * transform.scale.y * zoom + offsetMakeup.y * transform.scale.y;

      if (this.model.scaleX === -1) {
        if (rotate === 0 || rotate === 90 || rotate === -270) {
          x = -x - $width;
        } else if (rotate === 180 || rotate === 270 || rotate === -180 || rotate === -90) {
          x = $width - x;
        }
      }

      if (this.model.scaleY === -1) {
        if (rotate === 0) {
          y = -y - $height;
        } else if (rotate === 90 || rotate === -270 || rotate === 180 || rotate === -180) {
          y = -(y - $height);
        } else if (rotate === 270 || rotate === -90) {
          y = -($height + y);
        }
      }

      model.$width = $width;
      model.$height = $height;
      var rect = {
        width: $width,
        height: $height,
        x: x,
        y: y
      };
      return rect;
    },
    elementEmpty: function elementEmpty() {
      return !this.imageUrl && !this.model.backgroundColor;
    },
    imageFillMode: function imageFillMode() {
      return this.model.mode || 'cover';
    }
  },
  methods: {
    /**
     * 加载图片
     * @memberof
     */
    load: function load() {
      var _this = this;

      var url = this.model.url;

      if (!url) {
        return Promise.resolve();
      } //  TODO: 滤镜功能


      return utils.loadImage(url, this.options.fitCrossOrigin).then(function (img) {
        var model = _this.model;
        model.imageWidth = img.naturalWidth;
        model.imageHeight = img.naturalHeight;
        model.offset = Object.assign({
          x: 0,
          y: 0
        }, model.offset);
        return img;
      });
    },
    zoomTo: function zoomTo(zoom) {
      if (zoom < 1 || zoom > 2) return;
      this.model.zoom = zoom;
      this.$events.$emit('element.editApply', this.model, false);
    },
    rotateImage: function rotateImage(deg) {
      if (deg >= 360) {
        deg = deg - 360;
      } else if (deg <= -360) {
        deg = deg + 360;
      }

      this.model.rotate = Math.floor(deg);
      this.$events.$emit('element.editApply', this.model, false);
    }
  },
  watch: {
    'model.url': function modelUrl() {
      this.checkLoad();
      this.model.offset.x = 0;
      this.model.offset.y = 0;

      if (!this.model.url) {
        this.model.zoom = 1;
        this.model.scaleX = 1;
        this.model.scaleY = 1;
        this.model.rotate = 0;
      }
    },
    'model.backgroundColor': function modelBackgroundColor() {
      if (this.model.backgroundColor) {
        this.model.url = '';
        this.$events.$emit('element.editApply', this.model, false);
      }
    },
    'model.rotate': function modelRotate() {
      this.model.offset.x = 0;
      this.model.offset.y = 0;
      this.model.zoom = 1;
    }
  },
  mounted: function mounted() {
    this.model.$resizeLimit = true;

    this.model.$getResizeLimit = function () {
      return {
        maxWidth: Infinity,
        minWidth: 2,
        maxHeight: Infinity,
        minHeight: 2
      };
    };
  },
  events: {
    'editor.cell.zoom': function editorCellZoom(cell, zoom) {
      if (this.model !== cell || typeof zoom !== 'number') return;
      this.zoomTo(zoom);
    },
    'editor.cell.flip': function editorCellFlip(cell, dir) {
      if (this.model !== cell || !dir) return;
      var name = dir === 'x' ? 'scaleX' : 'scaleY';
      cell[name] = cell[name] * -1;
      this.$events.$emit('element.editApply', this.model, false);
    },
    'editor.cell.rotate': function editorCellRotate(cell, deg) {
      if (this.model !== cell || typeof deg !== 'number') return;
      this.rotateImage(deg);
    },
    'editor.cell.dragover': function editorCellDragover(cell) {
      this.dragOverActive = this.model === cell;
    }
  }
});