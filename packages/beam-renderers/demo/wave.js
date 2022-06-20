import { Beam, ResourceTypes } from '@gaoding/beam';
import { Wave } from '../src/plugins/wave-plugins.js';
import { createSphereModel } from '../src/data/geometry';
import { rendererConfig, computeModelMat } from '../src/utils/pbr-utils';
import { mat4 } from 'gl-matrix';

const { DataBuffers, IndexBuffer, Uniforms } = ResourceTypes;

const canvas = document.querySelector('canvas');
canvas.height = document.body.offsetHeight;
canvas.width = document.body.offsetWidth;
const beam = new Beam(canvas, rendererConfig);
const plugin = beam.plugin(Wave);

const center = [0, 0, 0];
const radius = 1;
const viewAngle = Math.PI / 6;
const eyePos = [0, 0, 1.5 * radius / Math.sin(viewAngle / 2)];
let time = 0;

const ball = createSphereModel(50, radius);
const dataBuffer = beam.resource(DataBuffers, ball.data);
const indexBuffer = beam.resource(IndexBuffer, ball.index);

const viewMat = mat4.lookAt(mat4.create(), eyePos, center, [0, 1, 0]);
const projMat = mat4.perspective(mat4.create(), viewAngle, canvas.width / canvas.height, 0.1, 100);
const uniforms = beam.resource(Uniforms, {
    mvpMat: mat4.multiply([], projMat, viewMat),
    size: radius * 2,
    time: 0
});

const CullCommand = {
    name: 'cull',
    onBefore(gl) {
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
    },
    onAfter(gl) {

    }
};
beam.define(CullCommand);

const render = () => {
    beam.clear().draw(plugin, dataBuffer, indexBuffer, uniforms);
};

const tick = () => {
    uniforms.set('time', time += 0.05);
    render();
    window.requestAnimationFrame(tick);
};
tick();

// Update Rotates
const $xRotate = document.getElementById('x-rotate');
const $yRotate = document.getElementById('y-rotate');
const $zRotate = document.getElementById('z-rotate');
const updateMats = () => {
    const [rx, ry, rz] = [$xRotate.value, $yRotate.value, $zRotate.value];
    const modelMat = computeModelMat(rx, ry, rz);
    uniforms.set('mvpMat', modelMat);
    render();
};
[$xRotate, $yRotate, $zRotate].forEach($input => {
    $input.addEventListener('input', updateMats);
});



