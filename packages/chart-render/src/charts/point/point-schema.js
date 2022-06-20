const SHAPES = ['circle', 'square', 'bowtie', 'diamond', 'hexagon', 'triangle', 'triangle-down'];
const HOLLOW_SHAPES = SHAPES.map((i) => 'hollow' + upperFirst(i));

function upperFirst(value) {
    const str = String(value);
    return str.charAt(0).toUpperCase() + str.substring(1);
}

export default [
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
                label: '正方形',
                value: 'square',
            },
            {
                label: '蝴蝶姐',
                value: 'bowtie',
            },
            {
                label: '菱形',
                value: 'diamond',
            },
            {
                label: '多边形',
                value: 'hexagon',
            },
            {
                label: '三角形-上',
                value: 'triangle',
            },
            {
                label: '三角形-下',
                value: 'triangle-down',
            },
            {
                label: '空心圆',
                value: 'hollowCircle',
            },
            {
                label: '空心正方形',
                value: 'hollowSquare',
            },
            {
                label: '空心蝴蝶结',
                value: 'hollowBowtie',
            },
            {
                label: '空心菱形',
                value: 'hollowDiamond',
            },
            {
                label: '空心多边形',
                value: 'hollowHexagon',
            },
            {
                label: '空心三角形-上',
                value: 'hollowTriangle',
            },
            {
                label: '空心三角形-下',
                value: 'hollowTriangle-down',
            },
        ],
        default: 'circle',
    },
    {
        prop: 'pointBorderWidth',
        visiable: (s) => HOLLOW_SHAPES.includes(s.pointShapeType),
        name: '点边框粗细',
        type: 'range',
        unit: 'px',
        min: 0,
        max: 30,
        default: 0,
    },
    {
        prop: 'pointFillColor',
        visiable: (s) => HOLLOW_SHAPES.includes(s.pointShapeType),
        name: '空心颜色',
        type: 'color',
        default: '#ccccccff',
    },
    {
        type: 'border',
        visiable: (s) => SHAPES.includes(s.pointShapeType),
        default: true,
        name: '描边',
        block: [
            {
                prop: 'pointBorderColor',
                name: '点边框颜色',
                default: '#ccccccff',
            },
            {
                prop: 'pointBorderWidth',
                name: '点边框粗细',
                default: 0,
            },
        ],
    },
    {
        prop: 'pointRadius',
        name: '点半径',
        type: 'range',
        unit: 'px',
        min: 0,
        max: 30,
        default: 5,
    },
    {
        prop: 'pointOpaticy',
        type: 'opacity',
        name: '透明度',
        unit: '%',
        default: 1,
    },
];
