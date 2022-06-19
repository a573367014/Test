import { computed, shallowRef, toRefs } from '@vue/composition-api';
import { ISliderProps, ISliderInitData } from '../../../../types/slider';
import { Nullable } from '../../../../types/common';
import { useComputedPosition } from './use-computed-position';
import { computedMiddleModePercent } from './use-slider-button';

const SLIDER_HEIGHT = '2px';
const FLEX_DIRECTION_COLUMN = 'column';
const FLEX_DIRECTION_ROW = 'row';

export const useSlider = (props: ISliderProps, initData: ISliderInitData, emit: Function) => {
    const slider = shallowRef<Nullable<HTMLElement>>(null);
    const resetSize = () => {
        if (slider.value) {
            initData.sliderSize = props.vertical
                ? slider.value.clientHeight
                : slider.value.clientWidth;
        }
    };
    const sliderStyle = computed(() => {
        return {
            flexDirection:
                props.vertical || !props.labelSingleLine
                    ? FLEX_DIRECTION_COLUMN
                    : FLEX_DIRECTION_ROW,
        };
    });
    const trackStyle = computed(() => {
        if (props.vertical) {
            return {
                height: props.height,
                width: SLIDER_HEIGHT,
                background: props.backgroundColor,
            };
        }
        return {
            height: SLIDER_HEIGHT,
            width: '100%',
            background: props.backgroundColor,
        };
    });

    const barStyle = computed(() => {
        const { firstValue } = initData;
        const currentVal = ((firstValue - props.min) / (props.max - props.min)) * 100;
        // 中间模式
        if (props.middleMode) {
            const { middle, min, max } = props;
            const diffPercent = computedMiddleModePercent(firstValue, middle, min, max);
            if (firstValue === middle) {
                return {
                    left: '50%',
                    height: '100%',
                    width: '0%',
                    background: props.backgroundActiveColor,
                };
                // 左滑
            } else if (firstValue < middle) {
                return {
                    right: '50%',
                    height: '100%',
                    width: `${diffPercent * 100}%`,
                    background: props.backgroundActiveColor,
                };
                // 右滑
            } else if (firstValue > middle) {
                return {
                    left: '50%',
                    height: '100%',
                    width: `${diffPercent * 100}%`,
                    background: props.backgroundActiveColor,
                };
            }
        }
        //  垂直模式
        if (props.vertical) {
            return {
                width: '100%',
                height: `${currentVal}%`,
                background: props.backgroundActiveColor,
                bottom: 0,
            };
        }
        return {
            height: '100%',
            width: `${currentVal}%`,
            background: props.backgroundActiveColor,
        };
    });

    const handleSliderClick = (event: Event) => {
        if (props.disabled || initData.dragging || !slider.value) return;
        resetSize();
        const sliderProps = toRefs(props);
        let newPosition = 0;
        if (props.vertical) {
            const sliderOffsetBottom = slider.value.getBoundingClientRect().bottom;
            newPosition =
                ((sliderOffsetBottom - (event as MouseEvent).clientY) / initData.sliderSize) * 100;
        } else {
            const sliderOffsetLeft = slider.value.getBoundingClientRect().left;
            newPosition =
                (((event as MouseEvent).clientX - sliderOffsetLeft) / initData.sliderSize) * 100;
        }
        const { value } = useComputedPosition(sliderProps, newPosition);
        emit(value);
        initData.firstValue = value;
    };
    return {
        sliderStyle,
        trackStyle,
        barStyle,
        slider,
        resetSize,
        handleSliderClick,
    };
};
