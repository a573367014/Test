export const config = {
    maxWebglCanvasSize: 4096,
    structuresNum: 3,
    whiteColor: '#ffffff',
    normalMapColor: '#807fff',
    metalRoughnessColor: '#0099ff',
    brdfUrl: 'https://st-gdx.dancf.com/gaodingx/17/design/20190429-142341-7a2c.png',
    initFontSize: 100,
    ratio: 1,
    timeOut: 20000,
    defaultFont: 'https://st0.dancf.com/csc/3/fonts/0/20190015-164859-b2d8.woff',
    pointLightsNum: 5,
    gradientMaxNum: 4,
    offscreenSize: 1024,
    safeRatio: 1.02, // 设计师反馈部分3D文字的边缘被截掉一部分，故设置一个安全系数
    beamConfig: {
        contextAttributes: {
            // preserveDrawingBuffer: true,
            antialias: true,
        },
        extensions: [
            'EXT_shader_texture_lod',
            'EXT_SRGB',
            'OES_standard_derivatives',
            'OES_element_index_uint',
        ],
    },
};
