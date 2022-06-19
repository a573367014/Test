import { getTimeRange } from './time-range';
import {
    fixOldTransitionType,
    getTransition,
    transitionOptionToType,
    transitionTypeToOption,
} from './utils/get-transition';

/**
 * 获取进场效果
 * @param { any } element
 * @returns { import('@gaoding/editor-common/types/transition').ITransition }
 */
export function getTransitionIn(element) {
    if (element.transitionIn) {
        return element.transitionIn;
    }

    if (element.animation && element.animation.enterTransition) {
        const enterTransition = fixOldTransitionType(element.animation.enterTransition);
        const option = transitionTypeToOption(enterTransition);
        const transition = getTransition(option);
        return {
            option,
            delay: transition.inOffset,
            duration: transition.inDuration,
        };
    }

    return {
        option: 'none',
        delay: 0,
        duration: 0,
    };
}

/**
 * 设置进场效果
 * @param { import('@gaoding/editor-common/types/transition').ITransitionOptionType } transitionOption
 * @param { import('@gaoding/editor-common/types/index').IElement } element
 */
export function setTransitionIn(transitionOption, element) {
    const transition = getTransition(transitionOption);

    if (transitionOption !== 'none') {
        element.transitionIn = {
            option: transitionOption,
            delay: transition.inOffset,
            duration: transition.inDuration,
        };
    } else {
        element.transitionIn = null;
    }

    // 对旧数据进行兼容
    if (!element.animation) {
        element.animation = {
            animationEffects: [],
        };
    }
    const transitionType = transitionOptionToType(transitionOption);
    element.animation.enterTransition = transitionType;
}

/**
 * 获取出场动画
 * @param { any} element
 * @returns { import('@gaoding/editor-common/types/transition').ITransition }
 */
export function getTransitionOut(element) {
    if (element.transitionOut) {
        return element.transitionOut;
    }

    if (element.animation && element.animation.leaveTransition) {
        const leaveTransition = fixOldTransitionType(element.animation.leaveTransition);
        const option = transitionTypeToOption(leaveTransition);
        const transition = getTransition(option);
        const { duration } = getTimeRange(element);
        return {
            option,
            delay: duration + transition.outOffset,
            duration: transition.outDuration,
        };
    }

    return {
        option: 'none',
        delay: 0,
        duration: 0,
    };
}

/**
 * 设置出场效果
 * @param { import('@gaoding/editor-common/types/transition').ITransitionOptionType } transitionOption
 * @param { import('@gaoding/editor-common/types/index').IElement } element
 */
export function setTransitionOut(transitionOption, element) {
    const transition = getTransition(transitionOption);
    const { duration } = getTimeRange(element);

    if (transitionOption !== 'none') {
        element.transitionOut = {
            option: transitionOption,
            delay: duration + transition.outOffset,
            duration: transition.outDuration,
        };
    } else {
        element.transitionOut = null;
    }

    // 对旧数据进行兼容
    if (!element.animation) {
        element.animation = {
            animationEffects: [],
        };
    }
    const transitionType = transitionOptionToType(transitionOption);
    element.animation.leaveTransition = transitionType;
}
