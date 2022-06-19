
const sRGBUrl = 'https://st-gdx.dancf.com/gaodingx/212/configs/system/20190709-234006-d991.icc';
const cmykUrl = 'https://st-gdx.dancf.com/gaodingx/212/configs/system/20190709-234052-ace6.icc';

let _promise = null;
/**
 * 获取 cmyk 色彩模式转化实例
 * @returns { Promise<any> }
 */
export function getCMYKService() {
    if(!_promise) {
        _promise = Promise.all([
            fetch(sRGBUrl).then(response => response.arrayBuffer()),
            fetch(cmykUrl).then(response => response.arrayBuffer()),
            import(/* webpackChunkName: "color-alchemy" */ '@gaoding/color-alchemy')
        ])
            .then(([inProfileBuffer, outProfileBuffer, ColorAlchemy]) => {
                const inProfile = new Uint8Array(inProfileBuffer);
                const outProfile = new Uint8Array(outProfileBuffer);
                const { createProofingColorAlchemy, INTENT_PERCEPTUAL, TYPE_RGBA, FLAG_BLACKPOINTCOMPENSATION, FLAG_COPYALPHA, FLAG_GAMUTCHECK } = ColorAlchemy;
                let inType = TYPE_RGBA;
                return createProofingColorAlchemy(inProfile, inType, outProfile, INTENT_PERCEPTUAL, FLAG_BLACKPOINTCOMPENSATION | FLAG_COPYALPHA | FLAG_GAMUTCHECK);
            })
            .catch(error => {
                _promise = null;
                throw error;
            });
    }
    return _promise;
};
