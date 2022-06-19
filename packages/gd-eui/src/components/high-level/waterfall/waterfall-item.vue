<template>
    <div ref="waterfallSlotNode" class="ge-waterfall-item" :class="ITEM_CLASS_NAME" v-show="isShow">
        <slot></slot>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, toRefs, onMounted, onUnmounted } from '@vue/composition-api';

import eventBus from '../../../utils/event';
import { ITEM_CLASS_NAME } from '../../../utils/constants';

export default defineComponent({
    name: 'waterfall-slot',
    props: {
        width: {
            required: true,
            type: Number,
            validator: (val: number) => val >= 0,
        },
        height: {
            required: true,
            type: Number,
            validator: (val: number) => val >= 0,
        },
        order: {
            type: Number,
            default: 0,
        },
        moveClass: {
            type: String,
            default: '',
        },
    },
    setup(props) {
        const isShow = ref<boolean>(false);

        const notify = () => {
            eventBus.emit('reflow');
        };

        const rect = { detail: { top: 0, left: 0, width: 0, height: 0 } };

        const waterfallSlotNode = ref(null);
        const { width, height, order, moveClass } = toRefs(props);

        const getMeta = () => {
            return {
                rect,
                node: waterfallSlotNode.value,
                order: order.value,
                width: width.value,
                height: height.value,
                moveClass: moveClass.value,
            };
        };
        // if (isVue3) {
        //     expose({ getMeta });
        // }

        watch(() => [width.value, height.value], notify);

        onMounted(() => {
            eventBus.on('reflowed', function showSlot() {
                isShow.value = true;
                eventBus.off('reflowed', showSlot);
            });
            notify();
        });
        onUnmounted(() => {
            notify();
        });

        return {
            isShow,
            waterfallSlotNode,
            // 返回是因为需要在vue2中获取
            getMeta,
            ITEM_CLASS_NAME,
        };
    },
});
</script>
