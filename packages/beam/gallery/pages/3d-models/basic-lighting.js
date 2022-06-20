/* eslint-env browser */

import { Beam, ResourceTypes } from '../../../src/index.js';
import { LambertLighting } from '../../plugins/basic-lighting-plugin.js';
import { parseOBJ } from '../../utils/obj-loader.js';
import { createCamera } from '../../utils/camera.js';
import { create, rotate } from '../../utils/mat4.js';

const { DataBuffers, IndexBuffer, Uniforms } = ResourceTypes;

const canvas = document.querySelector('canvas');
canvas.height = document.body.offsetHeight;
canvas.width = document.body.offsetWidth;
const beam = new Beam(canvas);
const plugin = beam.plugin(LambertLighting);
const cameraMats = createCamera({ eye: [0, 6, 6] }, { canvas });
const matrices = beam.resource(Uniforms, cameraMats);
const light = beam.resource(Uniforms);
const modelBuffers = [];

const render = () => beam.clear().draw(plugin, ...modelBuffers, matrices, light);

fetch('../../assets/models/bunny.obj')
    .then((resp) => resp.text())
    .then((str) => {
        const [model] = parseOBJ(str);
        modelBuffers[0] = beam.resource(DataBuffers, model.data);
        modelBuffers[1] = beam.resource(IndexBuffer, model.index);
        render();
    });

const $modelX = document.getElementById('model-x');
const $modelY = document.getElementById('model-y');
const $modelZ = document.getElementById('model-z');
[$modelX, $modelY, $modelZ].forEach((input) => {
    input.addEventListener('input', () => {
        const [rx, ry, rz] = [$modelX.value, $modelY.value, $modelZ.value];
        const modelMat = create();
        rotate(modelMat, modelMat, (rx / 180) * Math.PI, [1, 0, 0]);
        rotate(modelMat, modelMat, (ry / 180) * Math.PI, [0, 1, 0]);
        rotate(modelMat, modelMat, (rz / 180) * Math.PI, [0, 0, 1]);
        matrices.set('modelMat', modelMat);
        render();
    });
});

const $dirX = document.getElementById('dir-x');
const $dirY = document.getElementById('dir-y');
const $dirZ = document.getElementById('dir-z');
[$dirX, $dirY, $dirZ].forEach((input) => {
    input.addEventListener('input', () => {
        const [dx, dy, dz] = [$dirX.value, $dirY.value, $dirZ.value];
        light.set('dirLight.direction', [dx, dy, dz]);
        render();
    });
});

const $dirStrength = document.getElementById('dir-strength');
$dirStrength.addEventListener('input', () => {
    light.set('dirLight.strength', $dirStrength.value);
    render();
});

const $dirColor = document.getElementById('dir-color');
$dirColor.addEventListener('input', () => {
    const hex = $dirColor.value;
    const rgb = [
        parseInt(hex.slice(1, 3), 16) / 256,
        parseInt(hex.slice(3, 5), 16) / 256,
        parseInt(hex.slice(5, 7), 16) / 256,
    ];
    light.set('dirLight.color', rgb);
    render();
});
