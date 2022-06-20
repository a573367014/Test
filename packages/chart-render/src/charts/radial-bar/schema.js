import basePieSchema from '../../base/base-pie/base-schema';
import baseColumnSchema from '../../base/base-column/base-schema';
import { pickSchemaAndReset } from '../../helpers/schema';

export default [
    ...pickSchemaAndReset(baseColumnSchema, {
        itemWidthRatio: {
            default: 0.14,
        },
        itemMaxWidth: {
            default: 9,
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
    {
        prop: 'enablePoint',
        type: 'block',
        default: true,
        name: '点',
        block: [
            {
                prop: 'pointShapeType',
                name: '辅助点类型',
                type: 'select',
                options: [
                    {
                        label: '实心圆',
                        value: 'circle',
                    },
                    {
                        label: '空心圆',
                        value: 'hollowCircle',
                    },
                ],
                default: 'circle',
            },
            {
                type: 'border',
                visiable: (s) => s.pointShapeType === 'circle',
                default: true,
                name: '描边',
                block: [
                    {
                        prop: 'pointBorderColor',
                        name: '辅助点边框颜色',
                        default: '#ccccccff',
                    },
                    {
                        prop: 'pointBorderWidth',
                        name: '辅助点边框粗细',
                        default: 0,
                    },
                ],
            },
            {
                prop: 'pointBorderWidth',
                visiable: (s) => s.pointShapeType === 'hollowCircle',
                name: '点边框粗细',
                type: 'range',
                unit: 'px',
                min: 0,
                max: 30,
                default: 0,
            },
            {
                prop: 'pointFillColor',
                visiable: (s) => s.pointShapeType === 'hollowCircle',
                name: '空心颜色',
                type: 'color',
                default: '#ccccccff',
            },
            {
                prop: 'pointRadiusRatio',
                name: '点半径',
                type: 'ratioRange',
                unit: '%',
                min: 0,
                max: 2,
                step: 0.01,
                default: 1.5,
            },
            {
                prop: 'pointOpaticy',
                type: 'opacity',
                name: '透明度',
                default: 1,
            },
        ],
    },
];
