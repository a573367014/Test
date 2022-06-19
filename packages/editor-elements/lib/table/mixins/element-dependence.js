export default {
  computed: {
    element: function element() {
      return {
        global: this.global,
        model: this.model,
        options: this.options,
        rect: this.rect
      };
    },
    boxStyle: function boxStyle() {
      var rect = this.rect;
      var padding = rect.padding;
      return {
        height: rect.height + padding[0] + padding[2] + "px",
        width: rect.width + padding[1] + padding[3] + "px",
        transform: this.transform.toString(),
        left: rect.left + "px",
        top: rect.top + "px",
        opacity: this.opacity,
        position: 'absolute'
      };
    },
    innerStyle: function innerStyle() {
      var model = this.model,
          _this$global$zoom = this.global.zoom,
          zoom = _this$global$zoom === void 0 ? 1 : _this$global$zoom;
      return {
        width: Math.round(model.width) + "px",
        height: Math.round(model.height) + "px",
        transform: "scale(" + zoom + ")"
      };
    },
    hide: function hide() {
      return this.options.mode !== 'preview' && this.editor.currentElement && this.editor.currentElement.$id === this.model.$id && !this.model.lock && this.model.$editing;
    }
  }
};