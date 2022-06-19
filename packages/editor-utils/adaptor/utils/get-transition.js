/**
 * 转场类型与底层数据的映射
 */
const transitionTypeMap = {
    none: 0,
    fade: 6000,
    diffusion: 6001,
    musselOpen: 6002,
    musselClose: 6003,
    // pushUp
    // pushDown
    // pushLeft
    // pushRight
    // slideUp
    // slideDown
    // slideLeft
    // slideRight
    sweepUp: 6004,
    sweepDown: 6005,
    sweepLeft: 6006,
    sweepRight: 6007,
    colorBlack: 6011,
    colorWhite: 6010,
    zoomOut: 6012,
    zoomIn: 6013,
};

/**
 * 旧转场类型与新转场类型的映射
 */
const oldTransitionTypeMap = {
    200: transitionTypeMap.fade,
    201: transitionTypeMap.diffusion,
    202: transitionTypeMap.musselOpen,
    203: transitionTypeMap.musselClose,
    212: transitionTypeMap.sweepUp,
    213: transitionTypeMap.sweepLeft,
    214: transitionTypeMap.sweepDown,
    215: transitionTypeMap.sweepRight,
    216: transitionTypeMap.zoomIn,
    217: transitionTypeMap.zoomOut,
    5000: transitionTypeMap.colorBlack,
    5002: transitionTypeMap.colorWhite,
};

/**
 * 转场底层数据与转场类型的映射
 */
const transitionOptionMap = {
    0: 'none',
    6000: 'fade',
    6001: 'diffusion',
    6002: 'musselOpen',
    6003: 'musselClose',
    // pushUp
    // pushDown
    // pushLeft
    // pushRight
    // slideUp
    // slideDown
    // slideLeft
    // slideRight
    6004: 'sweepUp',
    6005: 'sweepDown',
    6006: 'sweepLeft',
    6007: 'sweepRight',
    6011: 'colorBlack',
    6010: 'colorWhite',
    6012: 'zoomOut',
    6013: 'zoomIn',
};

/**
 * 判断转场是否为叠加型转场
 * @param { number | string } transitionType;
 * @returns
 */
export function isOverlayerTransition(transitionType) {
    return (
        +transitionType >= transitionTypeMap.fade && +transitionType <= transitionTypeMap.sweepRight
    );
}

/**
 * 如果传入的底层转场类型是旧数据，则转换为新数据
 * @param { number ｜ string } transitionType
 * @returns { number }
 */
export function fixOldTransitionType(transitionType) {
    const fixedType = oldTransitionTypeMap[transitionType];
    return fixedType || transitionType;
}

/**
 * 将底层转场类型转为上层数据
 * @param { number } transitionType;
 */
export function transitionTypeToOption(transitionType) {
    return transitionOptionMap[transitionType] || 'none';
}

/**
 * 将上层转场数据转为底层数据
 * @param { import('@gaoding/editor-common/types/transition').ITransitionOptionType } transitionOption;
 */
export function transitionOptionToType(transitionOption) {
    return transitionTypeMap[transitionOption] || 0;
}

/**
 * 根据转场类型获取转场需要的配置
 * @param { import('@gaoding/editor-common/types/transition').ITransitionOptionType } transitionOption 转场类型字符串
 */
export function getTransition(transitionOption) {
    const transitionType = transitionOptionToType(transitionOption);
    const isZoomType = [transitionTypeMap.zoomOut, transitionTypeMap.zoomIn].includes(
        transitionType,
    );

    if (isOverlayerTransition(transitionType)) {
        return {
            type: transitionType,
            inOffset: 0,
            inDuration: 1000,
            outOffset: -1000,
            outDuration: 1000,
            elementInDelay: -1000,
            elementInDuration: 0,
            elementOutDelay: 0,
            elementOutDuration: 0,
            isOverlayer: true,
        };
    } else if (transitionType) {
        return {
            type: transitionType,
            inOffset: 0,
            inDuration: isZoomType ? 300 : 500,
            outOffset: isZoomType ? -300 : -500,
            outDuration: isZoomType ? 300 : 500,
            elementInDelay: 0,
            elementInDuration: 0,
            elementOutDelay: 0,
            elementOutDuration: 0,
            isOverlayer: false,
        };
    } else {
        return {
            type: 0,
            inOffset: 0,
            inDuration: 0,
            outOffset: 0,
            outDuration: 0,
            elementInDelay: 0,
            elementInDuration: 0,
            elementOutDelay: 0,
            elementOutDuration: 0,
            isOverlayer: false,
        };
    }
}
