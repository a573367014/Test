import _extends from "@babel/runtime/helpers/extends";
import _escapeRegExp from "lodash/escapeRegExp";
import _cloneDeep from "lodash/cloneDeep";
import _merge from "lodash/merge";
import _isEmpty from "lodash/isEmpty";
import _forEach from "lodash/forEach";
import $ from "@gaoding/editor-utils/lib/zepto";
import tinycolor from 'tinycolor2';
import utils from "@gaoding/editor-framework/lib/utils/utils";
import inherit from "@gaoding/editor-framework/lib/utils/vue-inherit";
import BaseElement from "@gaoding/editor-framework/lib/base/base-element";
import { isGroup } from "@gaoding/editor-utils/lib/element";
import template from "./svg-element.html";
import { initMaskInfo, debounceUpdateMaskInfo } from "@gaoding/editor-framework/lib/static/mask-wrap/utils";
export default inherit(BaseElement, {
  name: 'svg-element',
  template: template,
  data: function data() {
    return {
      svg: null,
      isContainer: false,
      viewBox: [null, null, null, null],
      boxes: {
        container: null,
        nw: null,
        n: null,
        ne: null,
        w: null,
        c: null,
        e: null,
        sw: null,
        s: null,
        se: null
      },
      errorMessage: ''
    };
  },
  computed: {
    // 解决同一个页面内存在多个 layout 导致 svg defs 里面的 id 重复
    tempId: function tempId() {
      return String(this.model.$id).replace(/[^\w]/g, '').substr(0, 4) + Math.floor(Math.random() * 1000);
    },
    isDesign: function isDesign() {
      return this.options.mode === 'design' || this.options.mode === 'flow';
    },
    supportTransform: function supportTransform() {
      return !!this.model.containerTransform;
    },
    cssStyle: function cssStyle() {
      var rect = this.rect;
      var padding = rect.padding;
      return {
        height: rect.height + padding[0] + padding[2] + 'px',
        width: rect.width + padding[1] + padding[3] + 'px'
      };
    }
  },
  methods: {
    load: function load() {
      var model = this.model;
      var content = model.content,
          url = model.url; // initMaskInfo(this.model, this.editor);

      if (content) {
        return utils.parseXML(content);
      }

      return utils.loadXML(url);
    },
    buildSvg: function buildSvg(xml) {
      xml = $(xml);
      this.fixSvgAttrs(xml);
      var rColorProps = /(fill|stroke|stop-color)="([^{}]*?)"/g;
      var rColorAttrs = /(fill|stroke|stop-color)="{{(.*?)}}"/g;
      var html = this.serializeXML(xml[0]); // 避免前端出图失败

      html = html.replace(/xmlns:xlink="http[^"]*"/g, ''); // Vue 解析模板会忽略嵌入的 style 标签，用 <svg:style></svg:style> 避免

      html = html.replace(/(<\/?)style>/gi, '$1svg:style>'); // 多个 SVG 处于同一 DOM 环境下时会导致 id/class 冲突，规避处理

      var uniqueKeyBlocks = new Set();
      var tmpId = this.tempId;
      html = html.replace(/\s(id|class)=(['"])([^'"]+)\2/g, function (a, key, c, val) {
        uniqueKeyBlocks.add("" + (key === 'id' ? '#' : '.') + val);
        return " " + key + "=\"" + val + "_" + tmpId + "\"";
      });
      Array.from(uniqueKeyBlocks).forEach(function (k) {
        var re = new RegExp(_escapeRegExp(k) + '([)\\b\\s\'"])', 'g');
        html = html.replace(re, function (a, brackets) {
          return k + "_" + tmpId + brackets;
        });
      }); // 安卓浏览器显示异常，避免存在 hex8 色值

      html = html.replace(rColorProps, function (str, key, value) {
        if (!value || !tinycolor(value).isValid()) return str;
        return key + "=\"" + tinycolor(value).toString('rgb') + "\"";
      }); // 兼容 Vue2
      // 示例形如 fill="{{colors['aaa']}}" => :fill="rgbacolors['aaa']"

      html = html.replace(rColorAttrs, ' :$1="rgba$2"'); // 元素只具备 url 属性时存储 XML 内容

      this.model.$content = html;
      this.errorMessage = '';
      this.loading = false; // 将未添加变换的原始 SVG 插入 Element 所在 DOM 中

      var panel = $('.element-main', this.$el);
      panel.html(html); // Vue constructor shim

      var Vue = this.constructor;

      while (Vue.super) {
        Vue = Vue.super;
      } // 初始化 BBox


      this.viewBox = ($(html).filter('svg').attr('viewBox') || $(html).find('svg').attr('viewBox') || '0 0 0 0').split(' ').map(function (x) {
        return parseInt(x, 10);
      });

      if (this.isContainer) {
        this.boxes = this.getBBoxes();
      }

      var elementVM = this; // 用于控制 SVG 变化的子级动态 Vue 组件

      var svgVM = {
        tempId: this.tempId,
        isContainer: this.isContainer,
        el: panel[0],
        // 这里需要浅拷贝，否者 model 上 __ob__.vmCount > 0，会被识别成 vue 实例，导致其他问题
        computed: {
          width: function width() {
            return elementVM.model.width;
          },
          height: function height() {
            return elementVM.model.height;
          },
          containerTransform: function containerTransform() {
            return elementVM.model.containerTransform;
          },
          rgbacolors: function rgbacolors() {
            if (!elementVM.model.colors) return {};
            return Object.keys(elementVM.model.colors).reduce(function (obj, key) {
              var _extends2;

              var color = tinycolor(elementVM.model.colors[key]);
              return _extends({}, obj, (_extends2 = {}, _extends2[key] = color.toRgbString(), _extends2));
            }, {});
          }
        },
        methods: {
          // 从父级 ElementSVG 组件中获取变换 box 参数
          // 配合该 SVG Vue 实例中获取当前变换参数
          // 以生成各 grid 最终 SVG 变换配置
          getComputedTransform: function getComputedTransform(dir) {
            if (!this.containerTransform) {
              return null;
            }

            var _this$containerTransf = this.containerTransform[dir],
                sx = _this$containerTransf.sx,
                sy = _this$containerTransf.sy,
                tx = _this$containerTransf.tx,
                ty = _this$containerTransf.ty;
            var box = elementVM.boxes[dir];

            if (!box) {
              return null;
            }

            var mx = box.x + box.width / 2,
                my = box.y + box.height / 2; // TODO 合并变换矩阵

            return "translate(" + tx + " " + ty + ") translate(" + mx + " " + my + ") scale(" + sx + " " + sy + ") translate(" + -mx + " " + -my + ")";
          },
          grapHack: function grapHack(num) {
            var _this = this;

            // 解决 svg 拼接缝隙
            if (this.$options.isContainer) {
              var data = {
                nw: "translate(" + num + ", " + num + ")",
                sw: "translate(" + num + ", -" + num + ")",
                n: "translate(0, " + num + ")",
                s: "translate(0, -" + num + ")",
                ne: "translate(-" + num + ", " + num + ")",
                se: "translate(-" + num + ", -" + num + ")",
                w: "translate(" + num + ", 0)",
                c: 'translate(0, 0)',
                e: "translate(-" + num + ", 0)"
              };
              ['se', 's', 'sw', 'e', 'c', 'w', 'ne', 'n', 'nw'].forEach(function (dir) {
                var className = ".editor-svg-" + dir + "_" + _this.$options.tempId;
                $(className, _this.$el).attr('transform', data[dir]);
              });
            }
          }
        },
        mounted: function mounted() {// this.$watch('containerTransform.scale', {
          //     immediate: true,
          //     handler() {
          //         this.grapHack(1);
          //     }
          // });
        }
      };

      if (this.isContainer) {
        svgVM.computed = {
          viewBox: function viewBox() {
            var _elementVM$viewBox = elementVM.viewBox,
                x1 = _elementVM$viewBox[0],
                y1 = _elementVM$viewBox[1];
            return x1 + " " + y1 + " " + (x1 + this.width) + " " + (y1 + this.height);
          },
          tScale: function tScale() {
            if (!this.containerTransform) {
              return null;
            }

            return "scale(" + this.containerTransform.scale + ")";
          },
          tNW: function tNW() {
            return this.getComputedTransform('nw');
          },
          tN: function tN() {
            return this.getComputedTransform('n');
          },
          tNE: function tNE() {
            return this.getComputedTransform('ne');
          },
          tW: function tW() {
            return this.getComputedTransform('w');
          },
          tC: function tC() {
            return this.getComputedTransform('c');
          },
          tE: function tE() {
            return this.getComputedTransform('e');
          },
          tS: function tS() {
            return this.getComputedTransform('s');
          },
          tSE: function tSE() {
            return this.getComputedTransform('se');
          },
          tSW: function tSW() {
            return this.getComputedTransform('sw');
          }
        };
      }

      elementVM.svg = new Vue(svgVM); // clean

      elementVM.$on('destroy', function () {
        if (elementVM.svg) {
          elementVM.svg.$destroy(true, true);
        }
      });
    },
    fixSvgAttrs: function fixSvgAttrs(xml) {
      var _this2 = this;

      var model = this.model;
      var customColorClass = '.editor-props-color'; // 需保留的属性

      var propParsers = {
        xmlns: String,
        preserveAspectRatio: String,
        viewBox: String,
        x: parseInt,
        y: parseInt
      };
      var uid = 0;
      var colors = {};
      var colorsMap = {};

      var addCustomColor = function addCustomColor(node, name) {
        var val = node.getAttribute(name);
        var k = colorsMap[val];

        if (!k) {
          k = colorsMap[val] = 'color_p_' + ++uid;
          colors[k] = val;
        }

        node.setAttribute(":" + name, "colors." + k);
      };

      xml.children('svg').each(function (i, node) {
        node = $(node);
        var attributes = [].slice.call(node[0].attributes); // svg attrs fix

        _forEach(attributes, function (item) {
          var prop = item.name;

          if (propParsers[prop]) {
            var parser = propParsers[prop];
            var val = parser(node.attr(prop));
            node.attr(prop, val);
          } else {
            node.removeAttr(prop);
          }
        }); // custom colors


        node.find(customColorClass).each(function (i, node) {
          // svg color props:
          // fill, stroke, stop-color(xGradient)
          if (node.hasAttribute('fill')) {
            addCustomColor(node, 'fill');
          }

          if (node.hasAttribute('stroke')) {
            addCustomColor(node, 'stroke');
          }
        });
        node.attr(':width', 'Math.max(1, width)');
        node.attr(':height', 'Math.max(1, height)');
        _this2.isContainer = !!node.has('.editor-svg-container').length;

        if (_this2.isContainer) {
          node.attr(':view-box.camel', 'viewBox');
          node.find('.editor-svg-container').each(function (i, container) {
            $(container).attr(':transform', 'tScale');
          });
          var dirs = ['nw', 'n', 'ne', 'w', 'c', 'e', 'sw', 's', 'se'];
          dirs.forEach(function (dir) {
            var computedName = 't' + dir.toUpperCase();
            node.find(".editor-svg-" + dir + " *").each(function (i, grid) {
              $(grid).attr(':transform', computedName);
            });
          });
        }
      }); // set props colors

      if (!_isEmpty(colors)) {
        model.colors = _merge(colors, model.colors);
      }
    },
    getBBox: function getBBox(name) {
      var className = "editor-svg-" + name + "_" + this.tempId;
      var el = this.$el.getElementsByClassName(className);
      return el[0] && el[0].getBBox();
    },
    getContainerBBox: function getContainerBBox() {
      return {
        width: this.model.width,
        height: this.model.height,
        x: this.left,
        y: this.top
      };
    },
    getBBoxes: function getBBoxes() {
      var getBBox = this.getBBox,
          getContainerBBox = this.getContainerBBox;
      return {
        container: getContainerBBox(),
        se: getBBox('se'),
        s: getBBox('s'),
        sw: getBBox('sw'),
        e: getBBox('e'),
        c: getBBox('c'),
        w: getBBox('w'),
        ne: getBBox('ne'),
        n: getBBox('n'),
        nw: getBBox('nw')
      };
    },
    setTransform: function setTransform(dir, key, value) {
      var containerTransform = this.model.containerTransform;

      if (!containerTransform || !containerTransform[dir]) {
        return;
      }

      containerTransform[dir][key] = value;
    },
    resizeInit: function resizeInit(dir) {
      if (!this.isContainer) {
        return;
      }

      this.$svgResizeMeta = {
        dir: dir,
        originalBoxes: this.boxes,
        currentBoxes: this.getBBoxes(),
        containerTransform: _cloneDeep(this.model.containerTransform),
        width: this.model.width,
        height: this.model.height
      };
    },
    resizeEnd: function resizeEnd() {
      delete this.$svgResizeMeta;
    },
    setScale: function setScale(value) {
      if (!this.model.containerTransform) {
        return;
      }

      this.model.containerTransform.scale = value;
    },
    setSize: function setSize(_ref) {
      var dir = _ref.dir,
          dx = _ref.dx,
          dy = _ref.dy;
      var $svgResizeMeta = this.$svgResizeMeta,
          setTransform = this.setTransform,
          setScale = this.setScale;
      var _this$model = this.model,
          $minWidth = _this$model.$minWidth,
          $minHeight = _this$model.$minHeight;

      if (!$svgResizeMeta) {
        return;
      } // originalBoxes 为 SVG 元素未加变换时的 BBox 集合
      // currentBoxes 为拖拽开始时经变换后的 BBox 集合
      // currentTransform 为拖拽开始时的变换参数


      var containerTransform = $svgResizeMeta.containerTransform,
          originalBoxes = $svgResizeMeta.originalBoxes,
          currentBoxes = $svgResizeMeta.currentBoxes;

      if (!containerTransform) {
        return;
      }

      var currentTransform = containerTransform;
      var currentScale = currentTransform.scale;

      if ($minWidth) {
        dx = Math.max($minWidth - currentBoxes.container.width, dx);
      }

      if ($minHeight) {
        dy = Math.max($minHeight - currentBoxes.container.height, dy);
      } // 横向缩放时，分别更改九宫格中部与右侧组变换参数


      if (dir === 'w' || dir === 'e') {
        var middleGroup = ['n', 'c', 's'];
        middleGroup.forEach(function (dir) {
          var baseTx = currentTransform[dir].tx;
          var originalWidth = originalBoxes[dir].width;
          var baseWidth = currentBoxes[dir].width;
          setTransform(dir, 'sx', (baseWidth + dx / currentScale) / originalWidth);
          setTransform(dir, 'tx', baseTx + dx / currentScale / 2);
        });
        var rightGroup = ['ne', 'e', 'se'];
        rightGroup.forEach(function (dir) {
          var baseTx = currentTransform[dir].tx;
          setTransform(dir, 'tx', baseTx + dx / currentScale);
        });
      } // 纵向缩放时，分别更改九宫格中部与下侧组变换参数
      else if (dir === 'n' || dir === 's') {
        var _middleGroup = ['w', 'c', 'e'];

        _middleGroup.forEach(function (dir) {
          var baseTy = currentTransform[dir].ty;
          var originalHeight = originalBoxes[dir].height;
          var baseHeight = currentBoxes[dir].height;
          setTransform(dir, 'sy', (baseHeight + dy / currentScale) / originalHeight);
          setTransform(dir, 'ty', baseTy + dy / currentScale / 2);
        });

        var bottomGroup = ['sw', 's', 'se'];
        bottomGroup.forEach(function (dir) {
          var baseTy = currentTransform[dir].ty;
          setTransform(dir, 'ty', baseTy + dy / currentScale);
        });
      } // 等比缩放时，更改九宫格父级 scale 参数
      else if (dir.length === 2) {
        var currentWidth = currentBoxes.container.width;
        var scale = (currentWidth + dx) / (currentWidth / currentTransform.scale);
        setScale(scale);
      }
    },
    serializeXML: function serializeXML(xml) {
      var str = '';

      if (window.XMLSerializer) {
        str = new XMLSerializer().serializeToString(xml);
      } else {
        str = xml.xml;
      } // 存在 <-- xml ..... --> 声明或注释时，会导致 vue 模板解析异常


      var index = str.replace(/<\s*svg/i, '<svg').indexOf('<svg');
      return str.slice(Math.max(0, index));
    },
    render: function render() {
      var _this3 = this;

      this.load().then(function (xml) {
        _this3.buildSvg(xml);
      }).catch(function (err) {
        _this3.errorMessage = err.message;
      }).then(function () {
        return _this3.checkLoad();
      }).then(function () {
        return initMaskInfo(_this3.model, _this3.editor);
      });
    }
  },
  events: {
    'group.contentScale': function groupContentScale(model, ratio) {
      var _this4 = this;

      var parentModel = this.$parent.model;

      if (parentModel !== model) {
        return;
      }

      var _this$model2 = this.model,
          width = _this$model2.width,
          height = _this$model2.height;
      this.$scaling = true;
      this.resizeInit('se');
      this.setSize({
        dir: 'se',
        dx: width * (ratio - 1),
        dy: height * (ratio - 1)
      });
      this.resizeEnd();
      setTimeout(function () {
        delete _this4.$scaling;
      }, 0);
    },
    'element.transformStart': function elementTransformStart(model, data) {
      if (!this.supportTransform) {
        return;
      } // 变换仅支持 SVG 元素单独生效，及其作为 group 子元素时生效的情形


      if (!(model === this.model) && !(isGroup(model) && model.elements.indexOf(this.model) > -1)) {
        return;
      }

      var _this$getBBoxes = this.getBBoxes(),
          container = _this$getBBoxes.container,
          n = _this$getBBoxes.n,
          w = _this$getBBoxes.w;

      var scale = this.model.containerTransform.scale;

      if (!container || !n || !w) {
        return;
      }

      if (data.dir && data.dir.length === 1) {
        this.model.$minWidth = container.width - n.width * scale;
        this.model.$minHeight = container.height - w.height * scale;
      } else if (data.dir && data.dir.length === 2) {
        // 最小宽度 10，避免选不中
        this.model.$minWidth = 10;
        this.model.$minHeight = this.model.$minWidth * (container.height / container.width);
      }

      this.resizeInit(data.dir);
    },
    'element.transformResize': function elementTransformResize(drag) {
      this.setSize(drag);
    },
    'element.transformEnd': function elementTransformEnd() {
      this.resizeEnd();
      delete this.model.$minWidth;
      delete this.model.$minHeight;
    }
  },
  watch: {
    'model.content': function modelContent() {
      var _this5 = this;

      this.checkLoad().then(function () {
        _this5.render();
      });
    },
    'model.url': function modelUrl() {
      var _this6 = this;

      this.checkLoad().then(function () {
        _this6.render();
      });
    },
    // 当外部设入 model.width = newWidth 时更新变换
    'model.width': function modelWidth(width, prevWidth) {
      // 过滤 editor transform 与 scale 过程中的 mutation
      if (!this.supportTransform || this.$svgResizeMeta || this.$scaling || !this.isDesign) {
        return;
      }

      this.resizeInit('e');
      this.setSize({
        dir: 'e',
        dx: width - prevWidth,
        dy: 0
      });
      this.resizeEnd();
    },
    // 当外部设入 model.height = newHeight 时更新变换
    'model.height': function modelHeight(height, prevHeight) {
      if (!this.supportTransform || this.$svgResizeMeta || this.$scaling || !this.isDesign) {
        return;
      }

      this.resizeInit('s');
      this.setSize({
        dir: 's',
        dx: 0,
        dy: height - prevHeight
      });
      this.resizeEnd();
    }
  },
  mounted: function mounted() {
    var _this7 = this;

    this.render();
    this.$watch(function () {
      return _this7.model.$renderProps;
    }, function () {
      return debounceUpdateMaskInfo(_this7.model, _this7.editor);
    }, {
      deep: true
    });
  }
});