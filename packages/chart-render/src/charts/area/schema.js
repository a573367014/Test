import pointSchema from '../point/point-schema';

export default [
    {
        prop: 'areaOpacity',
        type: 'opacity',
        name: '面积透明度',
        unit: '%',
        default: 0.7,
    },
    {
        prop: 'shapeType',
        name: '折线类型',
        type: 'select',
        options: [
            {
                label: '直角类型',
                value: 'area',
            },
            {
                label: '曲面类型',
                value: 'smooth',
            },
        ],
        default: 'smooth',
    },
    {
        prop: 'enableLine',
        type: 'block',
        default: true,
        name: '折线配置',
        block: [
            {
                prop: 'lineWidth',
                name: '折线宽度',
                type: 'range',
                unit: 'px',
                min: 1,
                max: 20,
                default: 3,
            },
            {
                prop: 'lineOpacity',
                type: 'opacity',
                unit: '%',
                name: '透明度',
                default: 0.8,
            },
            {
                prop: 'lineDash',
                name: '虚线',
                type: 'lineDash',
                default: [0, 0],
            },
        ],
    },
    {
        prop: 'enablePoint',
        type: 'block',
        default: false,
        name: '增加辅助点',
        block: pointSchema,
    },
];
