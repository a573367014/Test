import '../../../init-setting';
import type { VueConstructor } from 'vue';
import GeStyleBackground from './style-background.vue';

// @ts-ignore 'install' does not exist
GeStyleBackground.install = (Vue: VueConstructor) => {
    Vue.component(GeStyleBackground.name, GeStyleBackground);
};

export default GeStyleBackground;
