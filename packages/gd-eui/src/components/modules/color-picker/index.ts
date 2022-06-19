import '../../../init-setting';
import type { VueConstructor } from 'vue';
import GeColorPicker from './main-color-picker.vue';

// @ts-ignore 'install' does not exist
GeColorPicker.install = (Vue: VueConstructor) => {
    Vue.component(GeColorPicker.name, GeColorPicker);
};

export default GeColorPicker;
