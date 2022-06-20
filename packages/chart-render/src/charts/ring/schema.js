import basePieSchema from '../../base/base-pie/base-schema';
import { pickSchemaWithProp, pickSchemaAndReset } from '../../helpers/schema';

export default [
    ...pickSchemaWithProp(
        basePieSchema,
        'isTransformPercent',
        'startAngle',
        'allAngle',
        'coordRadius',
    ),

    ...pickSchemaAndReset(basePieSchema, {
        coordInnerRadius: {
            default: 0.72,
        },
    }),
    {
        name: '间隔',
        prop: 'distance',
        type: 'range',
        min: 0,
        max: 100,
        step: 1,
        default: 0,
    },
    {
        name: '头部半径',
        prop: 'headRadius',
        type: 'range',
        min: -100,
        max: 100,
        step: 1,
        default: 100,
    },
    {
        name: '尾部半径',
        prop: 'tailRadius',
        type: 'range',
        min: -100,
        max: 100,
        step: 1,
        default: 100,
    },

    ...pickSchemaWithProp(basePieSchema, 'itemBorder'),
];
