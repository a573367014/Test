type IVoxTypeString =
    | 'man'
    | 'robot'
    | 'canyonEcho'
    | 'fatNerd'
    | 'minions'
    | 'guanyin'
    | 'giantMan';

/**
 * 将变音属性转换为底层的数据
 */
export declare function parserVoxType(voxType: number | IVoxTypeString);

/**
 * 将底层变音数据转换为字符串
 */
export function stringfiyVoxType(voxType: number | IVoxTypeString);
