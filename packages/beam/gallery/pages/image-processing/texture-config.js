import { Beam, ResourceTypes } from '../../../src/index.js';
import { PolygonTexture } from './texture-config-plugin.js';
import { createRect } from '../../utils/graphics-utils.js';
import { loadImages } from '../../utils/image-loader.js';

const { DataBuffers, IndexBuffer, Uniforms, Textures } = ResourceTypes;

const canvas = document.querySelector('canvas');
const beam = new Beam(canvas);

const plugin = beam.plugin(PolygonTexture);
const quad = createRect();
const dataBuffers = beam.resource(DataBuffers, quad.data);
const indexBuffer = beam.resource(IndexBuffer, quad.index);
const textures = beam.resource(Textures);
const uniforms = beam.resource(Uniforms);

const render = () => {
    beam.clear().draw(plugin, dataBuffers, indexBuffer, uniforms, textures);
};

loadImages('../../assets/images/venus.jpg').then(([image]) => {
    textures.set('img', { image, flip: true });
    render();
});

const $scale = document.getElementById('scale');
$scale.addEventListener('input', () => {
    const scale = parseFloat($scale.value);
    uniforms.set('scale', scale);
    render();
});

const $wrap = document.getElementById('wrap-select');
$wrap.addEventListener('input', () => {
    const wrap = $wrap.value;
    textures.set('img', { wrapS: wrap, wrapT: wrap });
    render();
});

const $magFilter = document.getElementById('mag-filter-select');
$magFilter.addEventListener('input', () => {
    textures.set('img', { magFilter: $magFilter.value });
    render();
});
const $minFilter = document.getElementById('min-filter-select');
$minFilter.addEventListener('input', () => {
    textures.set('img', { minFilter: $minFilter.value });
    render();
});
