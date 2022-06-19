import { Ref } from '@vue/composition-api';
import type { Nullable } from './common';

export interface ISliderProps {
    backgroundActiveColor: string;
    backgroundColor: string;
    value: number;
    min: number;
    max: number;
    step: number;
    showInput: boolean;
    showSelect: boolean;
    showTooltip: boolean;
    middleMode: boolean;
    middle: number;
    disabled: boolean;
    vertical: boolean;
    height: string;
    label: string;
    labelSingleLine: boolean;
}

export interface ISliderInitData {
    firstValue: number;
    secondValue: Nullable<number>;
    oldValue: Nullable<number>;
    dragging: boolean;
    sliderSize: number;
}

export interface ISliderButtonInitData {
    hovering: boolean;
    dragging: boolean;
    isClick: boolean;
    startX: number;
    currentX: number;
    startY: number;
    currentY: number;
    startPosition: number;
    newPosition: number;
}
export interface ISliderButtonProps {
    value: number;
}

export interface ISliderProvider {
    min: Ref<number>;
    max: Ref<number>;
    step: Ref<number>;
    middleMode: Ref<boolean>;
    middle: Ref<number>;
    // middleRightNum: Ref<number>;
    // middleLeftNum: Ref<number>;
    value: Ref<number>;
    vertical: Ref<boolean>;
    sliderSize: Ref<number>;
    showTooltip: Ref<boolean>;
    disabled: Ref<boolean>;
    resetSize: Function;
}
