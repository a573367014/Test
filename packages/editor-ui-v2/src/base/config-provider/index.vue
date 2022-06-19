<script lang="ts">
import { defineComponent, provide, PropType, computed } from '@vue/composition-api';
import { EDITOR_UI_PROVIDER_KEY, Config } from './provide';

export default defineComponent({
    props: {
        config: {
            type: Object as PropType<Config>,
            default: () => ({}),
        },
    },
    setup(props, { slots }) {
        const config = computed(() => props.config);

        provide(EDITOR_UI_PROVIDER_KEY, config);

        return () => slots.default?.();
    },
});
</script>
