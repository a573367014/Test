import { parseFilters } from './filter-parser';
import { parseText } from './text-parser';
import { parsePath } from '../util';

const expRE = /[^{{]*{{[^}]*}}.*$/m;

const _f = getFilter;
const _s = (a) => (a === undefined ? '' : a.toString());

export function compile(template, vm, rootVm) {
    if (!template) return;

    let code;
    if (expRE.test(template)) {
        code = parseText(template).expression;
    } else {
        code = parseFilters(template);
    }

    const _d = (key) => {
        // TODO@YUDAN: 添加布局能力后，支持父作用域
        const accessor = parsePath(key, vm._alias);
        const val = accessor(vm);
        return val === undefined ? accessor(rootVm) : val;
    };

    // eslint-disable-next-line no-new-func
    const func = new Function('_f', '_s', '_d', `return ${code}`);
    return func.call(vm, _f, _s, _d);
}

const filters = {};

export function registerFilter(name, func) {
    filters[name] = func;
}

function getFilter(name) {
    return filters[name];
}
