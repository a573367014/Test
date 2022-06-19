import { ISliderProps } from '../../../../types/slider';
import { computed, Ref } from '@vue/composition-api';

export const useSelect = (props: ISliderProps, firstValue: Ref<Number>) => {
    const handleSelect = (value: number) => {
        firstValue.value = value;
    };
    const selectOptions = computed(() => {
        let step = props.step;
        if (props.showSelect && step === 1) {
            step = 5; // 当下拉模式时，step为1 默认设为5
        }
        const baseNum = props.max / step;
        const arr = [0];
        let currentVal = 0;
        for (let i = 0; i < step; i++) {
            currentVal = currentVal + baseNum;
            arr.push(currentVal);
        }
        return arr;
    });
    return {
        handleSelect,
        selectOptions,
    };
};
