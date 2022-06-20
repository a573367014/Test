import areaSchema from '../area/schema';

export default [
    {
        prop: 'isTransformPercent',
        name: '转换百分比',
        type: 'radio',
        default: false,
    },
    ...areaSchema,
];
