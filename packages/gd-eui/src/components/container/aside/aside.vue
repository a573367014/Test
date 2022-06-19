<template>
    <aside class="ge-aside" :style="style">
        <slot></slot>
    </aside>
</template>
<script lang="ts">
import { computed, defineComponent } from '@vue/composition-api';

export default defineComponent({
    name: 'GeAside',
    props: {
        width: {
            type: String,
            default: null,
        },
    },
    setup(props) {
        return {
            style: computed(() => {
                return props.width ? { width: props.width } : {};
            }),
        };
    },
});
</script>
