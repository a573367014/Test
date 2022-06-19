import { useI18n } from '@gaoding/vue-i18next';

const { $tsl } = useI18n('editor-common');

export const createDeformations = () => [
    {
        name: $tsl('无变形'),
        type: 'none',
        attrs: [{ name: $tsl('强度'), value: 0, min: 0, max: 100, start: 0 }],
        url: 'https://st-gdx.dancf.com/gaodingx/210/design/three/20191014-163045-09b6.png',
    },
    {
        name: $tsl('拱形'),
        type: 'archCurve',
        attrs: [{ name: $tsl('强度'), value: 25, min: -100, max: 100, start: 0 }],
        url: 'https://st-gdx.dancf.com/gaodingx/210/design/three/20191014-163045-38cc.png',
    },
    {
        name: $tsl('内凹'),
        type: 'concaveCurve',
        attrs: [
            {
                name: $tsl('强度'),
                value: 25,
                min: 0,
                max: 100,
                start: 0,
            },
        ],
        url: 'https://st-gdx.dancf.com/gaodingx/210/design/three/20191014-163045-9734.png',
    },
    {
        name: $tsl('上拱形'),
        type: 'upperArchCurve',
        attrs: [
            {
                name: $tsl('强度'),
                value: 25,
                min: -100,
                max: 100,
                start: 0,
            },
        ],
        url: 'https://st-gdx.dancf.com/gaodingx/210/design/three/20191014-163045-3796.png',
    },
    {
        name: $tsl('下拱形'),
        type: 'lowerArchCurve',
        attrs: [{ name: $tsl('强度'), value: 25, min: -100, max: 100, start: 0 }],
        url: 'https://st-gdx.dancf.com/gaodingx/210/design/three/20191014-163045-c78e.png',
    },
    {
        name: $tsl('凸出'),
        type: 'bulbCurve',
        attrs: [{ name: $tsl('强度'), value: 25, min: 0, max: 100, start: 0 }],
        url: 'https://st-gdx.dancf.com/gaodingx/210/design/three/20191014-163045-40cc.png',
    },
    {
        name: $tsl('斜切'),
        type: 'skew',
        attrs: [
            { name: $tsl('左右斜切'), value: 15, min: -50, max: 50, start: 0 },
            { name: $tsl('上下斜切'), value: 0, min: -50, max: 50, start: 0 },
        ],
        url: 'https://st-gdx.dancf.com/gaodingx/210/design/three/20191014-163045-81b6.png',
    },
    {
        name: $tsl('旗形'),
        type: 'flagCurve',
        attrs: [{ name: $tsl('强度'), value: 15, min: -100, max: 100, start: 0 }],
        url: 'https://st-gdx.dancf.com/gaodingx/210/design/three/20191014-163045-a242.png',
    },
    {
        name: '梯形',
        type: 'trapezoid',
        attrs: [
            { name: $tsl('梯形强度'), value: 20, min: -50, max: 50, start: 0 },
            { name: $tsl('相对高度'), value: 15, min: -50, max: 50, start: 0 },
        ],
        url: 'https://st-gdx.dancf.com/gaodingx/210/design/three/20191014-163045-db3c.png',
    },
    {
        name: $tsl('下梯形'),
        type: 'lowerTrapezoid',
        attrs: [
            { name: $tsl('梯形强度'), value: 40, min: -80, max: 80, start: 0 },
            { name: $tsl('相对高度'), value: 15, min: -80, max: 80, start: 0 },
        ],
        url: 'https://st-gdx.dancf.com/gaodingx/210/design/three/20191014-163045-1d1a.png',
    },
    {
        name: $tsl('上梯形'),
        type: 'topTrapezoid',
        attrs: [
            { name: $tsl('梯形强度'), value: 40, min: -80, max: 80, start: 0 },
            { name: $tsl('相对高度'), value: 15, min: -80, max: 80, start: 0 },
        ],
        url: 'https://st-gdx.dancf.com/gaodingx/210/design/three/20191014-163045-8111.png',
    },
    {
        name: $tsl('横向梯形'),
        type: 'horizontalTrapezoid',
        attrs: [
            { name: $tsl('梯形强度'), value: 40, min: -80, max: 80, start: 0 },
            { name: $tsl('相对高度'), value: 15, min: -80, max: 80, start: 0 },
        ],
        url: 'https://st-gdx.dancf.com/gaodingx/210/design/three/20191014-163045-69de.png',
    },
    {
        name: $tsl('折角'),
        type: 'bevel',
        attrs: [{ name: $tsl('强度'), value: 10, min: -20, max: 20, start: 0 }],
        url: 'https://st-gdx.dancf.com/gaodingx/210/design/three/20191014-163045-2fcb.png',
    },
    {
        name: $tsl('上屋顶'),
        type: 'upperRoof',
        attrs: [{ name: $tsl('强度'), value: 10, min: -20, max: 20, start: 0 }],
        url: 'https://st-gdx.dancf.com/gaodingx/210/design/three/20191014-163045-110f.png',
    },
    {
        name: $tsl('下屋顶'),
        type: 'lowerRoof',
        attrs: [{ name: $tsl('强度'), value: 10, min: -50, max: 50, start: 0 }],
        url: 'https://st-gdx.dancf.com/gaodingx/210/design/three/20191014-163045-7ee1.png',
    },
    {
        name: $tsl('折角凸出'),
        type: 'angledProjection',
        attrs: [{ name: $tsl('强度'), value: 5, min: 0, max: 10, start: 0 }],
        url: 'https://st-gdx.dancf.com/gaodingx/210/design/three/20191014-163045-22e4.png',
    },
    {
        name: $tsl('折角内凹'),
        type: 'foldedCorner',
        attrs: [{ name: $tsl('强度'), value: 5, min: 0, max: 10, start: 0 }],
        url: 'https://st-gdx.dancf.com/gaodingx/210/design/three/20191014-163045-7709.png',
    },
    {
        name: $tsl('横向拉伸'),
        type: 'lateralStretching',
        attrs: [{ name: $tsl('强度'), value: 25, min: -50, max: 50, start: 0 }],
        url: 'https://st-gdx.dancf.com/gaodingx/210/design/three/20191014-163045-d5f7.png',
    },
    {
        name: $tsl('纵向拉伸'),
        type: 'verticalStretching',
        attrs: [{ name: $tsl('强度'), value: 25, min: -50, max: 50, start: 0 }],
        url: 'https://st-gdx.dancf.com/gaodingx/210/design/three/20191014-163045-21ab.png',
    },
    {
        name: $tsl('错落'),
        type: 'patchwork-byWord',
        pattern: '1',
        attrs: [{ name: $tsl('强度'), value: 10, min: -50, max: 50, start: 0 }],
        url: 'https://st-gdx.dancf.com/gaodingx/210/design/three/20191014-163045-696e.png',
    },
    {
        name: $tsl('阶梯'),
        type: 'step-byWord',
        pattern: '11',
        attrs: [{ name: $tsl('强度'), value: 50, min: -100, max: 100, start: 0 }],
        url: 'https://st-gdx.dancf.com/gaodingx/210/design/three/20191014-163045-d682.png',
    },
    {
        name: $tsl('拱形'),
        type: 'arch2-byWord',
        pattern: '21',
        attrs: [{ name: $tsl('强度'), value: 50, min: -100, max: 100, start: 0 }],
        url: 'https://st-gdx.dancf.com/gaodingx/210/design/three/20191014-163045-4962.png',
    },
    {
        name: $tsl('波形'),
        type: 'wave-byWord',
        pattern: '31',
        attrs: [{ name: $tsl('强度'), value: 25, min: -50, max: 50, start: 0 }],
        url: 'https://st-gdx.dancf.com/gaodingx/210/design/three/20191014-163045-576b.png',
    },
    {
        name: $tsl('阶梯远近'),
        type: 'stepFarAndNear-byWord',
        pattern: '12',
        attrs: [{ name: $tsl('强度'), value: 40, min: -100, max: 100, start: 0 }],
        url: 'https://st-gdx.dancf.com/gaodingx/210/design/three/20191014-163045-671a.png',
    },
    {
        name: $tsl('拱形远近'),
        type: 'archFarAndNear-byWord',
        pattern: '22',
        attrs: [{ name: $tsl('强度'), value: 40, min: -200, max: 200, start: 0 }],
        url: 'https://st-gdx.dancf.com/gaodingx/210/design/three/20191014-163045-e69a.png',
    },
    {
        name: $tsl('水平旋转'),
        type: 'horizontalRotate-byWord',
        pattern: '51',
        attrs: [{ name: $tsl('角度'), value: 25, min: -60, max: 60, start: 0 }],
        url: 'https://st-gdx.dancf.com/gaodingx/210/design/three/20191014-163045-05dd.png',
    },
    {
        name: $tsl('垂直旋转'),
        type: 'verticalRotate-byWord',
        pattern: '50',
        attrs: [{ name: $tsl('角度'), value: 25, min: -90, max: 90, start: 0 }],
        url: 'https://st-gdx.dancf.com/gaodingx/210/design/three/20191014-163045-e974.png',
    },
    {
        name: $tsl('水平弧形路径'),
        type: 'horizontalCurvedRotate-byWord',
        pattern: '70',
        attrs: [{ name: $tsl('强度'), value: 50, min: -200, max: 200, start: 0 }],
        url: 'https://st-gdx.dancf.com/gaodingx/210/design/three/20191014-163045-b6b4.png',
    },
    {
        name: $tsl('垂直弧形路径'),
        type: 'verticalCurvedRotate-byWord',
        pattern: '71',
        attrs: [{ name: $tsl('强度'), value: 50, min: -200, max: 200, start: 0 }],
        url: 'https://st-gdx.dancf.com/gaodingx/210/design/three/20191014-163045-5378.png',
    },
    {
        name: $tsl('逐字分散'),
        type: 'arbitraryOffsetRotate-byWord',
        pattern: '80',
        attrs: [
            { name: $tsl('偏移强度'), value: 2, min: -20, max: 20, start: 0 },
            { name: $tsl('旋转强度'), value: 2, min: -20, max: 20, start: 0 },
        ],
        url: 'https://st-gdx.dancf.com/gaodingx/210/design/three/20191016-203319-a505.png',
    },
];
