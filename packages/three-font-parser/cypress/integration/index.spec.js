/// <reference types="Cypress" />
import { loadFont, createTextModel } from '../../dist/three-font-parser.esm';

const TEXT = 'o';
const FONT_URL = 'https://st0.dancf.com/csc/3/fonts/0/20190015-164859-b2d8.woff';

describe('loadFont', () => {
    it('should return THREE.font', async() => {
        const font = await loadFont(FONT_URL);
        expect(font.type).to.equal('Font');
        expect(font.data).to.be.ok;
    });
    it('should throw error when url is bad', async() => {
        let error = null;
        try {
            await loadFont('asd');
        }
        catch(err) {
            error = err;
        }
        expect(error).to.be.exist;
    });
});

describe('createTextModel', () => {
    it('should return correct model', async() => {
        const option = {
            deformation: {
                // enable: true,
                type: 'none',
                intensity: 0,
                intensity1: 0,
                extrudeScaleX: 0, // 挤出面 x 方向缩放
                extrudeScaleY: 0, // 挤出面 y 方向缩放
            },
            // 逐字偏移
            warpByWord: {
                enable: false,
                intensity: 0,
                intensity1: 0,
                randNum: 1000,
                pattern: '1',
                offsetX: 0,
            },
        }
        option.font = await loadFont(FONT_URL);
        const textModel = await createTextModel(TEXT, option);
        cy.wrap(textModel).snapshot();
    });
});

