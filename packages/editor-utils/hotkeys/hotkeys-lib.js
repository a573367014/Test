// http://jaywcjlove.github.io/hotkeys/

const IS_FF = navigator.userAgent.toLowerCase().indexOf('firefox') > 0;

export default class HotkeysLib {
    // 默认热键范围
    _scope = 'all';
    _context = null;
    _keyMap = {
        // 特殊键
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
        minus: 109, // 数字键盘 -
        plus: 107, // 数字键盘 +
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
        '\\': 220,
    };

    _modifier = {
        // 修饰键
        '⇧': 16,
        shift: 16,
        '⌥': 18,
        alt: 18,
        option: 18,
        '⌃': 17,
        ctrl: 17,
        control: 17,
        '⌘': IS_FF ? 224 : 91,
        command: IS_FF ? 224 : 91,
    };

    _isclearModifier = false;
    // 按下的绑定键
    _downKeys = [];
    modifierMap = {
        16: 'shiftKey',
        18: 'altKey',
        17: 'ctrlKey',
    };

    _hotkeys = [];
    _mods = {
        16: false,
        18: false,
        17: false,
    };

    _handlers = {};

    constructor() {
        // F1~F12 特殊键
        for (let k = 1; k < 20; k++) {
            this._keyMap['f' + k] = 111 + k;
        }

        // 兼容 Firefox 处理
        this.modifierMap[IS_FF ? 224 : 91] = 'metaKey';
        this._mods[IS_FF ? 224 : 91] = false;
    }

    ignoreKeys = [];

    // 返回键码
    code = (x) => {
        return this._keyMap[x] || x.toUpperCase().charCodeAt(0);
    };

    // 设置热键范围，默认为全部
    setScope = (scope = 'all') => {
        this._scope = scope;
    };

    getScope = () => {
        return this._scope;
    };

    addEvent = (object, event, method) => {
        if (object.addEventListener) {
            object.addEventListener(event, method, false);
        } else if (object.attachEvent) {
            object.attachEvent('on' + event, () => {
                method(window.event);
            });
        }
    };

    // 判断按下的键是否为某个键
    isPressed = (keyCode) => {
        if (typeof keyCode === 'string') {
            keyCode = this.code(keyCode); // 转换成键码
        }
        return this._downKeys.indexOf(keyCode) !== -1;
    };

    // 获取按下绑定键的键值
    getPressedKeyCodes = () => {
        return this._downKeys.slice(0);
    };

    // 处理 keydown 事件
    dispatch = (event) => {
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
            clearModifier,
        } = this;

        // 收集绑定的键
        if (_downKeys.indexOf(key) === -1) _downKeys.push(key);

        // Gecko(Firefox) 的 command 键值 224，在 Webkit(Chrome) 中保持一致
        // Webkit 左右 command 键值不同
        if (key === 93 || key === 224) key = 91;
        if (key in _mods) {
            _mods[key] = true;
            // 将特殊字符的 key 注册到 hotkeys 上
            for (const k in _modifier) {
                if (_modifier[k] === key) _hotkeys[k] = true;
            }
            if (!asterisk) return;
        }
        // 将 modifierMap 里面的修饰键绑定到 event 中
        for (const e in _mods) _mods[e] = event[modifierMap[e]];

        // 表单控件控件过滤，默认表单控件不触发快捷键
        if (!this.filter(event)) return;
        // 获取范围，默认为 all
        const scope = getScope();

        // 对任何按键做处理
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

        // key 不在 _handlers 中返回
        if (!(key in _handlers)) return;

        for (let i = 0; i < _handlers[key].length; i++) {
            // 找到处理内容
            const _re = eventHandler(event, _handlers[key][i], scope);
            if (result) {
                result = _re;
            }
        }

        if (!_isclearModifier) {
            addEvent(document, 'keyup', (event) => {
                clearModifier(event);
            });
            this._isclearModifier = true;
        }

        return result;
    };

    fire = (event) => {
        return this.dispatch(event);
    };

    eventHandler = (event, handler, scope) => {
        const { _context, _mods } = this;
        let modifiersMatch;

        if (!handler.scope) return false;

        // 检查是否在当前范围
        if (handler.scope === scope || handler.scope === 'all') {
            // 检查是否匹配修饰符，如果有返回 true
            modifiersMatch = handler.mods.length > 0;
            for (const y in _mods) {
                if (
                    (!_mods[y] && handler.mods.indexOf(+y) > -1) ||
                    (_mods[y] && handler.mods.indexOf(+y) === -1)
                )
                    modifiersMatch = false;
            }
            // 调用处理程序，如果是修饰键不做处理
            if (
                (handler.mods.length === 0 &&
                    !_mods[16] &&
                    !_mods[18] &&
                    !_mods[17] &&
                    !_mods[91]) ||
                modifiersMatch ||
                handler.shortcut === '*'
            ) {
                return handler.method.call(_context, event, handler);
            }
        }
        return true;
    };

    // 解除绑定某个范围的快捷键
    unbind = (key, scope) => {
        const { code, getScope, getKeys, getMods, compareArray, _handlers } = this;

        const multipleKeys = getKeys(key);
        let keys = [];
        let mods = [];
        let obj;

        for (let i = 0; i < multipleKeys.length; i++) {
            // 将组合快捷键拆分为数组
            keys = multipleKeys[i].split('+');

            // 记录每个组合键中的修饰键的键码，返回数组
            if (keys.length > 1) mods = getMods(keys);

            // 获取除修饰键外的键值key
            key = keys[keys.length - 1];
            key = code(key);

            // 判断是否传入范围，没有就获取范围
            if (scope === undefined) scope = getScope();

            // 如何key不在 _handlers 中返回不做处理
            if (!_handlers[key]) return;

            // 清空 handlers 中数据，
            // 让触发快捷键键之后没有事件执行到达解除快捷键绑定的目的
            for (let r = 0; r < _handlers[key].length; r++) {
                obj = _handlers[key][r];
                // 判断是否在范围内并且键值相同
                if (obj.scope === scope && compareArray(obj.mods, mods)) {
                    _handlers[key][r] = {};
                }
            }
        }
    };

    // 循环删除 handlers 中所有 scope 范围
    deleteScope = (scope) => {
        let key, handlers, i;

        for (key in this._handlers) {
            handlers = this._handlers[key];
            for (i = 0; i < handlers.length; ) {
                if (handlers[i].scope === scope) handlers.splice(i, 1);
                else i++;
            }
        }
    };

    // 比较修饰键数组
    compareArray = (a1, a2) => {
        if (a1.length !== a2.length) return false;
        for (let i = 0; i < a1.length; i++) {
            if (a1[i] !== a2[i]) return false;
        }
        return true;
    };

    // 表单控件控件判断
    filter = (event) => {
        const tagName = (event.target || event.srcElement).tagName;
        // 忽略这些标签情况下快捷键无效
        return !(tagName === 'INPUT' || tagName === 'SELECT' || tagName === 'TEXTAREA');
    };

    // 修饰键转换成对应的键码
    getMods = (key) => {
        const mods = key.slice(0, key.length - 1);
        for (let i = 0; i < mods.length; i++) mods[i] = this._modifier[mods[i]];
        return mods;
    };

    // key 字符串转成数组
    getKeys = (key) => {
        key = key.replace(/\s/g, ''); // 匹配任何空白字符，包括空格、制表符、换页符等等
        const keys = key.split(',');
        if (keys[keys.length - 1] === '') keys[keys.length - 2] += ',';
        return keys;
    };

    // 清除修饰键
    clearModifier = (event) => {
        const { _downKeys, _mods, _hotkeys, _modifier } = this;

        let key = event.keyCode;
        const i = _downKeys.indexOf(key);

        if (i >= 0) _downKeys.splice(i, 1);

        // 修饰键 shiftKey altKey ctrlKey (command||metaKey) 清除
        if (key === 93 || key === 224) key = 91;
        if (key in _mods) {
            _mods[key] = false;
            for (const k in _modifier) {
                if (_modifier[k] === key) _hotkeys[k] = false;
            }
        }
    };

    // 主体 hotkeys 函数
    hotkeys = (key, scope, method) => {
        const { getKeys, getMods, code, _handlers } = this;

        const keys = getKeys(key);
        let mods = [];
        let i = 0;
        // 对未设定范围的判断
        if (method === undefined) {
            method = scope;
            scope = 'all';
        }
        // 对于每个快捷键处理
        for (; i < keys.length; i++) {
            key = keys[i].split('+');
            mods = [];
            // 若为组合快捷键，取得组合快捷键
            if (key.length > 1) {
                mods = getMods(key);
                key = [key[key.length - 1]];
            }
            // 转换成键码
            key = key[0];
            key = key === '*' ? '*' : code(key);

            // 判断 key 是否在 _handlers 中，若不在则将其初始化为空数组
            if (!(key in _handlers)) _handlers[key] = [];
            _handlers[key].push({
                shortcut: keys[i],
                scope: scope,
                method: method,
                key: keys[i],
                mods: mods,
            });
        }
    };

    setContext = (context = null) => {
        this._context = context;
    };

    init = (config = [], context = null) => {
        this._context = context;
        for (const key in config) {
            this.hotkeys(key, config[key]);
        }
    };
}

// 在全局 document 上设置快捷键
/*
addEvent(document, 'keydown', function(event) {
    dispatch(event);
});

addEvent(document, 'keyup', function(event) {
    clearModifier(event);
});
*/
