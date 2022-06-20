import { Beam, ResourceTypes } from '../../../src/index.js';
import { PolygonColor } from '../../plugins/basic-graphics-plugins.js';

const { DataBuffers, IndexBuffer } = ResourceTypes;

// Init Beam instance
const canvas = document.querySelector('canvas');
const beam = new Beam(canvas);

// Init shade plugin
const plugin = beam.plugin(PolygonColor);

// Init data buffer resource with triangle positions and colors
const dataBuffers = beam.resource(DataBuffers, {
    position: [
        -1,
        -1,
        0, // vertex 0
        0,
        1,
        0, // vertex 1
        1,
        -1,
        0, // vertex 2
    ],
    color: [
        1,
        0,
        0, // vertex 0
        0,
        1,
        0, // vertex 1
        0,
        0,
        1, // vertex 2
    ],
});
// Init index buffer resource with 3 indices
const indexBuffer = beam.resource(IndexBuffer, { array: [0, 1, 2] });

// Clear the screen, then draw a frame with plugin and buffer resources
beam.clear().draw(plugin, dataBuffers, indexBuffer);
