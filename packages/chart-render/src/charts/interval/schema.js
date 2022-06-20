import BaseSchema from '../../base/base-column/base-schema';
// 导出默认
import { pickSchemaAndReset, pickSchemaWithProp } from '../../helpers/schema';

export default [
    ...pickSchemaWithProp(
        BaseSchema,
        'enableClipShape',
        'autoReverse',
        'isTransformPercent',
        'itemTopRadiusRatio',
        'itemBottomRadiusRatio',
        'itemWidthRatio',
        'itemMaxWidth',
        'itemMarginRatio',
        'itemborderColor',
        'itemborderWidth',
    ),
    ...pickSchemaAndReset(BaseSchema, {
        autoItemMargin: {
            default: false,
        },
    }),
];
