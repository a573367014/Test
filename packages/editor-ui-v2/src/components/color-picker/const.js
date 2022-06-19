import { isGradientColor, isMapColor, isPureColor } from '../../utils/color';

import { useI18n } from '@gaoding/vue-i18next';

const { $tsl } = useI18n('editor-ui-v2');
export const defaultColorPreset = {
    id: 'default_colors',
    get name() {
        return $tsl('颜色预设');
    },
    list: [
        '#000000',
        '#105EF5',
        '#F53333',
        '#FFDE00',
        '#3CE025',
        '#3AEFF4',
        '#6929E1',
        '#E633E6',
        '#B0B0B0',
        '#4D7CFF',
        'rgba(255, 51, 51, 0.6)',
        'rgba(255, 222, 0, 0.6)',
        'rgba(51, 235, 51, 0.6)',
        'rgba(56, 250, 245, 0.6)',
        'rgba(94, 23, 235, 0.6)',
        'rgba(240, 51, 240, 0.6)',
        '#DDE0E3',
        '#759FFF',
        'rgba(255, 51, 51, 0.3)',
        'rgba(255, 222, 0, 0.3)',
        'rgba(51, 235, 51, 0.3)',
        'rgba(56, 250, 245, 0.3)',
        'rgba(94, 23, 235, 0.3)',
        'rgba(240, 51, 240, 0.3)',
        '#FFFFFF',
        '#C7DBFF',
        'rgba(255, 51, 51, 0.15)',
        'rgba(255, 222, 0, 0.15)',
        'rgba(51, 235, 51, 0.15)',
        'rgba(56, 250, 245, 0.15)',
        'rgba(94, 23, 235, 0.15)',
        'rgba(240, 51, 240, 0.15)',
    ],
};

export const defaultGradientPreset = {
    id: 'default_colors',
    get name() {
        return $tsl('渐变预设');
    },
    list: [
        {
            stops: [
                { color: '#2254F4', offset: 0.2539 },
                { color: '#0ACFFE', offset: 1 },
            ],
        },
        {
            stops: [
                { color: '#02B3F4', offset: 0.1653 },
                { color: '#00F2FE', offset: 1 },
            ],
        },
        {
            stops: [
                { color: '#D3FFFE', offset: 0 },
                { color: '#01EDFD', offset: 1 },
            ],
        },
        {
            stops: [
                { color: '#6616CE', offset: 0 },
                { color: '#2254F4', offset: 1 },
            ],
        },
        {
            stops: [
                { color: '#F83600', offset: 0 },
                { color: '#FACC22', offset: 1 },
            ],
        },
        {
            stops: [
                { color: '#FFE259', offset: 0 },
                { color: '#FFA751', offset: 1 },
            ],
        },
        {
            stops: [
                { color: '#FFE106', offset: 0 },
                { color: '#B3FFDA', offset: 1 },
            ],
        },
        {
            stops: [
                { color: '#F7797D', offset: 0 },
                { color: '#F9D423', offset: 0.95 },
                { color: '#FFF629', offset: 1 },
            ],
        },
        {
            stops: [
                { color: '#FF0B0D', offset: 0 },
                { color: '#FF7979', offset: 1 },
            ],
        },
        {
            stops: [
                { color: '#FF0F93', offset: 0 },
                { color: '#FE5455', offset: 0.8216 },
                { color: '#F54444', offset: 1 },
            ],
        },
        {
            stops: [
                { color: '#FC5C7D', offset: 0 },
                { color: '#FFFBD5', offset: 1 },
            ],
        },
        {
            stops: [
                { color: '#FF0F93', offset: 0 },
                { color: '#C471ED', offset: 0.01 },
                { color: '#F64F59', offset: 1 },
            ],
        },
        {
            stops: [
                { color: '#11998E', offset: 0 },
                { color: '#38EF7D', offset: 1 },
            ],
        },
        {
            stops: [
                { color: '#ABFFCB', offset: 0 },
                { color: '#00E268', offset: 1 },
            ],
        },
        {
            stops: [
                { color: '#61FF9C', offset: 0 },
                { color: '#5FAFFA', offset: 1 },
            ],
        },
        {
            stops: [
                { color: '#8CF4BE', offset: 0 },
                { color: '#FAFFD1', offset: 1 },
            ],
        },
        {
            stops: [
                { color: '#2CF1FD', offset: 0 },
                { color: '#9AC081', offset: 0.5 },
                { color: '#F99516', offset: 0.94 },
            ],
        },
        {
            stops: [
                { color: '#3022EE', offset: 0 },
                { color: '#8F1480', offset: 0.54 },
                { color: '#EC0713', offset: 1 },
            ],
        },
        {
            stops: [
                { color: '#12D6DF', offset: 0 },
                { color: '#8671EF', offset: 0.48 },
                { color: '#F70FFF', offset: 0.94 },
            ],
        },
        {
            stops: [
                { color: '#1E9600', offset: 0 },
                { color: '#FFF200', offset: 0.51 },
                { color: '#F32935', offset: 1 },
            ],
        },
        {
            stops: [
                { color: '#D9FFFF', offset: 0 },
                { color: '#FFE8B3', offset: 1 },
            ],
        },
        {
            stops: [
                { color: '#B9FCF9', offset: 0 },
                { color: '#FFE7EF', offset: 1 },
            ],
        },
        {
            stops: [
                { color: '#FFFAE0', offset: 0 },
                { color: '#FFD1F1', offset: 1 },
            ],
        },
        {
            stops: [
                { color: '#D6FFCD', offset: 0 },
                { color: '#B5FDEE', offset: 1 },
            ],
        },
        {
            stops: [
                { color: '#000000', offset: 0.265 },
                { color: 'rgba(255, 255, 255, 0.22)', offset: 1 },
            ],
        },
        {
            stops: [
                { color: '#000000', offset: 0.176 },
                { color: 'rgba(196, 196, 196, 0)', offset: 1 },
            ],
        },
        {
            stops: [
                { color: '#BEBEBE', offset: 0 },
                { color: '#000000', offset: 1 },
            ],
        },
        {
            stops: [
                { color: '#304352', offset: 0 },
                { color: '#D7D2CC', offset: 1 },
            ],
        },
        {
            stops: [
                { color: '#CBA64D', offset: 0 },
                { color: '#EDCD5B', offset: 0.265 },
                { color: '#FFFBBB', offset: 0.5 },
                { color: '#EDCD5B', offset: 0.723 },
                { color: '#CEAB4A', offset: 1 },
            ],
        },
        {
            stops: [
                { color: '#B9930D', offset: 0 },
                { color: '#FEF695', offset: 0.5 },
                { color: '#B79009', offset: 1 },
            ],
        },
        {
            stops: [
                { color: '#A8B6C4', offset: 0 },
                { color: '#FAF6F2', offset: 0.535 },
                { color: '#A8B6C4', offset: 1 },
            ],
        },
        {
            stops: [
                { color: '#68747D', offset: 0 },
                { color: '#F0F0F0', offset: 0.535 },
                { color: '#68747D', offset: 1 },
            ],
        },
    ].map((gradient) => ({ angle: 0, ...gradient })),
};

// 图案填充映射
export const FILL_TYPE_CONFIG = {
    fill: {
        get name() {
            return $tsl('充满图框');
        },
    },
    fit: {
        get name() {
            return $tsl('适应图框');
        },
    },
    crop: {
        get name() {
            return $tsl('贴合图框');
        },
    },
    tiled: {
        get name() {
            return $tsl('平铺图案');
        },
    },
};
export const FILL_TYPE_MAP = {
    FILL: 'fill',
    FIT: 'fit',
    CROP: 'crop',
    TILED: 'tiled',
};

export const defaultMapPreset = {
    id: $tsl('图案预设'),
    get name() {
        return $tsl('图案预设');
    },
    list: [
        {
            image: 'https://st0.dancf.com/csc/157/material-2d-textures/0/20190714-174653-ed3c.jpg',
        },
    ],
};

export const COLOR_TYPE_MAP = {
    COLOR: 'color',
    GRADIENT: 'gradient',
    MAP: 'map',
};

export const defaultTabConfig = {
    color: {
        get name() {
            return $tsl('纯色');
        },
        rule: isPureColor,
    },
    gradient: {
        get name() {
            return $tsl('渐变');
        },
        rule: isGradientColor,
    },
    map: {
        name: (vm) =>
            vm.type === 'text-environment-light'
                ? $tsl('环境贴图')
                : vm.threeMode
                ? $tsl('贴图')
                : $tsl('图案'),
        rule: isMapColor,
    },
};

// 元素可选颜色映射
export const elementColorMap = {
    background: ['color', 'gradient'],
    'text-effect-filling': ['color', 'gradient', 'map'],
    'text-effect-shadow': ['color'],
    'text-effect-stroke': ['color'],
    'image-effect-filling': ['color', 'gradient', 'map'],
    'image-effect-shadow': ['color'],
    'image-effect-stroke': ['color'],
    'text-environment-light': ['color', 'map'],
    'three-albedo-filling': ['color', 'gradient', 'map'],
    'table-background': ['color', 'gradient'],
    'path-fill': ['color', 'gradient'],
};

// 环境贴图
export const environmentImages = [
    'https://st-gdx.dancf.com/gaodingx/17/design/three/20190530-210836-623d.jpg',
    'https://st-gdx.dancf.com/gaodingx/83883312/design/20190621-105030-38e8.png',
    'https://st-gdx.dancf.com/gaodingx/17/design/three/20190530-210836-70d1.jpg',
    'https://st-gdx.dancf.com/gaodingx/17/design/three/20190530-210836-f745.jpg',
    'https://st-gdx.dancf.com/gaodingx/17/design/three/20190530-210836-408d.jpg',
    'https://st-gdx.dancf.com/gaodingx/210/design/three/20190628-120125-3372.jpg',
    'https://st-gdx.dancf.com/gaodingx/210/design/three/20190628-120125-565c.jpg',
    'https://st-gdx.dancf.com/gaodingx/210/design/three/20190628-120125-5ef1.jpg',
    'https://st-gdx.dancf.com/gaodingx/210/design/three/20190628-120125-5d2d.jpg',
    'https://st-gdx.dancf.com/gaodingx/210/design/three/20190628-120125-7dd1.jpg',
    'https://st-gdx.dancf.com/gaodingx/210/design/three/20190628-120125-eb79.jpg',
    'https://st-gdx.dancf.com/gaodingx/210/design/three/20190628-120125-4e8b.jpg',
    'https://st-gdx.dancf.com/gaodingx/210/design/three/20190628-120125-ec51.jpg',
    'https://st-gdx.dancf.com/gaodingx/210/design/three/20190628-120125-14c5.jpg',
    'https://st-gdx.dancf.com/gaodingx/210/design/three/20190628-120125-d74c.jpg',
    'https://st-gdx.dancf.com/gaodingx/210/design/three/20190628-120125-2206.jpg',
    'https://st-gdx.dancf.com/gaodingx/210/design/three/20190628-120125-4005.jpg',

    // 201908 新增
    'https://st-gdx.dancf.com/gaodingx/212/design/three/20190806-111132-a2d2.jpg',
    'https://st-gdx.dancf.com/gaodingx/212/design/three/20190806-111132-d41d.jpg',
    'https://st-gdx.dancf.com/gaodingx/212/design/three/20190806-111132-d102.jpg',
    'https://st-gdx.dancf.com/gaodingx/212/design/three/20190806-111132-fd3e.jpg',
    'https://st-gdx.dancf.com/gaodingx/212/design/three/20190806-111132-0076.jpg',
    'https://st-gdx.dancf.com/gaodingx/212/design/three/20190806-111132-15e4.jpg',
    'https://st-gdx.dancf.com/gaodingx/212/design/three/20190806-111132-26e4.jpg',
];

// 凹凸贴图
const baseUrl = 'https://st0.dancf.com/csc/147/material-three-normals/0/';
export const threeNormalPresets = [
    {
        get name() {
            return $tsl('金属贴图');
        },
        images: [
            '20190606-151916-9346.jpg',
            '20190606-151833-3ed9.jpg',
            '20190606-151857-6ac7.jpg',
            '20190606-151833-48f5.jpg',
            '20190606-151857-e047.jpg',
            '20190606-151916-ca5c.jpg',
            '20190606-151833-7abc.jpg',
            '20190606-151857-8a5d.jpg',
            '20190606-151813-8a3c.jpg',
            '20190606-151833-704c.jpg',
            '20190606-151833-aa1b.jpg',
            '20190606-151833-6113.jpg',
            '20190606-151916-dcaa.jpg',
            '20190606-151833-89f6.jpg',
            '20190606-151916-2ba5.jpg',
            '20190606-151916-348d.jpg',
            '20190606-151813-a12d.jpg',
            '20190606-151833-96fd.jpg',
            '20190606-151833-75b2.jpg',
            '20190606-151833-d007.jpg',
            '20190606-151833-f16e.jpg',
            '20190606-151833-d795.jpg',
            '20190606-151813-230c.jpg',
        ].map((name) => baseUrl + name),
    },
    {
        get name() {
            return $tsl('自然贴图');
        },
        images: [
            '20190607-201533-0703.jpg',
            '20190607-201332-35ff.jpg',
            '20190607-201533-bdc3.jpg',
            '20190607-201533-068f.jpg',
            '20190607-201533-f339.jpg',
            '20190607-201533-b601.jpg',
            '20190607-201533-21a5.jpg',
            '20190607-201533-0489.jpg',
            '20190607-201332-957b.jpg',
            '20190607-201533-d389.jpg',
            '20190607-201533-1759.jpg',
            '20190607-201533-cf59.jpg',
            '20190607-201332-54eb.jpg',
            '20190607-201533-dc79.jpg',
            '20190607-201533-931f.jpg',
            '20190607-201332-fa12.jpg',
            '20190607-201533-219e.jpg',
            '20190607-201533-c093.jpg',
            '20190607-201533-68c3.jpg',
            '20190607-201533-f535.jpg',
            '20190607-201533-7f06.jpg',
            '20190607-201533-47fb.jpg',
        ].map((name) => baseUrl + name),
    },
];
