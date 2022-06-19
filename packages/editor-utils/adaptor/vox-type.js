const voxTypeMap = {
    default: 0,
    man: 1,
    robot: 2,
    canyonEcho: 3,
    fatNerd: 4,
    minions: 5,
    guanyin: 6,
    giantMan: 7,
};

const voxTypeStringMap = {
    0: 'default',
    1: 'man',
    2: 'robot',
    3: 'canyonEcho',
    4: 'fatNerd',
    5: 'minions',
    6: 'guanyin',
    7: 'giantMan',
};

/**
 * 将变音属性转换为底层的数据
 * @param { string | number } voxType
 * @returns { number }
 */
export function parserVoxType(voxType) {
    if (typeof voxType === 'string') {
        voxType = voxTypeMap[voxType] || voxTypeMap.default;
    }

    return voxType;
}

/**
 * 将底层变音数据转换为字符串
 * @param { number | string } voxType
 */
export function stringfiyVoxType(voxType) {
    if (typeof voxType === 'number') {
        voxType = voxTypeStringMap[voxType] || voxTypeStringMap[0];
    }
    return voxType;
}
