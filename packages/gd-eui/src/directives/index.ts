import type { DirectiveOptions, VueConstructor } from 'vue/types/umd';
import ResizeDirective from './resize';
import ClickOutSideDirective from './click-outside';
export interface DirectiveUnit extends DirectiveOptions {
    name: string;
    install: (Vue: VueConstructor) => void;
}

const directives = [ResizeDirective, ClickOutSideDirective];

export default {
    install(Vue: VueConstructor) {
        directives.forEach((directive) => {
            !Vue.component(directive.name) && Vue.directive(directive.name, directive);
        });
    },
};
