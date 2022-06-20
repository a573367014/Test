import { merge } from '@antv/g2/lib/util';

/**
 * 根据prop获取字段
 * @param {Array} source
 * @param  {...string} propList
 */
export const pickSchemaWithProp = (source, ...propList) =>
    source.filter((i) => propList.includes(i.prop));
export const pickSchemaWithoutProp = (source, ...propList) =>
    source.filter((i) => !propList.includes(i.prop));

/**
 * 获取schema并且重置值
 * @param {*} source
 * @param {*} propMap
 */
export const pickSchemaAndReset = (source, propMap) => {
    return pickSchemaWithProp(source, ...Object.keys(propMap)).map((schemaItem) => {
        return {
            ...schemaItem,
            ...propMap[schemaItem.prop],
        };
    });
};

export const getDefaultBySchema = (schema) => {
    return (
        schema &&
        schema.reduce((defaultSeetings, item) => {
            if (item.default !== undefined) {
                defaultSeetings[item.prop] = item.default;
            }
            // 合并子块
            if (item.block && Array.isArray(item.block)) {
                defaultSeetings = merge(defaultSeetings, getDefaultBySchema(item.block));
            }
            return defaultSeetings;
        }, {})
    );
};

export function pickAndMergeDefault(settings, defaultTarget) {
    if (!defaultTarget) return settings;
    return Object.keys(defaultTarget).reduce((newTarget, key) => {
        newTarget[key] = settings[key] === undefined ? defaultTarget[key] : settings[key];
        return newTarget;
    }, {});
}
