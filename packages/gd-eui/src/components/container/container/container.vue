<template>
    <section class="ge-container" :class="{ 'is-vertical': isVertical }">
        <slot></slot>
    </section>
</template>
<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import type { VNode } from 'vue';

export default defineComponent({
    name: 'GeContainer',
    props: {
        direction: {
            type: String,
            default: '',
        },
    },
    setup(props, { slots }) {
        const isVertical = computed(() => {
            if (props.direction === 'vertical') {
                return true;
            } else if (props.direction === 'horizontal') {
                return false;
            }
            if (slots && slots.default) {
                const vNodes: VNode[] = slots.default();
                return vNodes.some((vNode) => {
                    const tag = vNode.tag;
                    return tag?.includes('GeHeader') || tag?.includes('GeFooter');
                });
            } else {
                return false;
            }
        });
        return {
            isVertical,
        };
    },
});
</script>
