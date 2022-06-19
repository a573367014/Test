import text from './text';
import group from './group';
import mask from './mask';
import image from './image';
import svg from './svg';
import ninePatch from './nine-patch';

export default {
    text: () => Promise.resolve({ default: text }),
    image: () => Promise.resolve({ default: image }),
    mask: () => Promise.resolve({ default: mask }),
    svg: () => Promise.resolve({ default: svg }),
    group: () => Promise.resolve({ default: group }),
    ninePatch: () => Promise.resolve({ default: ninePatch }),
    audio: () => import(/* webpackChunkName: "audio-element" */ './audio'),
    video: () => import(/* webpackChunkName: "video-element" */ './video'),
    // styledText: () => import(/* webpackChunkName: "styled-text-element" */ './styled-text'),
    threeText: () => import(/* webpackChunkName: "three-element" */ './three-text'),
    cell: () => import(/* webpackChunkName: "cell-element" */ './cell'),
    collage: () => import(/* webpackChunkName: "collage-element" */ './collage'),
    table: () => import(/* webpackChunkName: "table-element" */ './table'),
    chart: () => import(/* webpackChunkName: "chart-element" */ './chart'),
    watermark: () => import(/* webpackChunkName: "watermark-element" */ './watermark'),
    effectText: () => import(/* webpackChunkName: "effect-text-element" */ './effect-text'),
    rect: () => import(/* webpackChunkName: "rect-element" */ './rect'),
    ellipse: () => import(/* webpackChunkName: "ellipse-element" */ './ellipse'),
    line: () => import(/* webpackChunkName: "line-element" */ './line'),
    arrow: () => import(/* webpackChunkName: "arrow-element" */ './arrow'),
    brush: () => import(/* webpackChunkName: "brush-element" */ './brush'),
    flex: () => import(/* webpackChunkName: "flex-element" */ './flex'),
    path: () => import(/* webpackChunkName: "path-element" */ './path'),
};
