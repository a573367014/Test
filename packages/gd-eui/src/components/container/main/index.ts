import '../../../init-setting';
import type { VueConstructor } from 'vue';
import GeMain from './main.vue';

// @ts-ignore 'install' does not exist
GeMain.install = (Vue: VueConstructor) => {
    Vue.component(GeMain.name, GeMain);
};

export default GeMain;
