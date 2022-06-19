import utils from "@gaoding/editor-framework/lib/utils/utils";
import template from "./audio-element.html";
import Promise from 'bluebird';
export default {
  name: 'audio-element',
  template: template,
  props: ['global', 'model', 'options', 'editor'],
  data: function data() {
    return {
      audio: null
    };
  },
  computed: {
    originUrl: function originUrl() {
      var model = this.model,
          options = this.options;
      return utils.getComputedUrl(model.url, options.fitCrossOrigin);
    }
  },
  watch: {
    'model.$currentTime': function model$currentTime(time) {
      if (this.audio) {
        this.audio.currentTime = (time || 0) / 1000;
      }
    },
    'model.volume': function modelVolume(volume) {
      if (this.audio) {
        this.audio.volume = volume;
      }
    },
    'model.$playing': function model$playing(playing) {
      if (!this.audio) return;

      if (playing) {
        this.audio.volume = this.model.volume;
        this.audio.play();
      } else {
        this.audio.pause();
      }
    }
  },
  methods: {
    checkLoad: function checkLoad() {
      var _this = this;

      var model = this.model,
          originUrl = this.originUrl; // loaded

      model.$loaded = false;
      return Promise.try(function () {
        return utils.loadAudio(originUrl, _this.options.fitCrossOrigin);
      }).then(function () {
        model.$loaded = true;

        _this.$events.$emit('element.loaded', model);
      }).catch(function (ex) {
        model.$loaded = true;

        _this.$events.$emit('element.loadError', ex, model);
      });
    }
  },
  mounted: function mounted() {
    this.audio = this.$refs.audio;
    this.$nextTick(this.checkLoad);
  }
};