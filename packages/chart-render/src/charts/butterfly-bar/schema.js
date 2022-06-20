import BaseSchema from '../../base/base-column/base-schema';
import { pickSchemaWithProp } from '../../helpers/schema';

export default [
    ...pickSchemaWithProp(
        BaseSchema,
        'opacity',
        'itemBorder',
        'itemTopRadiusRatio',
        'itemBottomRadiusRatio',
        'itemborderWidth',
        'itemborderColor',
    ),
    // ...pickSchemaAndReset(BaseSchema, {
    //     itemWidthRatio: {
    //         default: 0.6
    //     }
    // }),
    {
        prop: 'coordMargin',
        name: '坐标轴中间宽度',
        type: 'range',
        min: 0,
        max: 200,
        unit: 'px',
        step: 1,
        default: 100,
    },
];
