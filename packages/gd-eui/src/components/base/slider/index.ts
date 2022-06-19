import '../../../init-setting';
import type { VueConstructor } from 'vue';
import GeSlider from './slider.vue';

// @ts-ignore 'install' does not exist
GeSlider.install = (Vue: VueConstructor) => {
    Vue.component(GeSlider.name, GeSlider);
};

export default GeSlider;
