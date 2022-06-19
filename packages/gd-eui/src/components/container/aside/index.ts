import '../../../init-setting';
import type { VueConstructor } from 'vue';
import GeAside from './aside.vue';

// @ts-ignore 'install' does not exist
GeAside.install = (Vue: VueConstructor) => {
    Vue.component(GeAside.name, GeAside);
};

export default GeAside;
