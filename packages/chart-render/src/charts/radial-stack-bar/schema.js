import basePieSchema from '../../base/base-pie/base-schema';
import baseColumnSchema from '../../base/base-column/base-schema';
import { pickSchemaAndReset } from '../../helpers/schema';

export default [
    ...pickSchemaAndReset(baseColumnSchema, {
        itemWidthRatio: {
            default: 0.5,
        },
        itemMaxWidth: {
            default: 20,
        },
    }),
    ...pickSchemaAndReset(basePieSchema, {
        startAngle: {
            default: 270,
        },
        allAngle: {
            default: 280,
        },
        coordRadius: {
            default: 1,
        },
        coordInnerRadius: {
            default: 0.23,
        },
    }),
];
