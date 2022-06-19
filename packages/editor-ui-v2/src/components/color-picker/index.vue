<template>
    <ColorPicker ref="colorPicker" v-bind="attrs" v-on="listeners" />
</template>

<script lang="ts">
import { defineComponent, inject, computed, ref, Ref } from '@vue/composition-api';
import { EDITOR_UI_PROVIDER_KEY, Config, defaultConfig } from '../../base/config-provider/provide';
import ColorPicker from './color-picker.vue';

export default defineComponent({
    components: {
        ColorPicker,
    },
    setup(props, { attrs, listeners }) {
        const colorPicker = ref<{ strawActivated: boolean }>();
        const config = inject<Ref<Config>>(EDITOR_UI_PROVIDER_KEY, ref(defaultConfig));

        const inheritAttrs = computed(() => {
            if (!config) return attrs;
            attrs.enablePalette = config.value.enablePalette !== false;
            attrs.enableDefaultPresetColor = config.value.enableDefaultPresetColor !== false;
            return attrs;
        });

        return {
            attrs: inheritAttrs,
            listeners,
            colorPicker,
            // TODO：父组件依赖此状态处理
            strawActivated: computed(() => {
                return colorPicker?.value?.strawActivated;
            }),
        };
    },
});
</script>
