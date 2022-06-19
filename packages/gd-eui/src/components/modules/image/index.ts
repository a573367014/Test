import '../../../init-setting';
import type { VueConstructor } from 'vue';
import GeImage from './image.vue';

// @ts-ignore 'install' does not exist
GeImage.install = (Vue: VueConstructor) => {
    Vue.component(GeImage.name, GeImage);
};

export default GeImage;
