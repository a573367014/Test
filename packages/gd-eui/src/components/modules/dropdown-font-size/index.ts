import '../../../init-setting';
import type { VueConstructor } from 'vue';
import GeDropdownFontSize from './dropdown-font-size.vue';

// @ts-ignore 'install' does not exist
GeDropdownFontSize.install = (Vue: VueConstructor) => {
    Vue.component(GeDropdownFontSize.name, GeDropdownFontSize);
};

export default GeDropdownFontSize;
