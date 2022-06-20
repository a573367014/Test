import { Beam, ResourceTypes } from '../../../src/index.js';
import { NormalColor } from '../../plugins/basic-graphics-plugins.js';
import { createBall, createBox } from '../../utils/graphics-utils.js';
import { createCamera } from '../../utils/camera.js';
import { create, translate } from '../../utils/mat4.js';

const { DataBuffers, IndexBuffer, Uniforms } = ResourceTypes;

const canvas = document.querySelector('canvas');
const beam = new Beam(canvas);

const plugin = beam.plugin(NormalColor);
const ball = createBall();
const box = createBox();
const ballBuffers = [beam.resource(DataBuffers, ball.data), beam.resource(IndexBuffer, ball.index)];
const boxBuffers = [beam.resource(DataBuffers, box.data), beam.resource(IndexBuffer, box.index)];

const cameraMats = createCamera(
    // For center, use { eye: [10.5, 10.5, 50], center: [10.5, 10.5, 0] }
    { eye: [0, 50, 50], center: [10, 10, 0] },
    { canvas },
);
const matrices = beam.resource(Uniforms, cameraMats);
const baseMat = create();

const render = () => {
    beam.clear();
    for (let i = 1; i < 10; i++) {
        for (let j = 1; j < 10; j++) {
            const modelMat = translate([], baseMat, [i * 2, j * 2, 0]);
            matrices.set('modelMat', modelMat);
            const resources = (i + j) % 2 ? ballBuffers : boxBuffers;
            beam.draw(plugin, ...resources, matrices);
        }
    }
};

render();
