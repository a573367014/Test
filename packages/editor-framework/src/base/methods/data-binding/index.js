import { initTemplate, reset, remove, update, get } from './store';
import { registerFilter } from './engine';
import { registerAdaptor } from './source';

export default {
    resetDataSource() {
        reset();
    },
    setDataSource(ds) {
        if (!ds.bindings) return;
        if (ds.bindings.global) {
            const { data } = ds.bindings.global;
            if (data) {
                initTemplate(this, undefined, data, undefined);
            }
        }

        this.walkTemplet((element) => {
            const key = element.dataBinding;
            const binding = ds.bindings[key];
            if (key && !binding) {
                console.warn('Can not find specified binding');
            }
            if (binding) {
                initTemplate(this, element, binding.data, binding.computed);
            }
        }, true);
    },
    addDataBinding(binding, el) {
        // el 没有指定的话，默认 global
        if (el) {
            const { $id } = el;
            if (el.dataBinding) {
                throw new Error('Model is bound！');
            }
            el.dataBinding = $id;
        }
        initTemplate(this, el, binding.data, binding.computed);
    },
    getDataBinding(el) {
        // el 没有指定的话，默认 global
        return get(el);
    },
    changeDataBinding(props, el) {
        // el 没有指定的话，默认 global
        update(props, el);
    },
    removeDataBinding(el) {
        // el 没有指定的话，默认 global
        delete el.dataBinding;
        remove(el);
    },
    installFilter(name, func) {
        registerFilter(name, func);
    },
    installDataAdaptor(adaptor) {
        registerAdaptor(adaptor);
    },
};
