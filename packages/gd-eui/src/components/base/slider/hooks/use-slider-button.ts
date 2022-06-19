import { computed, inject, nextTick, Ref, ref } from '@vue/composition-api';
import debounce from 'lodash/debounce';
import {
    ISliderButtonInitData,
    ISliderButtonProps,
    ISliderProvider,
} from '../../../../types/slider';
import { off, on } from '../../../../utils/index';
import { INPUT_EVENT } from '../../../../utils/constants';
import { useComputedPosition } from './use-computed-position';

const useTooltip = (showTooltip: Ref<boolean>) => {
    const tooltipVisible = ref(false);
    const tooltip = ref(null);

    const displayTooltip = debounce(() => {
        showTooltip.value && (tooltipVisible.value = true);
    }, 50);

    const hideTooltip = debounce(() => {
        tooltipVisible.value = false;
    }, 50);

    return {
        tooltip,
        hideTooltip,
        displayTooltip,
        tooltipVisible,
    };
};
/**
 * 计算中间模式下按钮移动的百分比值
 * @param currentVal
 * @param middleVal
 * @param leftVal
 * @param rightVal
 */
export const computedMiddleModePercent = (
    currentVal: number,
    middleVal: number,
    leftVal: number,
    rightVal: number,
) => {
    let diffPercent = 0;
    if (currentVal < middleVal) {
        const per = Math.abs(middleVal - currentVal);
        // 除2的原因在于计算的值是按100%去算的,但是实际只占50%，因此要/2
        diffPercent = per / (middleVal - leftVal) / 2;
    } else {
        const per = currentVal - middleVal;
        diffPercent = per / (rightVal - middleVal) / 2;
    }
    return diffPercent;
};

export const useSliderButton = (
    props: ISliderButtonProps,
    initData: ISliderButtonInitData,
    emit: (event: string, ...args: any[]) => void,
) => {
    const sliderProps = inject<ISliderProvider>('SliderProvider') as ISliderProvider;
    const { middleMode, middle, showTooltip, disabled, vertical, min, max, sliderSize, resetSize } =
        sliderProps;
    const currentPosition = computed(() => {
        if (middleMode.value) {
            if (props.value === middle.value) {
                return '50%';
                // 左滑态
            } else if (props.value < middle.value) {
                const diffPercent = computedMiddleModePercent(
                    props.value,
                    middle.value,
                    min.value,
                    max.value,
                );
                return `${(0.5 - diffPercent) * 100}%`;
                // return `${
                //     ((props.value - middleLeftNum.value) / (middle.value - middleLeftNum.value)) *
                //     0.5 *
                //     100
                // }%`;
                // 右滑态
            } else if (props.value > middle.value) {
                const diffPercent = computedMiddleModePercent(
                    props.value,
                    middle.value,
                    min.value,
                    max.value,
                );
                return `${(0.5 + diffPercent) * 100}%`;
                // return `${
                //     (0.5 +
                //         ((props.value - middle.value) / (middleRightNum.value - middle.value)) *
                //             0.5) *
                //     100
                // }%`;
            }
        }
        return `${((props.value - min.value) / (max.value - min.value)) * 100}%`;
    });

    const { tooltipVisible, displayTooltip, hideTooltip, tooltip } = useTooltip(showTooltip);
    const wrapperStyle = computed(() => {
        return vertical.value ? { bottom: currentPosition.value } : { left: currentPosition.value };
    });
    const handleMouseEnter = () => {
        initData.hovering = true;
        displayTooltip();
    };

    const handleMouseLeave = () => {
        initData.hovering = false;
        if (!initData.dragging) {
            hideTooltip();
        }
    };
    const handleButtonDown = (event: Event) => {
        if (disabled.value) return;
        event.preventDefault();
        event.stopPropagation();
        onDragStart(event);
        on(window, 'mousemove', onDragging);
        on(window, 'mouseup', onDragEnd);
    };
    const onDragStart = (event: Event) => {
        initData.dragging = true;
        initData.isClick = true;
        const { clientX, clientY } = getClientXY(event);
        if (vertical.value) {
            initData.startY = clientY;
        } else {
            initData.startX = clientX;
        }
        initData.startPosition = parseFloat(currentPosition.value);
        initData.newPosition = initData.startPosition;
    };
    const onDragging = (event: Event) => {
        if (initData.dragging) {
            initData.isClick = false;
            displayTooltip();
            resetSize();
            let diff: number;
            const { clientX, clientY } = getClientXY(event);
            if (vertical.value) {
                initData.currentY = clientY;
                diff = ((initData.startY - initData.currentY) / sliderSize.value) * 100;
            } else {
                initData.currentX = clientX;
                diff = ((initData.currentX - initData.startX) / sliderSize.value) * 100;
            }
            initData.newPosition = initData.startPosition + diff;
            setPosition(initData.newPosition);
        }
    };
    const onDragEnd = () => {
        if (initData.dragging) {
            setTimeout(() => {
                initData.dragging = false;
                if (!initData.hovering) {
                    hideTooltip();
                }
                if (!initData.isClick) {
                    setPosition(initData.newPosition);
                }
            }, 0);
            off(window, 'mousemove', onDragging);
            off(window, 'mouseup', onDragEnd);
        }
    };
    const getClientXY = (event: Event) => {
        const { clientY } = event as MouseEvent;
        const { clientX } = event as MouseEvent;

        return {
            clientX,
            clientY,
        };
    };
    const setPosition = async (newPosition: number) => {
        const { value } = useComputedPosition(sliderProps, newPosition);
        emit(INPUT_EVENT, value);
        await nextTick();
        initData.dragging && displayTooltip();
    };
    return {
        handleMouseLeave,
        handleMouseEnter,
        handleButtonDown,
        tooltipVisible,
        wrapperStyle,
        tooltip,
        setPosition,
    };
};
