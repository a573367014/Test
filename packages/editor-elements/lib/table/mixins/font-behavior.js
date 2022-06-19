import loader from "@gaoding/editor-utils/lib/loader";
import utils from "@gaoding/editor-framework/lib/utils/utils";
var DEFAULT_FONT_FAMILY = '-apple-system,BlinkMacSystemFont,Segoe UI,Hiragino Sans GB,Microsoft YaHei,Helvetica Neue,Helvetica,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol';
var isFox = utils.isFox();
var supportMiniFontSize = isFox || window.safari;
export default {
  data: function data() {
    return {
      fallbackFonts: DEFAULT_FONT_FAMILY,
      // safari 原生支持字号小于12像素
      minFontSize: supportMiniFontSize ? 1 : 12,
      lastFont: null
    };
  },
  watch: {
    'model.fontFamily': function modelFontFamily() {
      this.checkLoad();
    }
  },
  mounted: function mounted() {
    this.checkLoad();
  },
  methods: {
    getCloseFont: function getCloseFont(name) {
      if (name === void 0) {
        name = '';
      }

      var _this$options = this.options,
          fontsMap = _this$options.fontsMap,
          defaultFont = _this$options.defaultFont,
          fontList = _this$options.fontList;

      if (!name) {
        name = this.model.fontFamily;
      }

      return fontsMap[name] || fontsMap[defaultFont] || fontList[0];
    },
    loadFonts: function loadFonts() {
      var _this = this;

      var options = this.options;
      var names = this.model.getFontFamilies();
      if (!names.length) names.push(this.model.fontFamily);
      var fontLoads = names.map(function (name) {
        var _this$options2;

        var font = _this.getCloseFont(name);

        if (!font) {
          return Promise.resolve();
        }

        return loader.loadFont(Object.assign({}, font, {
          display: 'swap',
          useLocal: ((_this$options2 = _this.options) === null || _this$options2 === void 0 ? void 0 : _this$options2.mode) === 'mirror'
        }), options.fontLoadTimeout);
      });
      return Promise.all(fontLoads);
    },
    loadImage: function loadImage() {
      var imageUrl = this.model.imageUrl;

      if (this.options.mode === 'mirror' && imageUrl) {
        return utils.loadImage(imageUrl, this.options.fitCrossOrigin);
      }

      return Promise.resolve();
    }
  }
};