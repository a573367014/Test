import { cloneDeep, isFunction } from 'lodash';

import Watcher from './watcher';
import Dep from './dep';
import { observe, set } from './reactive';
import { noop, isPlainObject, hasOwn } from '../util';
import { findMatchedAdaptor } from '../source';
import { compile } from '../engine';

const sharedPropertyDefinition = {
    enumerable: true,
    configurable: true,
    get: noop,
    set: noop,
};

const rootModel = Object.create(null);
let rootVm = Object.create(null);
const modelToVm = new Map();
const vmToModel = new Map();

function initVM(vm) {
    Object.defineProperties(vm, {
        _computedWatchers: {
            enumerable: false,
            value: Object.create(null),
        },
        _watchers: {
            enumerable: false,
            value: [],
        },
        _alias: {
            enumerable: false,
            writable: true,
            value: Object.create(null),
        },
    });
}

export function initTemplate(editor, model, data, computed) {
    model = model || rootModel;
    let vm = modelToVm.get(model);
    if (!vm) {
        vm = {};
        modelToVm.set(model, vm);
        vmToModel.set(vm, model);
        if (model === rootModel) rootVm = vm;
    }

    initVM(vm);

    function watchComputed() {
        if (model !== rootModel) {
            vm._watchers.forEach((watcher) => {
                watcher.teardown();
            });
            vm._watchers.length = 0;

            const watch = {};
            Object.keys(computed).forEach((key) => {
                watch[key] = {
                    handler(newValue) {
                        const model = vmToModel.get(vm);
                        if (key === 'content') {
                            const toUpdate = {
                                content: newValue,
                                contents: [{ content: newValue }],
                            };
                            if (model.type === 'text') {
                                editor.changeTextContents(toUpdate, model);
                            } else if (model.type === 'styledText') {
                                editor.changeStyledTextContents(toUpdate, model);
                            } else {
                                editor.changeThreeTextContents(toUpdate, model);
                            }
                        } else {
                            model[key] = newValue;
                        }
                    },
                    deep: true,
                    immediate: true,
                };
            });
            initWatch(vm, watch);
        }
    }

    if (data) {
        if (isFunction(data)) {
            const result = data();
            if (result.then && isFunction(result.then)) {
                initData(vm, {});
                result.then((data) => {
                    Object.keys(data).forEach((key) => {
                        setPartial(vm, key, data[key]);
                    });
                    if (computed) {
                        reInitComputed(vm, computed);
                        watchComputed();
                    }
                });
            } else {
                initData(vm, result);
            }
        } else {
            const adaptor = findMatchedAdaptor(data);
            if (adaptor) {
                initData(vm, {});
                vm._alias = adaptor.parse(data).alias;

                adaptor
                    .fetch(data)
                    .then((data) => {
                        Object.keys(data).forEach((key) => {
                            setPartial(vm, key, data[key]);
                        });
                        if (computed) reInitComputed(vm, computed);
                    })
                    .catch(console.error);
            } else {
                const _data = {};
                Object.keys(data).forEach((key) => {
                    const v = data[key];
                    const adaptor = findMatchedAdaptor(v);
                    if (adaptor) {
                        const alias = adaptor.parse(v, key).alias;
                        vm._alias = { ...vm._alias, ...alias };
                        _data[key] = null;
                        adaptor
                            .fetch(v)
                            .then((data) => {
                                setPartial(vm, key, data);
                            })
                            .catch(console.error);
                    } else {
                        _data[key] = cloneDeep(data[key]);
                    }
                });
                initData(vm, _data);
            }
        }
    } else {
        initData(vm, {});
    }

    if (computed) {
        initComputed(vm, computed);
        watchComputed();
    }
}

function initData(vm, data) {
    Object.keys(data).forEach((key) => {
        Object.defineProperty(vm, key, {
            get() {
                return data[key];
            },
            set(val) {
                data[key] = val;
            },
        });
    });

    observe(data);
    Object.defineProperty(vm, '$data', {
        value: data,
    });
}

function setPartial(vm, key, val) {
    if (!hasOwn(vm, key)) {
        Object.defineProperty(vm, key, {
            get() {
                return vm.$data[key];
            },
            set(val) {
                vm.$data[key] = val;
            },
        });
    }

    set(vm.$data, key, val);
}

const computedWatcherOptions = { lazy: false };

function initComputed(vm, computed) {
    for (const key in computed) {
        defineComputed(vm, key, computed[key]);
    }
}

function reInitComputed(vm, computed) {
    resetComputed(vm);
    initComputed(vm, computed);
}

function defineComputed(vm, key, userDef) {
    const getter = function () {
        return compile(userDef, this, rootVm);
    };

    const watchers = vm._computedWatchers;

    // create internal watcher for the computed property.
    watchers[key] = new Watcher(vm, getter || noop, noop, computedWatcherOptions);

    if (key in vm.$data) {
        console.warn(`The computed property "${key}" is already defined in data.`, vm);
    } else {
        const shouldCache = true;
        sharedPropertyDefinition.get = shouldCache
            ? createComputedGetter(key)
            : createGetterInvoker(getter);
        sharedPropertyDefinition.set = noop;
        Object.defineProperty(vm, key, sharedPropertyDefinition);
    }
}

function createComputedGetter(key) {
    return function computedGetter() {
        const watcher = this._computedWatchers && this._computedWatchers[key];
        if (watcher) {
            if (watcher.dirty) {
                watcher.evaluate();
            }
            if (Dep.target) {
                watcher.depend();
            }
            return watcher.value;
        }
    };
}

function createGetterInvoker(fn) {
    return function computedGetter() {
        return fn.call(this, this);
    };
}

function initWatch(vm, watch) {
    for (const key in watch) {
        const handler = watch[key];
        if (Array.isArray(handler)) {
            for (let i = 0; i < handler.length; i++) {
                createWatcher(vm, key, handler[i]);
            }
        } else {
            createWatcher(vm, key, handler);
        }
    }
}

function createWatcher(vm, expOrFn, handler, options) {
    if (isPlainObject(handler)) {
        options = handler;
        handler = handler.handler;
    }
    options = options || {};
    options.user = true;
    const watcher = new Watcher(vm, expOrFn, handler, options);
    if (options.immediate) {
        try {
            handler.call(vm, watcher.value);
        } catch (error) {
            console.error(error, vm, `callback for immediate watcher "${watcher.expression}"`);
        }
    }
    return function unwatchFn() {
        watcher.teardown();
    };
}

export function remove(model) {
    let vm;
    if (model) {
        vm = modelToVm.get(model);
    } else {
        vm = modelToVm.get(rootModel);
    }
    if (!vm) return;
    if (vm._computedWatchers) {
        Object.keys(vm._computedWatchers).forEach((k) => {
            const watcher = vm._computedWatchers[k];
            watcher.teardown();
            delete vm._computedWatchers[k];
        });
    }
    if (vm._watchers) {
        vm._watchers.forEach((watcher) => {
            watcher.teardown();
        });
        vm._watchers.length = 0;
    }
    vmToModel.delete(vm);
    modelToVm.delete(model);
}

function resetComputed(vm) {
    if (vm._computedWatchers) {
        Object.keys(vm._computedWatchers).forEach((k) => {
            const watcher = vm._computedWatchers[k];
            watcher.teardown();
            delete vm._computedWatchers[k];
            delete vm[k];
        });
    }
}

export function reset() {
    // eslint-disable-next-line no-unused-vars
    for (const [vm] of vmToModel) {
        resetComputed(vm);
        if (vm._watchers) {
            vm._watchers.forEach((watcher) => {
                watcher.teardown();
            });
            vm._watchers.length = 0;
        }
    }
    vmToModel.clear();
    modelToVm.clear();
    rootVm = {};
}

export function update(props, model) {
    const vm = modelToVm.get(model) || rootVm;
    if (props.data) {
        Object.keys(props.data).forEach((key) => {
            const v = props.data[key];
            if (hasOwn(vm, key)) {
                if (vm[key] !== props.data[key]) {
                    const adaptor = findMatchedAdaptor(v);
                    if (adaptor) {
                        adaptor
                            .fetch(v)
                            .then((data) => {
                                setPartial(vm, key, data);
                                if (model) {
                                    reInitComputed(vm, model.computed);
                                }
                            })
                            .catch(console.error);
                    } else {
                        setPartial(vm, key, cloneDeep(v));
                    }
                }
            } else {
                setPartial(vm, key, cloneDeep(v));
            }
        });

        Object.keys(vm.$data).forEach((key) => {
            if (!hasOwn(props.data, key)) {
                delete vm.$data[key];
                delete vm[key];
            }
        });
    }

    // global 不支持 computed
    if (model && props.computed) {
        Object.keys(props.computed).forEach((key) => {
            if (vm._computedWatchers[key]) {
                vm._computedWatchers[key].teardown();
                delete vm[key];
            }
            defineComputed(vm, key, props.computed[key]);
        });

        Object.keys(vm._computedWatchers).forEach((key) => {
            if (!hasOwn(props.computed, key)) {
                const watcher = vm._computedWatchers[key];
                watcher.teardown();
                delete vm._computedWatchers[key];
                delete vm[key];
            }
        });
    }

    vm.$data.__ob__.dep.notify();
}

export function get(model) {
    return modelToVm.get(model || rootModel);
}
