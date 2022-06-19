import '../../../init-setting';
import type { VueConstructor } from 'vue';
import GeCategoryTag from './category-tag.vue';

// @ts-ignore 'install' does not exist
GeCategoryTag.install = (Vue: VueConstructor) => {
    Vue.component(GeCategoryTag.name, GeCategoryTag);
};

export default GeCategoryTag;
