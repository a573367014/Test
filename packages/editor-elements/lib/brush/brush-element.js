import _extends from "@babel/runtime/helpers/extends";
import Promise from 'bluebird';
import inherit from "@gaoding/editor-framework/lib/utils/vue-inherit";
import BaseElement from "@gaoding/editor-framework/lib/base/base-element";
import template from "./brush-element.html";
export default inherit(BaseElement, {
  name: 'brush-element',
  template: template,
  data: function data() {
    return {};
  },
  computed: {
    shapeStyle: function shapeStyle() {
      var model = this.model;
      var strokeLineStyle = {};
      var strokeWidth = Math.max(1, model.strokeWidth);

      if (model.strokeLineStyle === 'dashed') {
        strokeLineStyle.strokeDasharray = strokeWidth * 2 + " " + strokeWidth;

        if (model.strokeDasharray.length) {
          strokeLineStyle.strokeDasharray = model.strokeDasharray.map(function (val) {
            return val * strokeWidth;
          }).join(' ');
        }
      } else if (model.strokeLineStyle === 'dotted') {
        strokeLineStyle.strokeLinecap = 'round';
        strokeLineStyle.strokeDasharray = "0 " + strokeWidth * 2;

        if (model.strokeDasharray.length) {
          strokeLineStyle.strokeDasharray = model.strokeDasharray.map(function (val, i) {
            if (i % 2 === 0) {
              return val * strokeWidth - strokeWidth;
            }

            return val * strokeWidth * 2;
          }).join(' ');
        }
      } else {
        strokeLineStyle.strokeLinecap = 'round';
      }

      return _extends({}, strokeLineStyle, {
        stroke: model.stroke,
        strokeWidth: strokeWidth
      });
    },
    path: function path() {
      return this.model.path;
    }
  },
  methods: {
    load: function load() {
      return Promise.resolve();
    }
  }
});