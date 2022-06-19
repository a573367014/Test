import _extends from "@babel/runtime/helpers/extends";
import inherit from "@gaoding/editor-framework/lib/utils/vue-inherit";
import BaseElement from "@gaoding/editor-framework/lib/base/base-element";
import { textBase } from "../text/text-base";
import template from "./effect-text-element.html";
var TextBaseElement = inherit(BaseElement, _extends({}, textBase, {
  events: {}
}));
export default inherit(TextBaseElement, {
  template: template,
  data: function data() {
    return {
      ratio: 1
    };
  },
  computed: {
    cssStyle: function cssStyle() {
      var rect = this.rect,
          model = this.model;
      return {
        height: rect.height + 'px',
        width: rect.width + 'px',
        transform: this.transform.toString(),
        left: rect.left + 'px',
        top: rect.top + 'px',
        opacity: this.opacity,
        overflow: model.resize === 7 ? 'hidden' : 'visible'
      };
    }
  },
  methods: {
    loadFont: function loadFont(name) {
      var superMethods = textBase.methods;
      return superMethods.load.call(this, name);
    },
    updateRect: function updateRect() {
      var model = this.model;
      var zoom = this.global.zoom; // rect 为隐藏文本元素宽高

      var rect = this.getRect();
      var height = rect.height / zoom;
      var width = rect.width / zoom; // 延迟调用 updateRect 时，dom 可能并不存在，getRect 获取的宽高可能为 0

      if (!(height > 0 && width > 0) || !this.$refs.textInner) return;

      if (Math.abs(width - model.$typoWidth) > 0.1) {
        model.$typoWidth = width;
      }

      if (Math.abs(height - model.$typoHeight) > 0.1) {
        model.$typoHeight = height;
      }

      if (model.$editing) {
        model.width = width;
        model.height = height;
      }
    }
  }
});