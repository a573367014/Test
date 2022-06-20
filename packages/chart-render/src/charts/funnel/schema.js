export default [
    {
        prop: 'shapeType',
        name: '图像类型',
        type: 'select',
        options: [
            {
                label: '金字塔',
                value: 'pyramid',
            },
            {
                label: '漏斗',
                value: 'funnel',
            },
        ],
        default: 'funnel',
    },
    {
        prop: 'scaleNum',
        name: '图像方向',
        type: 'select',
        options: [
            {
                label: '正向',
                value: 1,
            },
            {
                label: '反向',
                value: -1,
            },
        ],
        default: -1,
    },
];
