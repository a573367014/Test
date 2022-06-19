import '../../../init-setting';
import type { VueConstructor } from 'vue';
import GeStylePreview from './style-preview.vue';

// @ts-ignore 'install' does not exist
GeStylePreview.install = (Vue: VueConstructor) => {
    Vue.component(GeStylePreview.name, GeStylePreview);
};

export default GeStylePreview;
