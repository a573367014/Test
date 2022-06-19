<template>
    <div class="gradient-picker-panel">
        <div class="gradient-picker-panel__wrap">
            <div class="gradient-picker-panel__header">
                <gradient-picker
                    ref="gradientColorRef"
                    v-model="gradientColor"
                    @stepClick="onGradientStepClick"
                    @change="onGradientChange"
                />
                <degree-input v-model="degreeValue" @change="onDegreeChange" />
            </div>
        </div>
        <color-picker-panel
            :swatchesList="swatchesList"
            v-model="pickerColor"
            @change="onColorPickerChange"
        />
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType, Ref, ref, shallowRef, watch } from '@vue/composition-api';
import { IColor, IGradientColor } from '../../../types/color-picker';
import ColorPickerPanel from './color-picker-panel.vue';
import GradientPicker from './gradient-picker.vue';
import DegreeInput from './degree-input.vue';
import { Nullable } from '../../../types/common';
import { GradientPickerHTMLElement } from '../../../types/gradient-picker';
import { ISwatches } from '../../../types/swatches-list';
import { getTransformationIColor } from '../../../utils/get-transformation-color';

/**
 * 渐变色选择器组件
 *
 * props:
 * value(v-model): Array<IGradientColor>
 * degree: Number
 *
 * change
 * changeDegree
 */
export default defineComponent({
    name: 'ge-gradient-picker-panel',
    components: {
        ColorPickerPanel,
        GradientPicker,
        DegreeInput,
    },
    model: {
        prop: 'value',
        event: 'change',
    },
    props: {
        swatchesList: {
            type: Array as PropType<Array<ISwatches>>,
            default: () => [],
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
        degree: {
            type: Number,
            default: 0,
        },
    },
    setup(props, { emit }) {
        const gradientColor = ref(props.value);
        const pickerColor = ref({ ...getTransformationIColor(props.value[0].color) });
        const degreeValue = ref(props.degree);
        const gradientColorRef: Ref<Nullable<HTMLElement>> =
            shallowRef<Nullable<HTMLElement>>(null);
        watch(
            () => props.value,
            (newValue) => {
                if (!newValue || !newValue.length) {
                    return;
                }
                gradientColor.value = newValue;
            },
        );
        watch(
            () => props.degree,
            (newValue) => {
                degreeValue.value = newValue;
            },
        );
        const onGradientChange = (steps: Array<IGradientColor>) => {
            emit('change', steps);
        };
        const onColorPickerChange = (color: IColor) => {
            (gradientColorRef.value as GradientPickerHTMLElement).setCurrentStepColor(color);
        };
        const onGradientStepClick = (item: IGradientColor) => {
            pickerColor.value = { ...getTransformationIColor(item.color) };
        };
        const onDegreeChange = (degree: number) => {
            emit('changeDegree', degree);
        };
        return {
            degreeValue,
            gradientColor,
            gradientColorRef,
            pickerColor,
            onColorPickerChange,
            onGradientStepClick,
            onGradientChange,
            onDegreeChange,
        };
    },
});
</script>
