export default [
    {
        prop: 'lineShapeType',
        name: '折线类型',
        type: 'select',
        options: [
            {
                label: '折线',
                value: 'line',
            },
            {
                label: '曲线',
                value: 'smooth',
            },
        ],
        default: 'line',
    },
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
];
