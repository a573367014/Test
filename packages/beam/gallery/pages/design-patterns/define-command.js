/* eslint-env browser */
import { Beam, ResourceTypes } from '../../../src/index.js';
import { ImageColor } from '../../plugins/basic-graphics-plugins.js';
import { createBall } from '../../utils/graphics-utils.js';
import { createCamera } from '../../utils/camera.js';
import { rotate } from '../../utils/mat4.js';
import { loadImages } from '../../utils/image-loader.js';

const { DataBuffers, IndexBuffer, Uniforms, Textures } = ResourceTypes;

const canvas = document.querySelector('canvas');
const beam = new Beam(canvas);

const AlphaCommand = {
    name: 'alpha',
    onBefore(gl) {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    },
};
// Define your custom "alpha" command
beam.define(AlphaCommand);

canvas.height = document.body.offsetHeight;
canvas.width = document.body.offsetWidth;

const plugin = beam.plugin(ImageColor);
const eye = [0, 0, 10];
const baseViewMat = createCamera({ eye }).viewMat;
const cameraMats = createCamera({ eye }, { canvas });
const ball = createBall();
const dataBuffer = beam.resource(DataBuffers, ball.data);
const indexBuffer = beam.resource(IndexBuffer, ball.index);
const cameraResource = beam.resource(Uniforms, cameraMats);

loadImages('../../assets/images/world-map.svg').then(([image]) => {
    const imageState = { img: { image, flip: true } };
    const imageResource = beam.resource(Textures, imageState);

    let i = 0;
    const tick = () => {
        i += 0.02;
        const viewMat = rotate([], baseViewMat, i, [0, 1, 0]);
        cameraResource.set('viewMat', viewMat);
        const resources = [dataBuffer, indexBuffer, cameraResource, imageResource];

        // Using the defined 'alpha' command
        beam.clear([1, 1, 1, 1])
            .alpha() // Try commenting this out!
            .draw(plugin, ...resources);

        requestAnimationFrame(tick);
    };
    tick();
});
