import '../../../init-setting';
import type { VueConstructor } from 'vue';
import GeContainer from './container.vue';

// @ts-ignore 'install' does not exist
GeContainer.install = (Vue: VueConstructor) => {
    Vue.component(GeContainer.name, GeContainer);
};

export default GeContainer;
