import './init-composition';
import { VueConstructor } from 'vue';
import GeDirectives from './directives';
import GePlugins from './plugins';

export * from './components';
export * from './types';
export default {
    install: (Vue: VueConstructor) => {
        Vue.use(GeDirectives);
        Vue.use(GePlugins);
        return Vue;
    },
};
