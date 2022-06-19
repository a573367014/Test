import '../../../init-setting';
import type { VueConstructor } from 'vue';
import GePopoverInput from './popover-input.vue';

// @ts-ignore 'install' does not exist
GePopoverInput.install = (Vue: VueConstructor) => {
    Vue.component(GePopoverInput.name, GePopoverInput);
};

export default GePopoverInput;
