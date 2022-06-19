import { getTransitionOut, setTransitionOut } from './transition';

/**
 * 获取元素的时间信息
 * @param { element } element - 元素 或 layout
 * @returns { { delay: number, duration: number }}
 */
export function getTimeRange(element) {
    if (element.timeRange) {
        return element.timeRange;
    }

    if (
        element.animation &&
        element.animation.animationEffects[0] &&
        element.animation.animationEffects[0].options
    ) {
        const { delay, duration } = element.animation.animationEffects[0].options;

        return {
            delay,
            duration,
        };
    }

    return {
        delay: 0,
        duration: 0,
    };
}

/**
 * 设置元素的时间信息
 * @param { number } delay
 * @param { number } duration
 * @param { any } element
 */
export function setTimeRange(delay, duration, element) {
    if (element.timeRange) {
        element.timeRange.delay = delay;
        element.timeRange.duration = duration;
    } else {
        element.timeRange = {
            delay,
            duration,
        };
    }

    // 出场数据修正
    const transitionOut = getTransitionOut(element);
    if (transitionOut.option !== 'none') {
        setTransitionOut(transitionOut.option, element);
    }

    // 旧数据兼容
    if (element.animation && element.animation.animationEffects[0]) {
        element.animation.animationEffects[0].options = {
            delay,
            duration,
        };

        return;
    }

    element.animation = {
        animationEffects: [
            {
                options: {
                    delay,
                    duration,
                },
            },
        ],
    };
}
