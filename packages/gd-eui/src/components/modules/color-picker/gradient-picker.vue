<template>
    <div class="gradient-picker" ref="containerRef">
        <check-board class="gradient-picker__checkboard" />
        <div
            class="gradient-picker__background"
            :style="{ backgroundImage: getGradientString(0, value) }"
        ></div>
        <div
            class="gradient-picker__step__container"
            @mousedown.self="handleBackgroundMousedown"
            tabindex="1"
            @keydown="handleKeydown"
        >
            <div
                class="gradient-picker__step"
                :class="{ 'gradient-picker__step__current': currentStepIndex === stepIndex }"
                v-for="(step, stepIndex) in value"
                :key="stepIndex"
                :style="{ left: `calc(${step.offset * 100}% - 8px)` }"
                @mousedown.stop="handleStepMousedown(step, stepIndex)"
                @dragstart.prevent
            >
                <span
                    class="gradient-picker__step__inner"
                    :style="{
                        backgroundImage: getGradientString(0, value),
                        width: containerWidth + 'px',
                        backgroundPositionX: (14 - containerWidth) * step.offset + 'px',
                    }"
                ></span>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType, Ref, shallowRef, onMounted, ref } from '@vue/composition-api';
import { IColor, IGradientColor } from '../../../types/color-picker';
import tinycolor from 'tinycolor2';
import { Nullable } from '../../../types/common';
import CheckBoard from './check-board.vue';
import { cloneDeep } from 'lodash';
import { getGradientString } from '../../../utils/get-gradient-string';
import { getTransformationIColor } from '../../../utils/get-transformation-color';
// import { getColorStringByIColor } from '../../../utils/get-color-string-by-icolor';

/**
 * limitMin
 * value（v-model）
 *
 * change
 * stepClick
 */
export default defineComponent({
    name: 'ge-gradient-picker',
    components: {
        CheckBoard,
    },
    model: {
        prop: 'value',
        event: 'change',
    },
    props: {
        limitMin: {
            type: Number,
            default: 1,
        },
        value: {
            type: Array as PropType<Array<IGradientColor>>,
            default: () => [
                {
                    color: {
                        h: 0,
                        s: 1.0,
                        v: 1.0,
                        a: 1,
                        format: 'hsva',
                    },
                    offset: 0,
                },
            ],
        },
    },
    setup(props, { emit }) {
        const containerRef: Ref<Nullable<HTMLElement>> = shallowRef<Nullable<HTMLElement>>(null);
        const containerWidth = ref(0);
        const currentStepIndex = ref(0);
        onMounted(() => {
            const target = containerRef?.value;
            if (!target) {
                return;
            }
            containerWidth.value = target.getBoundingClientRect().width;
        });
        const getOffsetByEvent = (event: Event) => {
            const target = containerRef?.value;
            if (!target) {
                return 0;
            }
            const reactDom = target.getBoundingClientRect();
            const elLeft = reactDom.left;
            const offsetLeft = (event as MouseEvent).pageX - elLeft;
            return offsetLeft / reactDom.width;
        };
        const emitChange = (steps: IGradientColor[]) => {
            emit('change', steps);
        };
        const handleStepMousedown = (item: IGradientColor, index: number) => {
            currentStepIndex.value = index;
            handleStepClick(item, index);
            const handleMousemove = (event: MouseEvent) => {
                const steps = cloneDeep(props.value);
                const step = steps[currentStepIndex.value];
                step.offset = Math.min(Math.max(0, getOffsetByEvent(event)), 1);
                emitChange(steps);
            };
            document.addEventListener('mousemove', handleMousemove);
            const unbindEventListeners = () => {
                document.removeEventListener('mousemove', handleMousemove);
                document.removeEventListener('mouseup', unbindEventListeners);
            };
            document.addEventListener('mouseup', () => {
                unbindEventListeners();
            });
        };
        const getStepIndexByOffset = (offset: number, steps: Array<IGradientColor>) => {
            if (!steps.length) {
                return 0;
            }
            const leftStep = steps.find(
                (step, stepIndex) =>
                    step.offset < offset &&
                    steps[stepIndex + 1] &&
                    steps[stepIndex + 1].offset > offset,
            );
            return leftStep === undefined
                ? offset < steps[0].offset
                    ? 0
                    : steps.length
                : steps.indexOf(leftStep) + 1;
        };
        const getColorByOffset = (offset: number, steps: Array<IGradientColor>) => {
            const index = getStepIndexByOffset(offset, steps);
            const leftStop = steps[index - 1] || { color: steps[0].color, offset: 0 };
            const rightStop = steps[index] || { color: steps[steps.length - 1].color, offset: 100 };
            const leftRgb = tinycolor({ ...getTransformationIColor(leftStop.color) }).toRgb();
            const rightRgb = tinycolor({ ...getTransformationIColor(rightStop.color) }).toRgb();

            const gap = rightStop.offset - leftStop.offset;
            const offsetToLeft = offset - leftStop.offset;
            const weight1 = offsetToLeft / gap;
            const weight2 = 1 - weight1;
            const rgbArray = [
                leftRgb.r * weight2 + rightRgb.r * weight1,
                leftRgb.g * weight2 + rightRgb.g * weight1,
                leftRgb.b * weight2 + rightRgb.b * weight1,
                leftRgb.a * weight2 + rightRgb.a * weight1,
            ].map(Math.round);
            const color = tinycolor({
                r: rgbArray[0],
                g: rgbArray[1],
                b: rgbArray[2],
                a: rgbArray[3],
            });
            return color.toHsv();
        };
        const handleBackgroundMousedown = (event: Event) => {
            if (!props?.value.length) {
                return;
            }
            const offset = getOffsetByEvent(event);
            const steps = cloneDeep(props.value);
            const color = getColorByOffset(offset, steps);
            const step: IGradientColor = {
                color: {
                    ...color,
                    format: 'hsva',
                },
                offset,
            };
            steps.push(step);
            currentStepIndex.value = steps.length - 1;
            handleStepClick(step, currentStepIndex.value);
            emitChange(steps);
        };
        const handleKeydown = (event: KeyboardEvent) => {
            if (!props?.value.length) {
                return;
            }
            if (['Delete', 'Backspace'].includes(event.key)) {
                event.stopPropagation();
                const steps = cloneDeep(props.value);
                if (steps.length <= props.limitMin) {
                    return;
                }
                steps.splice(currentStepIndex.value, 1);
                currentStepIndex.value = steps.length - 1;
                emitChange(steps);
            }
        };

        const handleStepClick = (item: IGradientColor, index: number) => {
            emit('stepClick', item, index);
        };

        // api
        const setCurrentStepColor = (color: IColor) => {
            const index = currentStepIndex.value;
            if (index >= props.value.length) {
                return;
            }
            const steps = cloneDeep(props.value);
            const step = steps[currentStepIndex.value];
            step.color = color;
            emitChange(steps);
        };
        const getCurrentStep = () => {
            const index = currentStepIndex.value;
            if (index >= props.value.length) {
                return null;
            }
            return props.value[index];
        };

        return {
            currentStepIndex,
            containerRef,
            containerWidth,
            getGradientString,
            handleStepMousedown,
            handleBackgroundMousedown,
            handleStepClick,
            handleKeydown,
            getCurrentStep,
            setCurrentStepColor,
        };
    },
});
</script>
