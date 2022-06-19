import type { DirectiveUnit } from '.';

const DIRECTIVE_NAME = 'ge-click-outside';

const ClickOutSideDirective: DirectiveUnit = {
    name: DIRECTIVE_NAME,
    install: (Vue) => {
        Vue.directive(DIRECTIVE_NAME, ClickOutSideDirective);
    },
    bind(el: any, binding: any, vNode: any) {
        // Provided expression must evaluate to a function.
        if (typeof binding.value !== 'function') {
            const compName = vNode.context.name;
            let warn = `[Vue-ge-click-outside:] provided expression '${binding.expression}' is not a function, but has to be`;
            if (compName) {
                warn += `Found in component '${compName}'`;
            }
            // tslint:disable-next-line
            console.warn(warn);
        }
        // Define Handler and cache it on the element
        const bubble = binding.modifiers.bubble;
        const handler = (e: any) => {
            if (bubble || (!el.contains(e.target) && el !== e.target)) {
                binding.value(e);
            }
        };
        el.__vueClickOutside__ = handler;
        // add Event Listeners
        document.addEventListener('click', handler);
    },

    unbind(el: any) {
        // Remove Event Listeners
        document.removeEventListener('click', el.__vueClickOutside__);
        el.__vueClickOutside__ = null;
    },
};

export default ClickOutSideDirective;
