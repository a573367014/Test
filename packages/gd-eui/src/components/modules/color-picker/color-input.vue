<template>
    <div class="color-input">
        <div class="color-input__color__wrap">
            <Input
                ref="colorInputRef"
                :value="colorStrRef"
                class="color-input__focus"
                @input="handleUpdate"
                @keydown="handleColorKeyDown"
                @blur="handleColorBlur"
            />
        </div>
        <div class="color-input__alpha__wrap">
            <Input
                :value="alphaStr"
                class="color-input__focus"
                @focus="onAlphaFocus"
                @blur="onAlphaBlur"
                @keydown.enter="onAlphaEnter"
            />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, Ref, ref, watch } from '@vue/composition-api';
import { IColor } from '../../../types/color-picker';
import Input from '@gaoding/gd-antd/es/input';
import tinycolor from 'tinycolor2';
import { Nullable } from '../../../types/common';

export default defineComponent({
    name: 'ge-color-input',
    components: {
        Input,
    },
    model: {
        prop: 'value',
        event: 'change',
    },
    props: {
        value: {
            type: Object as PropType<IColor>,
            default: () => {
                return {
                    h: 0,
                    s: 0,
                    v: 0,
                    a: 1,
                    format: 'hsva',
                };
            },
        },
    },
    setup(props, { emit }) {
        const colorInputRef: Ref<Nullable<HTMLElement>> = ref(null);
        let alphaCache = 1;
        const colorToStr = (hsv: IColor) => {
            const color = tinycolor.fromRatio({
                h: hsv.h,
                s: hsv.s,
                v: hsv.v,
                a: hsv.a,
            });
            return color.toHexString().toUpperCase();
        };
        const colorStrRef = ref(colorToStr(props.value));
        const alphaStr = computed(() => {
            return Math.ceil(props.value.a * 100) + '%';
        });
        const formatFn = (value: string) => {
            const format = (val: string) => {
                if (val.length === 3) {
                    val = val
                        .split('')
                        .map((v) => v + v)
                        .join('');
                } else {
                    val += '00000';
                }

                val = val.slice(0, 6);
                return val;
            };
            value = value.replace(/^#/, '');
            return format(value);
        };
        const formatAndEmit = (val: string) => {
            const hexColor = formatFn(val);
            const hsv = tinycolor(hexColor).toHsv();
            emit('change', {
                h: hsv.h,
                s: hsv.s,
                v: hsv.v,
                a: props.value.a,
                format: 'hsva',
            });
            colorStrRef.value = '#' + hexColor;
        };
        watch(
            () => props.value,
            (val) => {
                colorStrRef.value = colorToStr(val);
            },
        );
        const handleUpdate = (e: Event) => {
            const value = (e.target as HTMLInputElement).value;
            if (value.length > 7) {
                formatAndEmit(value);
                return;
            }
            colorStrRef.value = value;
        };
        const handleColorKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Enter') {
                formatAndEmit((e.target as HTMLInputElement).value);
            }
        };
        const handleColorBlur = (e: Event) => {
            formatAndEmit((e.target as HTMLInputElement).value);
        };
        const onAlphaFocus = () => {
            alphaCache = props.value.a;
        };
        const alphaEnable = (value: number) => {
            if (Number.isNaN(value)) return false;
            return value >= 0 && value <= 100;
        };
        const confirmAlphaByEvent = (event: Event) => {
            const value = (event.target as HTMLInputElement).value;
            const parseValue = parseInt(value);
            const alhpa = alphaEnable(parseValue) ? parseValue / 100 : alphaCache;
            emit('change', {
                h: props.value.h,
                s: props.value.s,
                v: props.value.v,
                a: alhpa,
                format: 'hsva',
            });
            (event.target as HTMLInputElement).value = Math.ceil(alhpa * 100) + '%';
        };
        const onAlphaBlur = (event: Event) => {
            confirmAlphaByEvent(event);
        };
        const onAlphaEnter = (event: Event) => {
            confirmAlphaByEvent(event);
        };
        return {
            colorInputRef,
            colorStrRef,
            alphaStr,
            handleColorKeyDown,
            handleColorBlur,
            handleUpdate,
            onAlphaFocus,
            onAlphaBlur,
            onAlphaEnter,
        };
    },
});
</script>
