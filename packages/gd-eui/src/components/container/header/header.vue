<template>
    <header class="ge-header" :style="style">
        <slot></slot>
    </header>
</template>
<script lang="ts">
import { computed, defineComponent } from '@vue/composition-api';

export default defineComponent({
    name: 'GeHeader',
    props: {
        height: {
            type: String,
            default: null,
        },
    },
    setup(props) {
        return {
            style: computed(() =>
                props.height
                    ? {
                          height: props.height,
                      }
                    : {},
            ),
        };
    },
});
</script>
