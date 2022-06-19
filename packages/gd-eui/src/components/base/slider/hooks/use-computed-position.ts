import { ISliderProps, ISliderProvider } from '../../../../types/slider';
import { fixedFloat } from '../../../../utils/index';
import { ToRefs } from '@vue/composition-api';

// 获取当前计算值保留的小数位
function getDecimalPlaces(val: number) {
    const valSting = val.toString();
    const valArr = valSting.split('.');
    return valArr.length > 1 ? 1 : 0;
}
/**
 * 计算点击或拖拽后的结果值
 * @param newPosition
 */
export const useComputedPosition = (
    sliderProps: ISliderProvider | ToRefs<ISliderProps>,
    newPosition: number,
) => {
    if (newPosition === null || isNaN(newPosition)) return { value: 0 };
    const { middleMode, max, min, step, middle } = sliderProps;
    const decimalPlaces = getDecimalPlaces(min.value); // 保留小数位
    let newValue = 0;
    if (newPosition < 0) {
        newPosition = 0;
    } else if (newPosition > 100) {
        newPosition = 100;
    }
    // 中间模式
    if (middleMode.value) {
        if (newPosition === 50) {
            return { value: middle.value };
            // 左滑
        } else if (newPosition > 50) {
            if (step.value > 1) {
                const stepNum = (max.value - middle.value) / (step.value / 2);
                const lengthPerStep = fixedFloat(50 / (step.value / 2), decimalPlaces);
                const steps = Math.round((newPosition - 50) / lengthPerStep);
                newValue = fixedFloat(steps * stepNum + middle.value, decimalPlaces);
            } else {
                const diffPercent = ((newPosition - 50) * 2) / 100;
                const rightWidth = max.value - middle.value;
                const diff = fixedFloat(rightWidth * diffPercent, decimalPlaces);
                newValue = middle.value + diff;
            }
            return {
                value: newValue,
            };
            // 右滑
        } else if (newPosition < 50) {
            // 分段模式
            if (step.value > 1) {
                const stepNum = (middle.value - min.value) / (step.value / 2);
                const lengthPerStep = fixedFloat(50 / (step.value / 2), decimalPlaces);
                const steps = Math.round((50 - newPosition) / lengthPerStep);
                newValue = fixedFloat(middle.value - steps * stepNum, decimalPlaces);
                // 正常模式
            } else {
                const diffPercent = ((50 - newPosition) * 2) / 100;
                const leftWidth = middle.value - min.value;
                const diff = fixedFloat(leftWidth * diffPercent, decimalPlaces);
                newValue = fixedFloat(middle.value - diff, decimalPlaces);
            }
            return {
                value: newValue,
            };
        }
    } else {
        if (step.value > 1) {
            const stepNum = (max.value - min.value) / step.value;
            const lengthPerStep = 100 / step.value;
            const steps = Math.round(newPosition / lengthPerStep);
            newValue = fixedFloat(steps * stepNum, decimalPlaces) + min.value;
        } else {
            const lengthPerStep = 100 / ((max.value - min.value) / step.value);
            const steps = Math.round(newPosition / lengthPerStep);
            newValue = Math.round(
                steps * lengthPerStep * (max.value - min.value) * 0.01 + min.value,
            );
        }
    }
    return {
        value: newValue,
    };
};
