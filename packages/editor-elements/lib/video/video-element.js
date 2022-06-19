import _extends from "@babel/runtime/helpers/extends";
import _throttle from "lodash/throttle";
import $ from "@gaoding/editor-utils/lib/zepto";
import utils from "@gaoding/editor-framework/lib/utils/utils";
import inherit from "@gaoding/editor-framework/lib/utils/vue-inherit";
import ImageElement from "../image/image-element";
import template from "./video-element.html";
import { createProxy } from "@gaoding/editor-utils/lib/create-proxy";
export default inherit(ImageElement, {
  name: 'video-element',
  template: template,
  data: function data() {
    return {
      video: null
    };
  },
  computed: {
    cssStyle: function cssStyle() {
      var rect = this.rect;
      var padding = rect.padding;
      return {
        height: rect.height + padding[0] + padding[2] + 'px',
        width: rect.width + padding[1] + padding[3] + 'px',

        /**
         * 加 translateZ 是为了分离渲染 layer
         * 规避 chrome 的 video 元素在有 rotate 的时候，有些角度的情况下
         * 会跟其他渲染 layer 合并, 导致 video 元素的层级错误
         */
        transform: this.transform.toString() + ' translateZ(0)',
        left: rect.left + 'px',
        top: rect.top + 'px',
        opacity: this.opacity
      };
    },
    mainStyle: function mainStyle() {
      var padding = this.padding,
          borderRadius = this.borderRadius;
      return _extends({
        padding: padding,
        borderRadius: borderRadius,
        overflow: 'hidden'
      }, this.maskStyle);
    },
    imageRenderer: function imageRenderer() {
      if (!this._imageRendererProxy) {
        this._imageRendererProxy = createProxy({});
      }

      return this._imageRendererProxy;
    },
    startTime: function startTime() {
      var _this$model = this.model,
          startTime = _this$model.startTime,
          endTime = _this$model.endTime,
          naturalDuration = _this$model.naturalDuration,
          invertPlay = _this$model.invertPlay;

      if (invertPlay) {
        return naturalDuration - endTime;
      }

      return startTime;
    },
    endTime: function endTime() {
      var _this$model2 = this.model,
          startTime = _this$model2.startTime,
          endTime = _this$model2.endTime,
          naturalDuration = _this$model2.naturalDuration,
          invertPlay = _this$model2.invertPlay;

      if (invertPlay) {
        return naturalDuration - startTime;
      }

      return endTime;
    }
  },
  watch: {
    'model.$currentTime': function model$currentTime(time) {
      var model = this.model,
          video = this.video;
      if (!video) return; // 说明视频逐秒播放没必要设置 video.currentTime，会引起卡顿

      var currentTime = video.currentTime * 1000;
      if (model.$playing && Math.abs(currentTime - time) < 500) return;
      this.videoUpdateTime(time / 1000);
      model.$currentTime = Math.min(this.endTime, Math.max(time, this.startTime));
    },
    'model.volume': function modelVolume(vol) {
      if (!this.video || this.isPreviewMode) return;
      this.video.volume = vol;
    },
    'model.muted': function modelMuted(muted) {
      if (!this.video || this.isPreviewMode) return;
      this.video.muted = muted;
    },
    'model.$playing': function model$playing(playing) {
      if (!this.video || this.isPreviewMode) return;

      if (playing) {
        if (this.model.$currentTime >= this.endTime) {
          this.videoUpdateTime(0);
        }

        this.video.play();
      } else {
        this.video.pause();
      }
    },
    // 同步预览模式下视频帧
    'element.updateTime': _throttle(function (model, time) {
      if (model !== this.model || !this.isPreviewMode || !this.video) return;
      this.video.currentTime = time;
    }, 1000, {
      trailing: true
    })
  },
  methods: {
    load: function load() {
      var _this = this;

      var originUrl = this.originUrl,
          model = this.model,
          options = this.options;
      return utils.loadVideo(originUrl, model.$currentTime / 1000, options.fitCrossOrigin).then(function (originalVideo) {
        originalVideo && _this.initDataByImg(originalVideo);

        _this.$nextTick();
      }).then(function () {
        if (!_this.isPreviewMode) {
          model.$currentTime = Math.max(model.$currentTime, _this.startTime); // 自动播放, 延迟触发 watch 更新

          if (model.$playing) {
            model.$playing = false;
            return _this.$nextTick().then(function () {
              model.$playing = true;
            });
          }
        }

        if (_this.video) {
          _this.videoUpdateTime(model.$currentTime / 1000);
        }
      }).timeout(15000, "video [" + originUrl + "] load timeout(" + 15000 + "ms)").catch(function (e) {
        throw e;
      });
    },
    videoUpdateTime: function videoUpdateTime(time) {
      this.video.currentTime = time;
      this.$events.$emit('element.updateTime', this.model, time);
    }
  },
  events: {},
  mounted: function mounted() {
    var _this2 = this;

    var video = this.video = this.$refs.video;
    video.volume = this.model.volume;
    video.muted = this.model.muted;
    $(video).on('pause', this._onpause = function () {
      _this2.model.$playing = false;

      _this2.videoUpdateTime(video.currentTime);
    }).on('paly', this._onplay = function () {
      _this2.model.$playing = true;

      _this2.videoUpdateTime(video.currentTime);
    }); // 若存在 startTime，拆分组、成组时可以有效避免跳帧

    this.videoUpdateTime(this.model.$currentTime / 1000);
  },
  beforeDestroy: function beforeDestroy() {
    var video = this.video;
    $(video).off('pause', this._onpause);
    $(video).off('paly', this._onplay);
  }
});