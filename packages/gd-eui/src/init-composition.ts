import VueCompositionAPI from '@vue/composition-api';
import Vue from 'vue';

function install() {
    // @ts-ignore
    if (Vue && !Vue.__composition_api_installed__) Vue.use(VueCompositionAPI);
}

install();
