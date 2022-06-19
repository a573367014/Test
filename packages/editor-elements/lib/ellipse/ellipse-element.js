import _extends from "@babel/runtime/helpers/extends";
import Promise from 'bluebird';
import inherit from "@gaoding/editor-framework/lib/utils/vue-inherit";
import BaseElement from "@gaoding/editor-framework/lib/base/base-element";
import template from "./ellipse-element.html";
export default inherit(BaseElement, {
  name: 'ellipse-element',
  template: template,
  data: function data() {
    return {};
  },
  computed: {
    shapeAttr: function shapeAttr() {
      var model = this.model;
      var centerX = model.width / 2;
      var centerY = model.height / 2;
      return {
        cx: centerX,
        cy: centerY,
        rx: model.width / 2 - model.strokeWidth / 2,
        ry: model.height / 2 - model.strokeWidth / 2
      };
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