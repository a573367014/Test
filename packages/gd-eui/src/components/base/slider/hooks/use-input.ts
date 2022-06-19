import { ISliderProps } from '../../../../types/slider';
import { Nullable } from '../../../../types/common';
import { Ref, nextTick, shallowRef } from '@vue/composition-api';

export const useInput = (props: ISliderProps, firstValue: Ref<Number | String>) => {
    const sliderInput = shallowRef<Nullable<Vue>>(null);
    const handleChangeValue = (e: InputEvent) => {
        const value = e.target && (e.target as HTMLTextAreaElement).value;
        if (value === '') {
            firstValue.value = props.min;
        } else if (value) {
            if (+value > props.max) {
                firstValue.value = props.max;
            } else if (+value < props.min) {
                firstValue.value = props.min;
            } else {
                firstValue.value = +value;
            }
        }
    };
    const handleBlur = async (e: InputEvent) => {
        await nextTick();
        const value = e.target && (e.target as HTMLTextAreaElement).value;
        if (!sliderInput.value) return;
        const $el = sliderInput.value.$el as HTMLInputElement;
        if (value === '') {
            // 这边直接操作dom的原因是因为组件库的输入框 当全部删除值后会是一个空状态，不符合预期，手动调整为最小值
            $el.value = props.min.toString();
            firstValue.value = props.min;
        }
        if (value) {
            if (+value > props.max) {
                firstValue.value = props.max;
                $el.value = props.max.toString();
            } else if (+value < props.min) {
                firstValue.value = props.min;
                $el.value = props.min.toString();
            }
        }
    };
    return {
        handleChangeValue,
        handleBlur,
        sliderInput,
    };
};
