import { ISliderProps } from '../../../../types/slider';
import { computed, Ref, toRefs } from '@vue/composition-api';
import { useComputedPosition } from './use-computed-position';
import { fixedFloat } from '../../../../utils/index';

export const useMark = (props: ISliderProps, firstValue: Ref<Number>) => {
    const markNum = computed(() => {
        return props.step - 1;
    });
    const markStepNum = computed(() => {
        return fixedFloat(100 / (markNum.value + 1), 0);
    });
    const handleSliderMarkClick = (newPosition: number) => {
        const sliderProps = toRefs(props);
        const { value } = useComputedPosition(sliderProps, newPosition);
        firstValue.value = value;
    };
    return {
        markStepNum,
        handleSliderMarkClick,
        markNum,
    };
};
