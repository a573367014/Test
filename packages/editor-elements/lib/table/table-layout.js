import inherit from "@gaoding/editor-framework/lib/utils/vue-inherit";
import BaseElement from "@gaoding/editor-framework/lib/base/base-element";
import DesignTable from "./main/index.vue";
import elementDependence from "./mixins/element-dependence";
import fontBehavior from "./mixins/font-behavior";
import template from "./table-layout.html";
import "./table-layout.css";
export default inherit(BaseElement, {
  mixins: [elementDependence, fontBehavior],
  name: 'table-element',
  template: template,
  components: {
    DesignTable: DesignTable
  },
  methods: {
    // 这里会覆盖元素内部 baseElement 的 load 行为，用户做元素依赖资源的加载（字体）
    load: function load() {
      return Promise.all([this.loadFonts(), this.loadImage()]);
    }
  }
});