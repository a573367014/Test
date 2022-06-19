<template>
    <div
        class="ge-slider__button-wrapper"
        :class="{
            'ge-slider__button-wrapper--dragging': initData.dragging,
        }"
        :style="wrapperStyle"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
        @mousedown="handleButtonDown"
    >
        <g-tooltip
            ref="tooltip"
            transitionName=""
            :mouseLeaveDelay="10"
            :visible="tooltipVisible"
            placement="top"
            :title="value"
        >
            <div class="ge-slider__button" />
        </g-tooltip>
    </div>
</template>

<script lang="ts">
import { defineComponent, reactive } from '@vue/composition-api';
import { useSliderButton } from './hooks/use-slider-button';
import Tooltip from '@gaoding/gd-antd/es/tooltip';

export default defineComponent({
    name: 'ge-slider-button',
    components: {
        GTooltip: Tooltip,
    },
    props: {
        value: {
            type: Number,
            default: 0,
        },
    },
    setup(props, { emit }) {
        const initData = reactive({
            hovering: false,
            dragging: false,
            isClick: false,
            startX: 0,
            currentX: 0,
            startY: 0,
            currentY: 0,
            startPosition: 0,
            newPosition: 0,
        });
        const {
            tooltipVisible,
            handleMouseLeave,
            handleMouseEnter,
            handleButtonDown,
            wrapperStyle,
            tooltip,
        } = useSliderButton(props, initData, emit);
        return {
            initData,
            tooltip,
            formatValue: 0,
            handleMouseLeave,
            handleMouseEnter,
            handleButtonDown,
            tooltipVisible,
            wrapperStyle,
        };
    },
});
</script>
