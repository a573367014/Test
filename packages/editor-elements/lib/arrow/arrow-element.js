import Promise from 'bluebird';
import inherit from "@gaoding/editor-framework/lib/utils/vue-inherit";
import BaseElement from "@gaoding/editor-framework/lib/base/base-element";
import template from "./arrow-element.html";
import utils from "@gaoding/editor-framework/lib/utils/utils";
export default inherit(BaseElement, {
  name: 'arrow-element',
  template: template,
  data: function data() {
    return {
      scale: 1,
      headSvgContent: '',
      tailSvgContent: ''
    };
  },
  computed: {
    mainInnerStyle: function mainInnerStyle() {
      var model = this.model;
      var $originalScale = model.$originalScale || 1;
      return {
        transform: "scale(" + this.global.zoom * model.$minScale * $originalScale + ")",
        transformOrigin: '0 0'
      };
    },
    headStyle: function headStyle() {
      var model = this.model;
      return {
        fill: model.color,
        left: model.$headLeft + 'px',
        top: model.head.top + 'px'
      };
    },
    tailStyle: function tailStyle() {
      var model = this.model;
      return {
        fill: model.color,
        left: model.tail.left + 'px',
        top: model.tail.top + 'px'
      };
    },
    trunkStyle: function trunkStyle() {
      var model = this.model;
      return {
        left: model.trunk.left + 'px',
        top: model.trunk.top + 'px'
      };
    },
    trunkPath: function trunkPath() {
      var model = this.model;
      var higherLeft = model.trunk.leftHeight > model.trunk.rightHeight;
      var startY = higherLeft ? 0 : model.tail.top - model.trunk.top - (model.trunk.leftHeight - model.tail.height) / 2;
      var endY = higherLeft ? model.head.top - model.trunk.top - (model.trunk.rightHeight - model.head.height) / 2 : 0;
      return "M0 " + startY + " L" + model.$trunkWidth + " " + endY + " V" + (endY + model.trunk.rightHeight) + " L0 " + (startY + model.trunk.leftHeight);
    }
  },
  methods: {
    // load() {
    //     return Promise.resolve();
    // },
    load: function load() {
      var _this = this;

      var model = this.model;
      var head = model.head,
          tail = model.tail;
      var promiseArr = [];

      if (!head.svg.includes('<svg')) {
        promiseArr.push(utils.loadXMLStr(head.svg).then(function (xml) {
          head.$svg = xml;
        }));
      } else {
        head.$svg = '';
      }

      if (!tail.svg.includes('<svg')) {
        promiseArr.push(utils.loadXMLStr(tail.svg).then(function (xml) {
          tail.$svg = xml;
        }));
      } else {
        tail.$svg = '';
      }

      return Promise.all(promiseArr).then(function () {
        _this.parse();
      });
    },
    parse: function parse() {
      var model = this.model;
      var svgReg = /(^\s*<svg[^<]*>)|(<\/svg[^<]*>\s*$)/g;
      this.headSvgContent = (model.head.$svg || model.head.svg).replace(svgReg, '');
      this.tailSvgContent = (model.tail.$svg || model.tail.svg).replace(svgReg, '');
    }
  },
  watch: {
    'model.head.svg': function modelHeadSvg() {
      this.checkLoad();
    },
    'model.tail.svg': function modelTailSvg() {
      this.checkLoad();
    }
  },
  mounted: function mounted() {}
});