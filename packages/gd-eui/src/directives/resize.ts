import ResizeObserverPolyfill from 'resize-observer-polyfill';
import type { DirectiveUnit } from '.';

const DIRECTIVE_NAME = 'ge-resize';

interface bounding {
    width: number;
    height: number;
}

interface ObserverTarget extends HTMLElement {
    onGeResize?: (size: bounding) => void;
}

const GeResizeObserver = new ResizeObserverPolyfill((entries: ResizeObserverEntry[]) => {
    for (const entry of entries) {
        const targetDom = entry.target as ObserverTarget;
        const size: bounding = {
            width: targetDom.offsetWidth,
            height: targetDom.offsetHeight,
        };
        targetDom.onGeResize?.(size);
    }
});

const ResizeDirective: DirectiveUnit = {
    name: DIRECTIVE_NAME,
    install: (Vue) => {
        Vue.directive(DIRECTIVE_NAME, ResizeDirective);
    },
    bind(el, binding) {
        if (typeof binding.value !== 'function') return;
        (el as any).onGeResize = binding.value;
        GeResizeObserver.observe(el);
    },
    update(el, binding) {
        if (typeof binding.value !== 'function') return;
        (el as any).onGeResize = binding.value;
    },
    unbind(el) {
        (el as any).onGeResize = null;
        GeResizeObserver.unobserve(el);
    },
};

export default ResizeDirective;
