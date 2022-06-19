import '../../../init-setting';
import type { VueConstructor } from 'vue';
import GeFooter from './footer.vue';

// @ts-ignore 'install' does not exist
GeFooter.install = (Vue: VueConstructor) => {
    Vue.component(GeFooter.name, GeFooter);
};

export default GeFooter;
