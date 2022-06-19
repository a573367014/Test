// 图层
const blendList = [
    {
        name: 'group1',
        list: [
            {
                label: '正常'
            },
            {
                label: '溶解'
            }
        ]
    },
    {
        name: 'group2',
        list: [
            {
                label: '变暗'
            },
            {
                label: '正片叠加'
            }
        ]
    }
];

// 基础
const basicList = [
    {
        name: '曝光',
        value: 0,
        max: 30,
        min: -30,
    },
    {
        name: '对比度',
        value: 0,
        max: 30,
        min: -30,
    },
    {
        name: '高光',
        value: 0,
        max: 30,
        min: -30,
    },
    {
        name: '阴影',
        value: 0,
        max: 30,
        min: -30,
    },
    {
        name: '色温',
        value: 0,
        max: 30,
        min: -30,
    },
    {
        name: '色调',
        value: 0,
        max: 30,
        min: -30,
    },
    {
        name: '饱和度',
        value: 0,
        max: 30,
        min: -30,
    },
    {
        name: '自然饱和度',
        value: 0,
        max: 30,
        min: -30,
    }
];

const categoryList = [
    {
        type: 'basic',
        name: '滤镜',
        groups: [
            {
                name: '基础',
                type: 'range',
                select: false,
                filters: [
                    {
                        name: '曝光',
                        value: 0,
                        fromZero: true,
                        max: 30,
                        min: -30,
                    },
                    {
                        name: '对比度',
                        value: 0,
                        fromZero: true,
                        max: 30,
                        min: -30,
                    },
                    {
                        name: '高光',
                        value: 0,
                        fromZero: true,
                        max: 30,
                        min: -30,
                    },
                    {
                        name: '阴影',
                        value: 0,
                        fromZero: true,
                        max: 30,
                        min: -30,
                    },
                    {
                        name: '色温',
                        value: 0,
                        fromZero: true,
                        max: 30,
                        min: -30,
                    },
                    {
                        name: '色调',
                        value: 0,
                        fromZero: true,
                        max: 30,
                        min: -30,
                    },
                    {
                        name: '饱和度',
                        value: 0,
                        fromZero: true,
                        max: 30,
                        min: -30,
                    },
                    {
                        name: '自然饱和度',
                        value: 0,
                        fromZero: true,
                        max: 30,
                        min: -30,
                    }
                ]
            },
            {
                name: '质感',
                type: 'range',
                select: false,
                filters: [
                    {
                        name: '锐化',
                        value: 0,
                        fromZero: false,
                        max: 30,
                        min: 0,
                    },
                    {
                        name: '清晰度',
                        value: 0,
                        fromZero: false,
                        max: 30,
                        min: 0,
                    },
                    {
                        name: '暗角',
                        value: 0,
                        fromZero: false,
                        max: 30,
                        min: 0,
                    },
                    {
                        name: '颗粒',
                        value: 0,
                        fromZero: false,
                        max: 30,
                        min: 0,
                    }
                ]
            }
        ]
    },
    {
        type: 'filter',
        name: '特效',
    }
];

export { blendList, categoryList };

