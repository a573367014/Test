import '../../../init-setting';
import type { VueConstructor } from 'vue';
import GeAsideButton from './aside-button.vue';

// @ts-ignore 'install' does not exist
GeAsideButton.install = (Vue: VueConstructor) => {
    Vue.component(GeAsideButton.name, GeAsideButton);
};

export default GeAsideButton;
