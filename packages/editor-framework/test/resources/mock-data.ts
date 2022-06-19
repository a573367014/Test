import type {
    ITempletModel,
    ElementModel,
    ILayoutModel,
    IPathElementModel,
    IPathEffect,
    IPathStrokeType,
} from '../../src/types/editor';
import { defaults, pick } from 'lodash';

export const EmptyTemplet = {
    type: 'poster',
    layouts: [{ height: 800, width: 800, backgroundColor: '#ffffff', elements: [] }],
} as ITempletModel;

const [red, green, blue, yellow] = ['#ff0000ff', '#00ff00ff', '#0000ffff', '#ffff00ff'];

export const EmptyCollabTemplet = {
    type: 'poster',
    layouts: [{ height: 400, width: 800, backgroundColor: '#ffffff', elements: [] }],
} as ITempletModel;

export const EmptyPathTemplet = {
    type: 'poster',
    // 为保证视觉回归测试效果，使用较小的模板
    layouts: [{ height: 300, width: 300, backgroundColor: '#ffffff00', elements: [] }],
} as ITempletModel;

export const CollabTemplet = {
    type: 'poster',
    layouts: [
        {
            uuid: '0',
            height: 400,
            width: 800,
            backgroundColor: '#ffffff',
            elements: [
                {
                    type: 'text',
                    content: 'Element 0',
                    uuid: '1',
                    left: 50,
                    top: 0,
                    width: 300,
                    height: 60,
                    fontSize: 50,
                    color: red,
                },
                {
                    type: 'text',
                    content: 'Element 1',
                    uuid: '2',
                    left: 150,
                    top: 100,
                    width: 300,
                    height: 60,
                    fontSize: 50,
                    color: green,
                },
                {
                    type: 'text',
                    content: 'Element 2',
                    uuid: '3',
                    left: 250,
                    top: 200,
                    width: 300,
                    height: 60,
                    fontSize: 50,
                    color: blue,
                },
                {
                    type: 'text',
                    content: 'Element 3',
                    uuid: '4',
                    left: 350,
                    top: 300,
                    width: 300,
                    height: 60,
                    fontSize: 50,
                    color: yellow,
                },
            ],
        },
    ],
} as ITempletModel;

export const GroupTestTemplet = {
    type: 'poster',
    layouts: [
        {
            height: 800,
            width: 800,
            backgroundColor: '#ffffff',
            elements: [
                {
                    type: 'image',
                    left: 0,
                    top: 0,
                    width: 400,
                    height: 400,
                    url: '/resources/js.png',
                },
                {
                    type: 'image',
                    left: 400,
                    top: 400,
                    width: 400,
                    height: 400,
                    url: '/resources/js.png',
                },
            ],
        },
    ],
} as ITempletModel;

export const MultiLayoutTestTemplet1 = {
    version: '7.2.1',
    type: 'poster',
    global: {
        zoom: 1,
        dpi: 72,
        unit: 'px',
        layout: {
            height: 6000,
            width: 2000,
            backgroundImage: null,
            backgroundColor: '#ffffff00',
            backgroundImageInfo: {
                opacity: 1,
                width: 100,
                height: 100,
                transform: { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 },
            },
            backgroundRepeat: 'no-repeat',
            backgroundSize: [0, 0],
            watermarkEnable: false,
        },
    },
    layouts: [
        {
            elements: [],
            title: '',
            background: { color: '#ffffffff' },
            height: 1500,
            width: 2000,
        },
        {
            elements: [],
            title: '',
            background: { color: '#ffffffff' },
            height: 1000,
            width: 2000,
        },
        {
            elements: [],
            title: '',
            height: 1000,
            width: 2000,
            background: { color: '#ffffffff' },
        },
        {
            elements: [],
            title: '',
            background: { color: '#ffffffff' },
            height: 1000,
            width: 2000,
        },
        {
            elements: [],
            title: '',
            background: { color: '#ffffffff' },
            height: 1500,
            width: 2000,
        },
    ],
} as ITempletModel;

export const MultiLayoutTestTemplet2 = {
    layouts: [
        {
            height: 800,
            width: 800,
            backgroundColor: '#ffffff',
            elements: [],
        },
        {
            width: 800,
            height: 400,
            elements: [
                {
                    type: 'group',
                    left: 50,
                    top: 0,
                    width: 500,
                    height: 260,
                    uuid: 'test-group',
                    elements: [
                        {
                            type: 'text',
                            content: 'Element 1',
                            left: 200,
                            top: 200,
                            width: 300,
                            height: 60,
                            fontSize: 50,
                            color: '#0000ffff',
                        },
                    ],
                },
            ],
        },
    ],
} as ITempletModel;

export const GroupTestLayout = {
    width: 800,
    height: 400,
    elements: [
        {
            type: 'text',
            content: 'Element 7',
            left: 350,
            top: 300,
            width: 300,
            height: 60,
            fontSize: 50,
            color: yellow,
        },
        {
            type: 'group',
            left: 50,
            top: 0,
            width: 500,
            height: 260,
            elements: [
                {
                    type: 'text',
                    content: 'Element 6',
                    left: 200,
                    top: 200,
                    width: 300,
                    height: 60,
                    fontSize: 50,
                    color: blue,
                },
                {
                    type: 'group',
                    left: 0,
                    top: 0,
                    width: 400,
                    height: 160,
                    elements: [
                        {
                            type: 'text',
                            content: 'Element 4',
                            left: 0,
                            top: 0,
                            width: 300,
                            height: 60,
                            fontSize: 50,
                            color: red,
                        },
                        {
                            type: 'text',
                            content: 'Element 5',
                            left: 100,
                            top: 100,
                            width: 300,
                            height: 60,
                            fontSize: 50,
                            color: green,
                        },
                    ],
                },
            ],
        },
    ],
} as ILayoutModel;

export const DemoImage = {
    type: 'image',
    left: 0,
    top: 0,
    width: 400,
    height: 400,
    url: '/resources/gengar.png',
} as ElementModel;

export const DemoSvg = {
    type: 'svg',
    width: 579,
    height: 579,
    left: -144,
    top: 63,
    url: 'https://st-gdx.dancf.com/gaodingx/0/personal/my-tasks/20210811-113210-26b7.svg',
    colors: ['rgb(119, 193, 223)', 'rgb(89, 181, 209)', 'rgb(91, 91, 91)', 'rgb(175, 222, 244)'],
} as unknown as ElementModel;

export const DemoImage2 = {
    type: 'image',
    width: 480,
    height: 480,
    left: 160,
    top: 98,

    url: 'https://gd-ai-application.dancf.com/temp/ac176b3f9bc639bf7dbef35afb861a42.png',
    imageUrl: '',

    imageTransform: {
        a: 0.6,
        b: 0,
        c: 0,
        d: 0.6,
        tx: 0,
        ty: 0,
    },

    naturalWidth: 800,
    naturalHeight: 800,
    resourceType: 'image',
} as unknown as ElementModel;

export const DemoImageShadow = {
    type: 'image',
    width: 424,
    height: 353.33333333333337,
    left: 369.62292890001754,
    top: 223.33333333333331,
    transform: {
        a: 0.84134740491862,
        b: 0.5404947217473115,
        c: -0.5404947217473115,
        d: 0.84134740491862,
        tx: 0,
        ty: 0,
    },
    url: 'https://gd-filems.dancf.com/mcm79j/mcm79j/08978/2ce1b695-a60c-4c7e-a019-cfb77db3a9f71341270.png',
    imageUrl:
        'https://gd-filems.dancf.com/mcm79j/mcm79j/08978/f76448c8-067b-4ab8-bfb0-070f1303500623852363.png',
    effectedResult: {
        width: 718,
        height: 639,
        left: -235,
        right: 0,
        top: -59,
    },
    shadows: [
        {
            enable: true,
            type: 'skew',
            mask: '',
            offsetX: 0,
            offsetY: 0,
            opacity: 0.5,
            blurType: 'advanced',
            advancedBlur: {
                blurs: [
                    {
                        offset: 0,
                        value: 2.2758990874932903,
                    },
                    {
                        offset: 1,
                        value: 19.34514224369297,
                    },
                ],
                opacities: [
                    {
                        offset: 0,
                        value: 1,
                    },
                    {
                        offset: 1,
                        value: 1,
                    },
                ],
            },
            color: '#00000080',
            scaleX: 1,
            scaleY: 0.7,
            angle: -136,
            overlap: 0,
            $linkIndex: 0,
        },
    ],

    imageTransform: {
        a: 8.833333333333332,
        b: 0,
        c: 0,
        d: 8.833333333333336,
        tx: 0,
        ty: 0,
    },
    filterInfo: {
        id: -1,
        url: '',
        strong: 0.8,
        intensity: 0.8,
    },
    naturalWidth: 48,
    naturalHeight: 40,
    resourceType: 'image',
} as unknown as ElementModel;

export const DemoGroup = {
    type: 'group',
    left: 100,
    top: 100,
    width: 400,
    height: 160,
    elements: [
        {
            type: 'text',
            content: 'Element 4',
            left: 0,
            top: 0,
            width: 300,
            height: 60,
            fontSize: 50,
            color: red,
        },
        {
            type: 'text',
            content: 'Element 5',
            left: 100,
            top: 100,
            width: 300,
            height: 60,
            fontSize: 50,
            color: green,
        },
    ],
} as ElementModel;

export const DemoText = {
    type: 'text',
    left: 0,
    top: 0,
    width: 400,
    height: 100,
    lineHeight: 1,
    fontSize: 100,
    content: 'hello',
} as Partial<ElementModel>;

export const DemoMask = {
    type: 'mask',
    left: 0,
    top: 0,
    width: 400,
    height: 400,
    mask: '/resources/js.png',
    url: '/resources/js.png',
} as ElementModel;

export const DemoImageUrl = '/resources/xingxing.png';

export const DemoMaskUrl =
    'data:image/png;base64,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';

export const DemoFlex = {
    type: 'flex',
    title: '',
    category: 'text',
    opacity: 1,
    padding: [52.206, 109.38400000000001, 52.206, 109.38400000000001],
    width: 737,
    height: 390,
    left: 0,
    top: 0,
    resize: 1,
    groupable: true,
    backgroundEffect: {
        enable: true,
        type: 'ninePatch',
        opacity: 1,
        ninePatch: {
            url: '/resources/nine-patch.png',
            imageSlice: {
                left: 94,
                top: 152,
                right: 93,
                bottom: 152,
            },
            originWidth: 188,
            originHeight: 305,
            effectScale: 1.243,
        },
    },
    elements: [
        {
            type: 'text',
            width: 518,
            height: 134,
            left: 109,
            top: 52,
            resize: 1,
            flex: {
                alignSelf: 'center',
                flexGrow: 1,
                flexShrink: 0,
                flexBasis: -1.243,
                margin: [0, 0, 0, 0],
            },
            color: '#000000ff',
            fontFamily: 'SourceHanSansSC-Regular',
            fontStyle: 'normal',
            fontWeight: 400,
            fontSize: 111,
            lineHeight: 1.2,
            letterSpacing: 0,
            textDecoration: 'none',
            writingMode: 'horizontal-tb',
            textAlign: 'center',
            verticalAlign: 'top',
            content: '买满300元',
            contents: null,
            aggregatedColors: ['#000000ff'],
            autoAdaptive: 2,
        },
        {
            type: 'text',
            width: 518,
            height: 152,
            left: 109,
            top: 186,
            resize: 1,
            flex: {
                alignSelf: 'center',
                flexGrow: 1,
                flexShrink: 0,
                flexBasis: -1.243,
                margin: [0, 0, 0, 0],
            },
            color: '#ffffffff',
            fontFamily: 'SourceHanSansSC-Regular',
            fontStyle: 'normal',
            fontWeight: 400,
            fontSize: 126,
            lineHeight: 1.2,
            letterSpacing: 0,
            textDecoration: 'none',
            writingMode: 'horizontal-tb',
            textAlign: 'center',
            verticalAlign: 'top',
            content: '立减50元',
            contents: null,
            aggregatedColors: ['#ffffffff'],
            autoAdaptive: 2,
        },
    ],
    autoAdaptive: 2,
    splitenable: true,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    alignContent: 'flex-start',
    flexWrap: 'nowrap',
} as unknown as ElementModel;

export const DemoNestedGroup = {
    uuid: 'test-group0',
    type: 'group',
    left: 100,
    top: 100,
    width: 400,
    height: 160,
    elements: [
        {
            type: 'text',
            content: 'Element 4',
            left: 0,
            top: 0,
            width: 300,
            height: 60,
            fontSize: 50,
            color: red,
        },
        {
            uuid: 'test-group1',
            type: 'group',
            left: 100,
            top: 100,
            width: 400,
            height: 160,
            elements: [
                {
                    type: 'text',
                    content: 'Element 4',
                    left: 0,
                    top: 0,
                    width: 300,
                    height: 60,
                    fontSize: 50,
                    color: red,
                },
                DemoImage,
            ],
        },
    ],
} as ElementModel;

const pathEffects: IPathEffect[] = [
    {
        type: 'brush',
        enable: true,
        fillColor: 'transparent',
        color: 'black',
        width: 4,
        lineType: 'center',
    },
];

export const DemoPath1 = {
    type: 'path',
    left: 50,
    top: 50,
    width: 200,
    height: 200,
    pathEffects,
    path: 'M200 0L0 0L0 200H200',
} as IPathElementModel;

export const DemoPath2 = {
    type: 'path',
    left: 50,
    top: 50,
    width: 200,
    height: 200,
    pathEffects,
    path: 'M200 0H0V200H200M50 50H200V150',
} as IPathElementModel;

export const DemoPath3 = {
    ...DemoPath1,
    pathEffects: [{ ...DemoPath1.pathEffects[0] }],
} as IPathElementModel;
DemoPath3.pathEffects[0].fillColor = '#dadada';

export const DemoPath4 = {
    type: 'path',
    left: 20,
    top: 20,
    width: 203.34687330915997,
    height: 109.26437541003838,
    path: 'M0.00285,59.44919c-0.34663,-25.12457 31.04665,-67.96978 49.00755,-57.96136c52.48462,29.2462 78.86886,4.28913 100.14636,18.88787c21.27748,14.59876 26.2729,19.87036 38.43702,33.0612c12.16415,13.19087 -0.37831,8.87472 10.21953,19.70223c10.59784,10.82752 -7.66658,1.85492 3.77297,22.22254c11.43956,20.3676 -35.26497,1.8467 -70.79016,12.01221c-35.52517,10.16549 -130.4466,-22.80017 -130.79325,-47.92471z',
    pathEffects: [{ ...DemoPath1.pathEffects[0] }],
} as IPathElementModel;

export const DemoPath5 = {
    type: 'path',
    left: 75,
    top: 75,
    width: 222.2222222222222,
    height: 222.2222222222222,
    path: 'M222.22222,22.22222c0,0 -150,-50 -200,0c-50,50 0,200 0,200h200',
    pathEffects: [{ ...DemoPath1.pathEffects[0] }],
} as IPathElementModel;

export interface ICreatePathEffectOptions {
    fillColor?: string;
    strokeType?: IPathStrokeType;
    strokeWidth?: number;
    strokeColor?: string;
}

export function createDemoPathEffects(opt: ICreatePathEffectOptions = {}): IPathEffect[] {
    defaults(opt, {
        fillColor: '#dadada',
        strokeColor: '#666666',
        strokeType: 'center',
        strokeWidth: 4,
    });
    const { fillColor, strokeType, strokeColor, strokeWidth } = opt;
    return [
        {
            type: 'brush',
            enable: true,
            fillColor,
            color: strokeColor,
            lineType: strokeType,
            width: strokeWidth,
        },
    ];
}

export interface ICreateDemoPathDataOptions extends ICreatePathEffectOptions {
    left?: number;
    top?: number;
    width?: number;
    height?: number;
    path?: string;
}

export function createDemoPathData(opt: ICreateDemoPathDataOptions = {}) {
    defaults(opt, { left: 50, top: 50, width: 200, height: 200, path: 'M200 0L0 0L0 200H200' });
    return {
        type: 'path',
        pathShape: 'pen',
        ...pick(opt, ['width', 'height', 'left', 'top', 'path']),
        pathEffects: createDemoPathEffects(opt),
    };
}
