import _extends from "@babel/runtime/helpers/extends";
import Promise from 'bluebird';
import inherit from "@gaoding/editor-framework/lib/utils/vue-inherit";
import BaseElement from "@gaoding/editor-framework/lib/base/base-element";
import template from "./rect-element.html";
export default inherit(BaseElement, {
  name: 'rect-element',
  template: template,
  data: function data() {
    return {};
  },
  computed: {
    shapeAttr: function shapeAttr() {
      var model = this.model;
      var radius = model.radius;
      var w = Math.round(model.width - model.strokeWidth);
      var h = Math.round(model.height - model.strokeWidth);

      if (w < 2 * radius) {
        radius = w / 2;
      }

      if (h < 2 * radius) {
        radius = h / 2;
      } // chrome 整数时有概率出现消失异常


      radius = radius ? radius + 0.01 : 0;
      var result = {
        x: model.strokeWidth / 2,
        y: model.strokeWidth / 2,
        rx: radius,
        ry: radius,
        width: Math.max(model.strokeWidth + 1, model.width - model.strokeWidth),
        height: Math.max(model.strokeWidth + 1, model.height - model.strokeWidth)
      };
      return result;
    },
    shapeStyle: function shapeStyle() {
      var model = this.model;
      var strokeLineStyle = {};

      if (model.strokeLineStyle === 'dashed') {
        strokeLineStyle.strokeDasharray = model.strokeWidth * 2 + " " + model.strokeWidth;
      } else if (model.strokeLineStyle === 'dotted') {
        strokeLineStyle.strokeLinecap = 'round';
        strokeLineStyle.strokeDasharray = "0 " + model.strokeWidth * 2;
      }

      return _extends({}, strokeLineStyle, {
        stroke: model.stroke,
        strokeWidth: model.strokeWidth,
        fill: model.fill || 'transparent'
      });
    }
  },
  methods: {
    load: function load() {
      return Promise.resolve();
    }
  },
  mounted: function mounted() {
    var _this = this;

    this.model.$getResizeLimit = function () {
      return {
        maxWidth: Infinity,
        minWidth: (_this.model.strokeWidth * 2 + 1) * _this.editor.zoom,
        maxHeight: Infinity,
        minHeight: (_this.model.strokeWidth * 2 + 1) * _this.editor.zoom
      };
    };
  }
});