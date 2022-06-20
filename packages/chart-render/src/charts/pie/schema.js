import BasePieSchema from '../../base/base-pie/base-schema';

export default [
    ...BasePieSchema.filter((i) =>
        ['isTransformPercent', 'startAngle', 'allAngle', 'coordRadius', 'itemBorder'].includes(
            i.prop,
        ),
    ),
];
