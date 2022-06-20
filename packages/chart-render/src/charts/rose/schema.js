import basePieSchema from '../../base/base-pie/base-schema';
import { pickSchemaWithProp, pickSchemaAndReset } from '../../helpers/schema';

export default [
    ...pickSchemaWithProp(basePieSchema, 'allAngle', 'coordRadius', 'itemBorder'),
    ...pickSchemaAndReset(basePieSchema, {
        startAngle: {
            default: 202,
        },
        coordInnerRadius: {
            default: 0.2,
        },
    }),
    // {
    //     name: '间隔',
    //     prop: 'distance',
    //     type: 'range',
    //     min: 0,
    //     max: 100,
    //     step: 1,
    //     default: 0
    // },
];
