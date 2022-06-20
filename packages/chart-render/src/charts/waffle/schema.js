export default [
    {
        prop: 'gapRatioSize',
        name: '盒子半径',
        type: 'range',
        unit: 'px',
        min: 0,
        max: 30,
        default: 4,
    },
    {
        prop: 'maxCount',
        name: '数据上限个数',
        type: 'range',
        min: 1,
        max: 1000,
        step: 1,
        default: 500,
    },
    {
        prop: 'rows',
        name: '每列个数',
        type: 'range',
        min: 1,
        max: 20,
        step: 1,
        default: 15,
    },
];
