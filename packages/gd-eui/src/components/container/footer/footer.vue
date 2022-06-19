<template>
    <footer class="ge-footer" :style="style">
        <slot></slot>
    </footer>
</template>
<script lang="ts">
import { computed, defineComponent } from '@vue/composition-api';

export default defineComponent({
    name: 'GeFooter',
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
