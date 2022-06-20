import BaseSchema from '../../base/base-column/base-schema';
// 导出默认
// export { default } from '../../base/base-column/base-schema';
import { pickSchemaAndReset, pickSchemaWithProp } from '../../helpers/schema';

export default [
    ...pickSchemaWithProp(
        BaseSchema,
        'enableClipShape',
        'isTransformPercent',
        'opacity',
        'itemBorder',
        'itemTopRadiusRatio',
        'itemBottomRadiusRatio',
        'itemMarginRatio',
        'itemborderColor',
        'itemborderWidth',
    ),
    ...pickSchemaAndReset(BaseSchema, {
        autoItemMargin: {
            default: false,
        },
        itemWidthRatio: {
            default: 0.6,
        },
        itemMaxWidth: {
            default: 80,
        },
    }),
];
