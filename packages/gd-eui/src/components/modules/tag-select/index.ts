import '../../../init-setting';
import type { VueConstructor } from 'vue';
import GeTagSelect from './tag-select.vue';

// @ts-ignore 'install' does not exist
GeTagSelect.install = (Vue: VueConstructor) => {
    Vue.component(GeTagSelect.name, GeTagSelect);
};

export default GeTagSelect;
