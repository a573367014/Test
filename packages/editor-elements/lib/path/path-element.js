import inherit from "@gaoding/editor-framework/lib/utils/vue-inherit";
import BaseElement from "@gaoding/editor-framework/lib/base/base-element"; // @ts-ignore VueTemplate

import template from "./path-element.html";
import { PathRenderer } from "./path-renderer";
import { ref, computed, watch, onMounted } from '@vue/composition-api';
export default inherit(BaseElement, {
  name: 'path-element',
  template: template,
  setup: function setup(_ref) {
    var model = _ref.model,
        editor = _ref.editor,
        global = _ref.global;
    var canvas = ref(null);
    var renderer;
    var service = editor.services.cache.get('path');
    var canEditPath = service.canEditPath(model);
    var zoom = computed(function () {
      return global.zoom;
    });
    var canvasStyle = computed(function () {
      return {
        position: 'absolute',
        left: 0,
        top: 0,
        transformOrigin: '0 0'
      };
    });
    var imgStyle = computed(function () {
      var _effectedResult = model.effectedResult,
          left = _effectedResult.left,
          top = _effectedResult.top,
          width = _effectedResult.width,
          height = _effectedResult.height;
      return {
        position: 'absolute',
        left: left * zoom.value + 'px',
        top: top * zoom.value + 'px',
        width: width * zoom.value + 'px',
        height: height * zoom.value + 'px'
      };
    });
    var wrapStyle = {
      lineHeight: 0
    };
    var renderData = computed(function () {
      if (!canEditPath) return {};
      return {
        path: model.path,
        fillColor: model.$currentPathEffect.filling,
        strokeType: model.$currentPathEffect.lineType,
        strokeColor: model.$currentPathEffect.color,
        strokeWidth: model.$currentPathEffect.width,
        zoom: zoom.value,
        radius: model.radius
      };
    });
    watch(renderData, function () {
      if (!canEditPath) return;
      renderer.render(zoom.value);
    });
    onMounted(function () {
      renderer = new PathRenderer(model, canvas.value);
      renderer.render(zoom.value);
    });
    return {
      canvas: canvas,
      renderData: renderData,
      canvasStyle: canvasStyle,
      imgStyle: imgStyle,
      wrapStyle: wrapStyle,
      canEditPath: canEditPath
    };
  }
});