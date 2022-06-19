import '../../../init-setting';
import type { VueConstructor } from 'vue';
import GeHeader from './header.vue';

// @ts-ignore 'install' does not exist
GeHeader.install = (Vue: VueConstructor) => {
    Vue.component(GeHeader.name, GeHeader);
};

export default GeHeader;
