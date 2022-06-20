import pointSchema from '../point/point-schema';

export default [
    {
        prop: 'lineType',
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
            {
                label: '阶梯线-01',
                value: 'hv',
            },
            {
                label: '阶梯线-02',
                value: 'hvh',
            },
            {
                label: '阶梯线-03',
                value: 'vh',
            },
            {
                label: '阶梯线-04',
                value: 'vhv',
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
        prop: 'lineDash',
        name: '虚线',
        type: 'lineDash',
        default: [0, 0],
    },
    {
        prop: 'enablePoint',
        type: 'block',
        default: true,
        name: '增加辅助点',
        block: [
            // {
            //     prop: 'pointType',
            //     name: '辅助点',
            //     type: 'select',
            //     options: [
            //         {
            //             label: '所有点',
            //             value: 'full',
            //         },
            //         {
            //             label: '最大点/最小点',
            //             value: 'minMax',
            //         }
            //     ],
            //     default: 'full'
            // },
            ...pointSchema,
        ],
    },
];
