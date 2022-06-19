import _asyncToGenerator from "@babel/runtime/helpers/asyncToGenerator";
import _assign from "lodash/assign";
import _regeneratorRuntime from "@babel/runtime/regenerator";
export default {
  /**
   * 添加音频元素
   * @memberof EditorAudioElementMixin
   * @param {String} url - 音频路径
   * @param {Object} options - 音频其他参数，查看{@link module:EditorDefaults.element|element}
   */
  addAudio: function addAudio(url, options) {
    var data = _assign({
      type: 'audio',
      volume: 1,
      width: 0,
      height: 0,
      top: -10,
      left: -10,
      url: url
    }, options);

    return this.addElement(data);
  },

  /**
   * 播放指定时间的音频
   * @memberof EditorAudioElementMixin
   * @param {Object} element - 音频元素
   * @param {Number} time - 要 seek 的时间
   */
  seekAudio: function seekAudio(element, time) {
    if (element && element.type === 'audio') {
      element.$currentTime = time;
    }
  },

  /**
   * 播放音频
   * @memberof EditorAudioElementMixin
   * @param {Object} element - 音频元素
   * @param {Number} time - 开始播放的时间点
   */
  playAudio: function playAudio(element, time) {
    var _this = this;

    return _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee() {
      return _regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              if (!(!element || element.type !== 'audio')) {
                _context.next = 2;
                break;
              }

              return _context.abrupt("return");

            case 2:
              _context.next = 4;
              return _this.$nextTick();

            case 4:
              time && _this.seekAudio(element, time);

              _this.$set(element, '$playing', true);

            case 6:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }))();
  },

  /**
   * 暂停音频
   * @memberof EditorAudioElementMixin
   * @param {Object} element - 音频元素
   * @param {Number} time - 暂停的时间点 - 用来纠正播放可能出现偏移的情况
   */
  pauseAudio: function pauseAudio(element, time) {
    if (!element || element.type !== 'audio') return;
    this.$set(element, '$playing', false);
    time && this.seekAudio(element, time);
  },

  /**
   * 停止播放音频, 并把 currentTime 设为 0
   * @memberof EditorAudioElementMixin
   * @param {Object} element - 音频元素
   */
  stopAudio: function stopAudio(element) {
    this.pauseAudio(element, 0);
  }
};