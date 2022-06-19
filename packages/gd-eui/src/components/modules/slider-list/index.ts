import '../../../init-setting';
import type { VueConstructor } from 'vue';
import GeSliderList from './slider-list.vue';

// @ts-ignore 'install' does not exist
GeSliderList.install = (Vue: VueConstructor) => {
    Vue.component(GeSliderList.name, GeSliderList);
};

export default GeSliderList;
