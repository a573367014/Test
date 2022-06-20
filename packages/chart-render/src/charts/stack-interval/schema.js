import createSpecialShape from '../../base/base-column/special-shape';

export default [
    {
        prop: 'enableClipShape',
        type: 'block',
        default: false,
        name: '背景裁剪',
        block: [
            {
                prop: 'clipShapeHeight',
                name: '背景柱',
                type: 'select',
                options: [
                    {
                        label: '整柱',
                        value: 'fullHeight',
                    },
                    {
                        label: '数据高度',
                        value: 'height',
                    },
                ],
                default: 'height',
            },

            ...createSpecialShape('clipShapePath'),
            {
                prop: 'clipShapeRenderType',
                name: '形状渲染方式',
                type: 'select',
                options: [
                    {
                        label: '等比缩放',
                        value: 'scale',
                    },
                    {
                        label: '等宽变形',
                        value: 'contain',
                    },
                ],
                default: 'contain',
            },
            {
                prop: 'clipShapeColor',
                name: '颜色',
                default: '#ccccccff',
                type: 'color',
            },
            {
                prop: 'clipShapeOpacity',
                type: 'opacity',
                name: '填充透明度',
                default: 0.5,
            },
            {
                prop: '$clipBorder',
                type: 'border',
                default: true,
                name: '形状描边',
                block: [
                    {
                        prop: 'clipShapeBorderColor',
                        name: '描边颜色',
                        default: '#ccccccff',
                    },
                    {
                        prop: 'clipShapeBorderWidth',
                        name: '描边宽度',
                        default: 0,
                    },
                ],
            },
        ],
    },
    // {
    //     prop: 'specialShape',
    //     type: 'block',
    //     default: false,
    //     name: '个性图形',
    //     block: [
    //
    //         {
    //             prop: '$shapeType',
    //             name: '图形形状',
    //             ...createShapeOptions('shapePath')
    //         },
    //         {
    //             prop: 'shapeRenderType',
    //             name: '形状渲染方式',
    //             type: 'select',
    //             options: [
    //                 {
    //                     label: '等比缩放',
    //                     value: 'scale',
    //                 },
    //                 {
    //                     label: '等宽变形',
    //                     value: 'contain',
    //                 }
    //             ],
    //             default: 'contain'
    //         },
    //     ]
    // },

    {
        prop: 'autoReverse',
        name: '负值自动反转',
        type: 'radio',
        default: true,
    },
    {
        prop: 'opacity',
        type: 'opacity',
        name: '填充透明度',
        default: 0.94,
    },
    {
        prop: 'itemBorder',
        type: 'border',
        default: true,
        name: '形状描边',
        block: [
            {
                prop: 'itemborderColor',
                name: '柱子边框颜色',
                default: '#ccccccff',
            },
            {
                prop: 'itemborderWidth',
                name: '柱子边框宽度',
                default: 0,
            },
        ],
    },
    {
        prop: 'itemTopRadiusRatio',
        visiable: (s) => s.specialShape === false,
        name: '顶部圆角比例',
        type: 'range',
        min: 0,
        max: 100,
        unit: '%',
        step: 1,
        default: 0,
    },
    {
        prop: 'itemBottomRadiusRatio',
        visiable: (s) => s.specialShape === false,
        name: '底部圆角比例',
        type: 'range',
        min: 0,
        max: 100,
        unit: '%',
        step: 1,
        default: 0,
    },
    {
        prop: 'isTransformPercent',
        name: '转换百分比',
        type: 'radio',
        default: false,
    },
    {
        prop: 'itemWidthRatio',
        name: '柱子宽度比例',
        type: 'ratioRange',
        min: 0.01,
        max: 1,
        unit: '%',
        step: 0.01,
        default: 0.5,
    },
    {
        prop: 'itemMaxWidth',
        name: '柱宽上限',
        type: 'range',
        min: 1,
        max: 500,
        unit: 'px',
        step: 1,
        default: 100,
    },
    {
        prop: 'autoItemMargin',
        name: '平均分布柱子',
        type: 'radio',
        default: true,
    },
    {
        prop: 'itemMarginRatio',
        name: '柱子间距比例',
        visiable: (s) => s.autoItemMargin === false,
        type: 'ratioRange',
        min: 0,
        max: 1,
        step: 0.01,
        default: 0.3,
    },
];
