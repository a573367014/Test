import baseColumnSchema from '../../base/base-column/base-schema';

export default [...baseColumnSchema.filter((i) => !['isTransformPercent'].includes(i.prop))];
