import _extends from "@babel/runtime/helpers/extends";

/**
 * TextElement
 */
import inherit from "@gaoding/editor-framework/lib/utils/vue-inherit";
import { getEffectShadowList } from "@gaoding/editor-utils/lib/effect/adaptor";
import { TextEffectEngine } from "@gaoding/editor-utils/lib/effect/text-effect-engine";
import { scaleEffect } from "@gaoding/editor-utils/lib/effect/utils";
import { getUpdateFontsSubset } from "@gaoding/editor-framework/lib/utils/subset";
import TextBase from "./text-base";

function syncRect() {
  this.syncRect();
}

export default inherit(TextBase, {
  name: 'text-element',
  computed: {
    effectedTextEffects: function effectedTextEffects() {
      return getEffectShadowList(this.model);
    },
    effectStyles: function effectStyles() {
      var _this = this;

      var styles = TextEffectEngine.draw(this.model);
      return styles.map(function (style) {
        return _extends({}, _this.textStyle, style);
      });
    }
  },
  methods: {
    // 是否需要加载全量字体
    checkLoadFullFont: function checkLoadFullFont() {
      var model = this.model,
          options = this.options;
      var fontData = getUpdateFontsSubset([{
        elements: [model]
      }], options);

      if (fontData) {
        Object.keys(fontData).forEach(function (name) {
          var fontSubset = options.fontSubsetsMap[name];

          if (fontSubset) {
            fontSubset.loadType = 'all';
          }
        });
        this.checkLoad();
      }
    }
  },
  watch: {
    'model.$editing': function model$editing(v) {
      var _this2 = this;

      if (!v) {
        this.syncRect();
        return;
      } // 进入编辑加载全量字体


      var needCheckLoad;
      this.model.contents.forEach(function (item) {
        var font = _this2.options.fontsMap[item.fontFamily || _this2.model.fontFamily] || _this2.options.defaultFont;
        var fontSubset = _this2.options.fontSubsetsMap[font.name];

        if (fontSubset && fontSubset.loadType !== 'all') {
          fontSubset.loadType = 'all';
          needCheckLoad = true;
        }
      });

      if (needCheckLoad) {
        this.checkLoad();
      }
    },
    'model.fontSize': function modelFontSize(val, oldVal) {
      var ratio = val / oldVal || 1;

      if (this.options.mode === 'preview' || this.model.$resizeApi || this.editor.$binding.config.applyingYActions) {
        return;
      }

      scaleEffect(this.model, ratio);
    },
    'model.writingMode': function modelWritingMode() {
      var _this3 = this;

      if (this.options.mode === 'preview' || this.editor.$binding.config.applyingYActions) {
        return;
      }

      var model = this.model; // 当前 resize 模式旋转 90 度后可能变为新 resize

      var newResize = {
        2: 4,
        4: 2,
        5: 3,
        3: 5
      }[model.resize];
      model.resize = newResize || model.resize; // 当前 autoAdaptive 模式旋转 90 度后可能变为新 autoAdaptive

      var newAutoAdaptive = {
        1: 2,
        2: 1
      }[model.autoAdaptive];
      model.autoAdaptive = newAutoAdaptive || model.autoAdaptive;
      var _ref = [model.height, model.width];
      model.width = _ref[0];
      model.height = _ref[1];
      this.editor.$binding.commit({
        tag: 'change_element',
        elements: [model],
        props: {
          resize: model.resize,
          autoAdaptive: model.autoAdaptive,
          width: model.width,
          height: model.height
        }
      });
      this.$nextTick(function () {
        _this3.$events.$emit('element.rectUpdate', model, {
          width: model.width - model.height,
          height: model.height - model.width
        });

        _this3.syncRect();
      });
    },
    'model.contents': function modelContents() {
      var parentModel = this.$parent.model;
      var isAutoGroup = this.editor.isGroup(parentModel) && parentModel.autoGrow;

      if (!this.model.$editing && !this.model.$draging) {
        this.checkLoadFullFont();
      } // 文本框在拖拽期间并处于自增组中时，其 model 尺寸交由父级 group 计算


      if (!this.$textResizeMeta || !isAutoGroup) {
        this.syncRect();
      }
    },
    'model.letterSpacing': syncRect,
    'model.lineHeight': syncRect,
    'model.padding': syncRect,
    'model.textEffects': {
      handler: function handler() {
        this.syncRect();
      },
      deep: true
    },
    'model.shadows': {
      handler: function handler() {
        this.syncRect();
      },
      deep: true
    }
  },
  mounted: function mounted() {
    this.checkLoadFullFont();
    this.syncRect();
  }
});