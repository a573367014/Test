import _extends from "@babel/runtime/helpers/extends";
import Promise from 'bluebird';
import inherit from "@gaoding/editor-framework/lib/utils/vue-inherit";
import BaseElement from "@gaoding/editor-framework/lib/base/base-element";
import template from "./line-element.html";
export default inherit(BaseElement, {
  name: 'line-element',
  template: template,
  data: function data() {
    return {};
  },
  computed: {
    cssStyle: function cssStyle() {
      var model = this.model,
          global = this.global;
      return {
        height: Math.max(1, model.strokeWidth * global.zoom) + 'px'
      };
    },
    shapeAttr: function shapeAttr() {
      var model = this.model,
          shapeStyle = this.shapeStyle;
      var x1 = 0;
      var x2 = model.width;

      if (shapeStyle.strokeLinecap === 'round') {
        x1 = model.strokeWidth / 2;
        x2 = model.width - model.strokeWidth / 2;
      }

      return {
        x1: x1,
        x2: x2,
        y1: model.strokeWidth / 2,
        y2: model.strokeWidth / 2
      };
    },
    shapeStyle: function shapeStyle() {
      var model = this.model;
      var strokeLineStyle = {};

      if (model.strokeLineStyle === 'dashed') {
        strokeLineStyle.strokeDasharray = model.strokeWidth * 2 + " " + model.strokeWidth;

        if (model.strokeDasharray.length) {
          strokeLineStyle.strokeDasharray = model.strokeDasharray.map(function (val) {
            return val * model.strokeWidth;
          }).join(' ');
        }
      } else if (model.strokeLineStyle === 'dotted') {
        strokeLineStyle.strokeLinecap = 'round';
        strokeLineStyle.strokeDasharray = "0 " + model.strokeWidth * 2;

        if (model.strokeDasharray.length) {
          strokeLineStyle.strokeDasharray = model.strokeDasharray.map(function (val, i) {
            if (i % 2 === 0) {
              return val * model.strokeWidth - model.strokeWidth;
            }

            return val * model.strokeWidth * 2;
          }).join(' ');
        }
      } else {
        strokeLineStyle.strokeLinecap = 'round';
      }

      return _extends({}, strokeLineStyle, {
        stroke: model.stroke,
        strokeWidth: model.strokeWidth,
        fill: 'none'
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
        minWidth: _this.model.strokeWidth * _this.editor.zoom,
        maxHeight: Infinity,
        minHeight: _this.model.strokeWidth * _this.editor.zoom
      };
    };
  }
});