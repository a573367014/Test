import { Geometry } from '../core/Geometry.js';
import { ExtrudeBufferGeometry } from './ExtrudeGeometry.js';
import ExtrudeGeometryWorker from 'web-worker:./ExtrudeGeometry.worker';
import { BufferAttribute } from '../core/BufferAttribute';
import { Box3 } from '../math/Box3';
import { Vector3 } from '../math/Vector3';
import { Font } from '../extras/core/Font.js';

let extrudeBufferGeometryWorker = null;

// TextBufferGeometry

function TextBufferGeometry(text, parameters = { lineHeight: 1, letterSpacing: 1 }) {
    const { font } = parameters;

    if (!font || !font.isFont) {
        console.error('THREE.TextBufferGeometry: font parameter is not an instance of THREE.Font.');
        return new Geometry();
    }

    const chars = Array.from ? Array.from(text) : String(text).split(''); // see #13988
    // 将不识别的字符转化成'?'
    const glyphs = chars.map((char) =>
        Object.assign({ name: char }, font.data.glyphs[char] || font.data.glyphs['?']),
    );
    const data = {
        lineHeightData: font.data.lineHeightData,
        resolution: font.data.resolution,
        boundingBox: font.data.boundingBox,
        lineHeight: parameters.lineHeight,
        letterSpacing: parameters.letterSpacing,
        textAlign: parameters.textAlign,
    };

    parameters.depth = parameters.height || 50;
    parameters.bevelThickness = parameters.bevelThickness || 10;
    parameters.bevelSize = parameters.bevelSize || 1;
    parameters.bevelEnabled = parameters.bevelEnabled || false;
    parameters.shadingSmoothAngle = parameters.shadingSmoothAngle || 0;
    parameters.bevelSize = -Math.abs(parameters.bevelSize);

    this.type = 'TextBufferGeometry';
    this.parameters = {
        glyphs,
        data,
        options: parameters,
    };
}

TextBufferGeometry.prototype = Object.create(ExtrudeBufferGeometry.prototype);
Object.assign(TextBufferGeometry.prototype, {
    constructor: TextBufferGeometry,
    async init() {
        const promise = new Promise((resolve, reject) => {
            if (this.parameters.options.worker) {
                if (!extrudeBufferGeometryWorker) {
                    extrudeBufferGeometryWorker = new ExtrudeGeometryWorker();
                }
                extrudeBufferGeometryWorker.onmessage = (e) => {
                    Object.keys(e.data.attributes).forEach((key) => {
                        Object.setPrototypeOf(e.data.attributes[key], BufferAttribute.prototype);
                    });
                    Object.assign(this, e.data);
                    Object.setPrototypeOf(e.data.boundingBox, Box3.prototype);
                    Object.setPrototypeOf(e.data.boundingBox.min, Vector3.prototype);
                    Object.setPrototypeOf(e.data.boundingBox.max, Vector3.prototype);
                    resolve(this);
                };
                extrudeBufferGeometryWorker.onerror = (err) => {
                    reject(err);
                };
                extrudeBufferGeometryWorker.postMessage(this.parameters);
            } else {
                const { data, glyphs, options } = this.parameters;
                const { size, offsetScale } = options;
                const { shapes, para } = Font.generateShapes(glyphs, size, data, offsetScale);
                Object.assign(options, para);
                ExtrudeBufferGeometry.call(this, shapes, options);
                resolve(this);
            }
        });
        return promise;
    },
});

export { TextBufferGeometry };
