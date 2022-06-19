"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

const IS_FF = navigator.userAgent.toLowerCase().indexOf('firefox') > 0;

class HotkeysLib {
  constructor() {
    (0, _defineProperty2.default)(this, "_scope", 'all');
    (0, _defineProperty2.default)(this, "_context", null);
    (0, _defineProperty2.default)(this, "_keyMap", {
      backspace: 8,
      tab: 9,
      clear: 12,
      enter: 13,
      return: 13,
      esc: 27,
      escape: 27,
      space: 32,
      left: 37,
      up: 38,
      right: 39,
      down: 40,
      del: 46,
      delete: 46,
      home: 36,
      end: 35,
      pageup: 33,
      pagedown: 34,
      minus: 109,
      plus: 107,
      ',': 188,
      '.': 190,
      '/': 191,
      '`': 192,
      '-': IS_FF ? 173 : 189,
      '=': IS_FF ? 61 : 187,
      ';': IS_FF ? 59 : 186,
      "'": 222,
      '[': 219,
      ']': 221,
      '\\': 220
    });
    (0, _defineProperty2.default)(this, "_modifier", {
      '⇧': 16,
      shift: 16,
      '⌥': 18,
      alt: 18,
      option: 18,
      '⌃': 17,
      ctrl: 17,
      control: 17,
      '⌘': IS_FF ? 224 : 91,
      command: IS_FF ? 224 : 91
    });
    (0, _defineProperty2.default)(this, "_isclearModifier", false);
    (0, _defineProperty2.default)(this, "_downKeys", []);
    (0, _defineProperty2.default)(this, "modifierMap", {
      16: 'shiftKey',
      18: 'altKey',
      17: 'ctrlKey'
    });
    (0, _defineProperty2.default)(this, "_hotkeys", []);
    (0, _defineProperty2.default)(this, "_mods", {
      16: false,
      18: false,
      17: false
    });
    (0, _defineProperty2.default)(this, "_handlers", {});
    (0, _defineProperty2.default)(this, "ignoreKeys", []);
    (0, _defineProperty2.default)(this, "code", x => {
      return this._keyMap[x] || x.toUpperCase().charCodeAt(0);
    });
    (0, _defineProperty2.default)(this, "setScope", (scope = 'all') => {
      this._scope = scope;
    });
    (0, _defineProperty2.default)(this, "getScope", () => {
      return this._scope;
    });
    (0, _defineProperty2.default)(this, "addEvent", (object, event, method) => {
      if (object.addEventListener) {
        object.addEventListener(event, method, false);
      } else if (object.attachEvent) {
        object.attachEvent('on' + event, () => {
          method(window.event);
        });
      }
    });
    (0, _defineProperty2.default)(this, "isPressed", keyCode => {
      if (typeof keyCode === 'string') {
        keyCode = this.code(keyCode);
      }

      return this._downKeys.indexOf(keyCode) !== -1;
    });
    (0, _defineProperty2.default)(this, "getPressedKeyCodes", () => {
      return this._downKeys.slice(0);
    });
    (0, _defineProperty2.default)(this, "dispatch", event => {
      let result = true;
      let key = event.keyCode;
      const asterisk = this._handlers['*'];
      const {
        _downKeys,
        _mods,
        _modifier,
        _handlers,
        _isclearModifier,
        _hotkeys,
        getScope,
        modifierMap,
        addEvent,
        eventHandler,
        clearModifier
      } = this;
      if (_downKeys.indexOf(key) === -1) _downKeys.push(key);
      if (key === 93 || key === 224) key = 91;

      if (key in _mods) {
        _mods[key] = true;

        for (const k in _modifier) {
          if (_modifier[k] === key) _hotkeys[k] = true;
        }

        if (!asterisk) return;
      }

      for (const e in _mods) _mods[e] = event[modifierMap[e]];

      if (!this.filter(event)) return;
      const scope = getScope();

      if (asterisk) {
        for (let i = 0; i < asterisk.length; i++) {
          if (asterisk[i].scope === scope) {
            const _re = eventHandler(event, asterisk[i], scope);

            if (result) {
              result = _re;
            }
          }
        }
      }

      if (!(key in _handlers)) return;

      for (let i = 0; i < _handlers[key].length; i++) {
        const _re = eventHandler(event, _handlers[key][i], scope);

        if (result) {
          result = _re;
        }
      }

      if (!_isclearModifier) {
        addEvent(document, 'keyup', event => {
          clearModifier(event);
        });
        this._isclearModifier = true;
      }

      return result;
    });
    (0, _defineProperty2.default)(this, "fire", event => {
      return this.dispatch(event);
    });
    (0, _defineProperty2.default)(this, "eventHandler", (event, handler, scope) => {
      const {
        _context,
        _mods
      } = this;
      let modifiersMatch;
      if (!handler.scope) return false;

      if (handler.scope === scope || handler.scope === 'all') {
        modifiersMatch = handler.mods.length > 0;

        for (const y in _mods) {
          if (!_mods[y] && handler.mods.indexOf(+y) > -1 || _mods[y] && handler.mods.indexOf(+y) === -1) modifiersMatch = false;
        }

        if (handler.mods.length === 0 && !_mods[16] && !_mods[18] && !_mods[17] && !_mods[91] || modifiersMatch || handler.shortcut === '*') {
          return handler.method.call(_context, event, handler);
        }
      }

      return true;
    });
    (0, _defineProperty2.default)(this, "unbind", (key, scope) => {
      const {
        code,
        getScope,
        getKeys,
        getMods,
        compareArray,
        _handlers
      } = this;
      const multipleKeys = getKeys(key);
      let keys = [];
      let mods = [];
      let obj;

      for (let i = 0; i < multipleKeys.length; i++) {
        keys = multipleKeys[i].split('+');
        if (keys.length > 1) mods = getMods(keys);
        key = keys[keys.length - 1];
        key = code(key);
        if (scope === undefined) scope = getScope();
        if (!_handlers[key]) return;

        for (let r = 0; r < _handlers[key].length; r++) {
          obj = _handlers[key][r];

          if (obj.scope === scope && compareArray(obj.mods, mods)) {
            _handlers[key][r] = {};
          }
        }
      }
    });
    (0, _defineProperty2.default)(this, "deleteScope", scope => {
      let key, handlers, i;

      for (key in this._handlers) {
        handlers = this._handlers[key];

        for (i = 0; i < handlers.length;) {
          if (handlers[i].scope === scope) handlers.splice(i, 1);else i++;
        }
      }
    });
    (0, _defineProperty2.default)(this, "compareArray", (a1, a2) => {
      if (a1.length !== a2.length) return false;

      for (let i = 0; i < a1.length; i++) {
        if (a1[i] !== a2[i]) return false;
      }

      return true;
    });
    (0, _defineProperty2.default)(this, "filter", event => {
      const tagName = (event.target || event.srcElement).tagName;
      return !(tagName === 'INPUT' || tagName === 'SELECT' || tagName === 'TEXTAREA');
    });
    (0, _defineProperty2.default)(this, "getMods", key => {
      const mods = key.slice(0, key.length - 1);

      for (let i = 0; i < mods.length; i++) mods[i] = this._modifier[mods[i]];

      return mods;
    });
    (0, _defineProperty2.default)(this, "getKeys", key => {
      key = key.replace(/\s/g, '');
      const keys = key.split(',');
      if (keys[keys.length - 1] === '') keys[keys.length - 2] += ',';
      return keys;
    });
    (0, _defineProperty2.default)(this, "clearModifier", event => {
      const {
        _downKeys,
        _mods,
        _hotkeys,
        _modifier
      } = this;
      let key = event.keyCode;

      const i = _downKeys.indexOf(key);

      if (i >= 0) _downKeys.splice(i, 1);
      if (key === 93 || key === 224) key = 91;

      if (key in _mods) {
        _mods[key] = false;

        for (const k in _modifier) {
          if (_modifier[k] === key) _hotkeys[k] = false;
        }
      }
    });
    (0, _defineProperty2.default)(this, "hotkeys", (key, scope, method) => {
      const {
        getKeys,
        getMods,
        code,
        _handlers
      } = this;
      const keys = getKeys(key);
      let mods = [];
      let i = 0;

      if (method === undefined) {
        method = scope;
        scope = 'all';
      }

      for (; i < keys.length; i++) {
        key = keys[i].split('+');
        mods = [];

        if (key.length > 1) {
          mods = getMods(key);
          key = [key[key.length - 1]];
        }

        key = key[0];
        key = key === '*' ? '*' : code(key);
        if (!(key in _handlers)) _handlers[key] = [];

        _handlers[key].push({
          shortcut: keys[i],
          scope: scope,
          method: method,
          key: keys[i],
          mods: mods
        });
      }
    });
    (0, _defineProperty2.default)(this, "setContext", (context = null) => {
      this._context = context;
    });
    (0, _defineProperty2.default)(this, "init", (config = [], context = null) => {
      this._context = context;

      for (const key in config) {
        this.hotkeys(key, config[key]);
      }
    });

    for (let k = 1; k < 20; k++) {
      this._keyMap['f' + k] = 111 + k;
    }

    this.modifierMap[IS_FF ? 224 : 91] = 'metaKey';
    this._mods[IS_FF ? 224 : 91] = false;
  }

}

exports.default = HotkeysLib;