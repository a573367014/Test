import _extends from "@babel/runtime/helpers/extends";
import _isEqual from "lodash/isEqual";
import _noop from "lodash/noop";
import $ from "@gaoding/editor-utils/lib/zepto";
import inherit from "@gaoding/editor-framework/lib/utils/vue-inherit";
import RichText from "@gaoding/editor-framework/lib/utils/rich-text";
import TextBase from "./text-base";
import template from "./text-editor.html";
var doc = $(document);
var rVoidWidth = /\u200b/gm;
var rBreakLine = /<br>|\r|\n/g;
var checkLoad = TextBase.find(function (obj) {
  return obj.methods.checkLoad;
}).methods.checkLoad;
export default inherit(TextBase, {
  name: 'text-editor',
  template: template,
  props: ['global', 'model', 'options', 'removeEmptyEnable'],
  data: function data() {
    return {
      clickLocked: false,
      // 缓存contentsHTML，即时更新会导致光标选区会失效，特定时机更新
      html: ''
    };
  },
  methods: {
    // 取消自动同步
    syncRect: _noop,
    initTextEditor: function initTextEditor() {
      var _this2 = this;

      this.createRichText();
      this.html = this.contentsHTML;
      this._initContents = RichText.fromJSON(this.html, {}, {
        listStyle: this.model.listStyle
      });
      this.$on('destroy', function () {
        _this2.model.$editing = false;

        _this2.$events.$emit(_this2._isChange ? 'element.editApply' : 'element.editCancel', _this2.model);

        _this2.$events.$emit('richText.update', null); // 清理内部事件


        _this2._richText.clear();
      });
    },
    createRichText: function createRichText() {
      var _this3 = this;

      this._richText = new RichText(this.$refs.edit, {
        options: this.richTextOptions,
        editorOptions: this.options,
        model: this.model
      });
      this.$events.$emit('richText.update', this._richText); // 捕捉字体命令，加载字体

      this._richText.cmd.on('do', function (e, name, value) {
        if (!_this3.model.$editing) return;

        if (name === 'fontFamily') {
          _this3.load(value).then(function () {
            return _this3._checkLoad();
          }).catch(console.error);
        } // 处理火狐textDecoration怪异表现
        // if(name === 'textDecoration') {
        //     this.setContents();
        // }

      });

      this._richText.on('changeImmediate', function (e, textElem) {
        var html = textElem.innerHTML;

        if (html !== _this3._prevHtml) {
          _this3.setContents(_this3.model);
        }

        _this3._prevHtml = html;
      });
    },
    setContents: function setContents(model) {
      if (!this._richText || !model || !['text', 'styledText', 'threeText', 'effectText'].includes(model.type) || !model.$editing) return;

      var contents = this._richText.fromJSON(null, {}, {
        listStyle: model.listStyle
      }); // 去除尾换行符


      Array.from(contents).reverse().some(function (item) {
        item.content = item.content.replace(/\n+\s*$/, '');
        return !!item.content;
      });
      var canMerge = contents.some(function (item) {
        return item.content && !!item.content.replace(rBreakLine, '');
      });
      contents = contents.filter(function (item) {
        return !!item.content;
      }); // 属性一致将被合并至model
      // 举例：所有子元素fontSize = 12，那么合并{fontSize: 12}至model

      var mergeStyleProps = canMerge ? RichText.getAllEqualStyleProps(contents) : {};

      if (!_isEqual(this._initContents, contents)) {
        this._isChange = true;
      }

      this.editor.toggleSnapshot(false);
      mergeStyleProps.contents = contents;
      mergeStyleProps.content = this.$refs.edit.textContent;
      this.editor.shallowChangeElement(mergeStyleProps, model);
      this.editor.resetAggregatedColors(model);
      this.editor.toggleSnapshot(true);
      this.$events.$emit('element.change', model, 'contents');
    },
    checkFocus: function checkFocus() {
      var _this4 = this;

      var model = this.model;
      if (!model.$editing || !this._richText) return;
      this.$nextTick(function () {
        var $textElem = $(_this4.$refs.edit);
        var text = $textElem.text().replace(rVoidWidth, '');

        if (!text) {
          _this4._richText.selection.createRangeByElem($textElem.children().last()[0] || $textElem[0], true);

          _this4._richText.selection.collapse();
        } else {
          // 创建选区,光标自动选中
          _this4._richText.selection.createRangeByElem($textElem[0], true);
        }
      });
    },
    onMousedown: function onMousedown() {
      var _this = this;

      var delayFn = function delayFn() {
        setTimeout(function () {
          _this.clickLocked = false;
        }, 160);
      };

      this.clickLocked = true;
      doc.one('mouseup.editor-text-editor', delayFn);
    },
    _checkLoad: checkLoad,
    // 忽略 EditorElement 部分特性
    checkLoad: _noop
  },
  events: {
    'base.click': function baseClick(e) {
      if (this.clickLocked) {
        e.preventDefault();
      }
    },
    'base.zoom': function baseZoom() {
      this.html = this.contentsHTML;
      this.checkFocus();
    },
    // keydown esc
    'base.keyDown': function baseKeyDown(e) {
      var model = this.model;

      if (model && e.keyCode === 27) {
        model.$editing = false;
      }
    },
    'element.editApply': function elementEditApply(model) {
      model = model || this.model;
      this.setContents(model);
      model.$editing = false;
    },
    'element.transformResize': function elementTransformResize() {
      this.html = this.contentsHTML; // 拖拽时不选中文本区、currentTextSelecttion 状态异常

      this.checkFocus();
    }
  },
  computed: {
    newGlobal: function newGlobal() {
      return _extends({}, this.global, {
        zoom: 1
      });
    },
    richTextOptions: function richTextOptions() {
      return this.model && {
        listStyle: this.model.listStyle,
        defaultStyle: _extends({}, this.model, {
          fontSize: this.model.fontSize,
          fontFamily: this.fontFamily
        })
      };
    }
  },
  watch: {
    'model.fontSize': function modelFontSize() {
      if (this.model.type === 'threeText') {
        this.html = this.contentsHTML;
      }
    },
    'model.$editing': function model$editing(v) {
      if (v) this.html = this.contentsHTML;
      this.checkFocus();
    },
    model: function model(newModel, oldModel) {
      if (oldModel) {
        // DOM还未更新，这里可以更新旧model
        this._isChange && this.$events.$emit('element.editApply', oldModel);
        oldModel.$editing = false;
      }

      this._isChange = false;
      this.html = this.contentsHTML;
    },
    richTextOptions: function richTextOptions() {
      if (this._richText && this.model) {
        this._richText.setConfig(this.richTextOptions);
      }
    }
  },
  created: function created() {
    this.editElement = this.editor.currentSubElement || this.editor.currentElement;
  },
  mounted: function mounted() {
    this.initTextEditor();
    this.checkFocus();
  }
});