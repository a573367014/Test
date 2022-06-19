"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _isEqual2 = _interopRequireDefault(require("lodash/isEqual"));

var _cloneDeep2 = _interopRequireDefault(require("lodash/cloneDeep"));

var _presets = require("./presets");

var _utils = require("./utils");

class _default {
  constructor(editor) {
    (0, _defineProperty2.default)(this, "editor", void 0);
    (0, _defineProperty2.default)(this, "target", null);
    (0, _defineProperty2.default)(this, "_fixed", false);
    (0, _defineProperty2.default)(this, "_cacheCursor", new Map());
    (0, _defineProperty2.default)(this, "_cursorMap", new Map());
    (0, _defineProperty2.default)(this, "_styleElement", void 0);
    (0, _defineProperty2.default)(this, "_$tip", void 0);
    (0, _defineProperty2.default)(this, "_onTipMousemove", void 0);
    (0, _defineProperty2.default)(this, "currentCursor", void 0);

    this._loadCursorDefinition();

    this.editor = editor;

    this._onMouseEvent();

    this._initTipNode();
  }

  _loadCursorDefinition() {
    const cursorMap = { ..._presets.CommonCursorPreset,
      ..._presets.ShapeCursorPreset
    };
    Object.keys(cursorMap).forEach(key => {
      this._cursorMap.set(key, cursorMap[key]);
    });
  }

  _initTipNode() {
    const $div = document.createElement('div');
    Object.assign($div.style, {
      position: 'fixed',
      'z-index': 9,
      padding: '8px 12px',
      background: '#33383E',
      color: '#E8EAEC',
      'font-size': '14px',
      'font-weight': 400,
      'border-radius': '4px',
      'pointer-events': 'none',
      transform: 'translate(-50%, -50px)',
      display: 'none'
    });
    document.body.appendChild($div);
    this._$tip = $div;

    this._onTipMousemove = e => {
      Object.assign(this._$tip.style, {
        left: e.pageX + 'px',
        top: e.pageY + 'px'
      });
    };
  }

  _showTip(tip) {
    if (this._$tip.style.display === 'block') return;
    document.body.addEventListener('mousemove', this._onTipMousemove);
    this._$tip.innerText = tip;
    this._$tip.style.display = 'block';
  }

  _hideTip() {
    document.body.removeEventListener('mousemove', this._onTipMousemove);
    this._$tip.style.display = 'none';
  }

  _updateStyleNode(opt) {
    const clsName = `_set_cursor_${Math.random().toString(32).slice(-10)}`.replace(/\./g, '-');

    if (!this._styleElement) {
      this._styleElement = document.createElement('style');
      document.getElementsByTagName('head')[0].appendChild(this._styleElement);
    }

    const sheet = this._styleElement.sheet;
    sheet.insertRule(`.${clsName} { cursor: ${(0, _utils.getCursorCssValue)(opt)}; }`);

    this._cacheCursor.set(opt.cacheKey, {
      clsName,
      imageSets: opt.imageSets,
      rule: sheet.cssRules[0]
    });

    return clsName;
  }

  _setTargetCursorClsName(clsName, target = this.target) {
    if (target !== null && target !== void 0 && target.className) {
      const currentClass = this.target.className.split(' ').filter(item => {
        return /^_set_cursor_/.test(item);
      });
      target.classList.remove(currentClass[0]);
    }

    target && target.classList.add(clsName);
  }

  _handleEvent(e) {
    var _this$target, _this$target$dataset;

    this.target = (0, _utils.getTarget)(e.target);
    if (this._fixed) return;
    const params = (_this$target = this.target) === null || _this$target === void 0 ? void 0 : (_this$target$dataset = _this$target.dataset) === null || _this$target$dataset === void 0 ? void 0 : _this$target$dataset.cursor;
    const cursorProps = {};

    if (!params) {
      return;
    } else if (params.indexOf(',') === -1) {
      cursorProps.cursor = params;
    } else {
      const arr = params.split(',');
      arr.forEach(item => {
        cursorProps[item.split(':')[0].trim()] = item.split(':')[1].trim();
      });
    }

    this.toggleCursor(cursorProps.cursor, {
      rotate: cursorProps.rotate
    });
  }

  _onMouseEvent() {
    this.editor.$events.$on('base.changeCursor', this._handleEvent.bind(this));
  }

  _offMouseEvent() {
    this.editor.$events.$off('base.changeCursor', this._handleEvent.bind(this));
  }

  _getCursorKey(data) {
    const cursor = data.cursor || 'default';
    let rotate = 0;

    if (data.rotate) {
      rotate = (data === null || data === void 0 ? void 0 : data.rotate) >= 0 ? data.rotate : 360 + Number(data.rotate || 0);
    }

    const dir = Math.floor(Math.abs(rotate - 5) / 10) || 0;
    const key = !dir ? cursor : `${cursor}_${dir}`;
    return key;
  }

  _shouldRerenderCursor(opt, cache) {
    return !(0, _isEqual2.default)(opt.args, cache.args) || opt.rotate !== cache.rotate;
  }

  async _createCursor(key, definition, opt) {
    const imageSets = await (0, _utils.renderCursor)({
      image: definition.image,
      ...opt
    });

    const clsName = this._updateStyleNode({ ...definition,
      imageSets,
      cacheKey: key
    });

    this._setTargetCursorClsName(clsName);
  }

  async _updateCacheCursor(cache, definition, opt) {
    this._setTargetCursorClsName(cache.clsName);

    if (!this._shouldRerenderCursor(opt, cache)) return;
    const imageSets = await (0, _utils.renderCursor)({
      image: definition.image,
      ...opt
    });
    const rule = cache.rule;
    rule.style.cursor = (0, _utils.getCursorCssValue)({ ...definition,
      imageSets
    });
    cache.imageSets.forEach(s => URL.revokeObjectURL(s.url));
    Object.assign(cache, {
      imageSets,
      ...(0, _cloneDeep2.default)(opt)
    });
  }

  async toggleCursor(name, opt = {}) {
    if (!name) return;

    const key = this._getCursorKey({
      cursor: name,
      rotate: opt.rotate
    });

    this.currentCursor = key;

    const cache = this._cacheCursor.get(key);

    const cursorDefinition = this._cursorMap.get(name);

    if (cache) await this._updateCacheCursor(cache, cursorDefinition, opt);else await this._createCursor(key, cursorDefinition, opt);
    if (opt.tip) this._showTip(opt.tip);else this._hideTip();
  }

  fixedCursor(name, opt = {}) {
    this._fixed = true;
    this.toggleCursor(name, opt);
  }

  cancelFixed(name) {
    this._fixed = false;
    name && this.toggleCursor(name);
  }

}

exports.default = _default;