import pointSchema from '../point/schema';
import { pickSchemaWithoutProp } from '../../helpers/schema';

export default [
    ...pickSchemaWithoutProp(pointSchema, 'pointRadius'),
    {
        prop: 'minPointRadius',
        name: '点半径范围最小值',
        type: 'range',
        unit: 'px',
        min: 1,
        max: 100,
        step: 1,
        default: 10,
    },
    {
        prop: 'maxPointRadius',
        name: '点半径范围最大值',
        type: 'range',
        unit: 'px',
        min: 1,
        max: 100,
        step: 1,
        default: 50,
    },
];
