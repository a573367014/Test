import '../../../init-setting';
import type { VueConstructor } from 'vue';
import GeXXX from './xxx.vue';

// @ts-ignore 'install' does not exist
GeXXX.install = (Vue: VueConstructor) => {
    Vue.component(GeXXX.name, GeXXX);
};

export default GeXXX;
