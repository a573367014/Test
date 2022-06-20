import { ExtrudeBufferGeometry } from './ExtrudeGeometry.js';
import { Font } from '../extras/core/Font';

onmessage = (e) => {
    const { data, glyphs, options } = e.data;
    const { size, offsetScale } = options;

    const { shapes, para } = Font.generateShapes(glyphs, size, data, offsetScale);
    Object.assign(options, para);
    const bufferGeometry = new ExtrudeBufferGeometry(shapes, options);
    postMessage(bufferGeometry);
};
