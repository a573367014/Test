import { getGradientString } from '../../../../utils/get-gradient-string';
import { isNull, isUndefined } from 'lodash';
import tinycolor from 'tinycolor2';
import { computed, Ref, ref } from '@vue/composition-api';
import { IGradientColor, ColorPickerType, InputColor, IColor } from '../../../../types';
import { getTransformationIColor } from '../../../../utils/get-transformation-color';

export const checkIColor = (value: InputColor) => {
    if (typeof value === 'string') {
        return true;
    }
    return !isUndefined(value) && !isNull(value) && !(value instanceof Array);
};

export const checkIGradientColor = (value: InputColor) => {
    return !isUndefined(value) && !isNull(value) && value instanceof Array;
};

export const usePreview = (value: Ref<InputColor>, _deg: Ref<number>) => {
    const colorValue = ref();
    const gradientValue = ref();
    const colorTypeValue = ref(ColorPickerType.SINGLE);
    if (checkIColor(value.value)) {
        colorValue.value = getTransformationIColor(value.value as IColor | string);
        colorTypeValue.value = ColorPickerType.SINGLE;
    }
    if (checkIGradientColor(value.value)) {
        gradientValue.value = value.value;
        colorTypeValue.value = ColorPickerType.GRADIENT;
    }
    const preview = computed(() => {
        if (checkIColor(value.value)) {
            if (typeof value.value === 'string') {
                return value.value;
            }
            const color = tinycolor.fromRatio({
                h: colorValue.value.h,
                s: colorValue.value.s,
                v: colorValue.value.v,
                a: colorValue.value.a,
            });
            return color.toHexString().toUpperCase();
        }
        if (checkIGradientColor(value.value)) {
            gradientValue.value = value.value;
            return getGradientString(_deg.value, gradientValue.value as IGradientColor[]);
        }
        return '';
    });

    return {
        colorValue,
        gradientValue,
        colorTypeValue,
        preview,
    };
};
