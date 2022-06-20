import { ThreeTextRenderer } from '../src/renderer-creators/three-text-renderer';
import element from './data/three-text-model';
import { vec3, quat } from 'gl-matrix';

const canvas = document.querySelector('canvas');
const threeTextRenderer = new ThreeTextRenderer(canvas);

const layer = element.layers[0];
// FIXME
const materials = [
    layer.frontMaterials,
    layer.sideMaterials.enable ? layer.sideMaterials : layer.frontMaterials,
    layer.frontMaterials
];
async function setFont() {
    await threeTextRenderer.init();
    await threeTextRenderer.prepareFont(element);
    await threeTextRenderer.updateTextModel(element);
    threeTextRenderer.updateCanvasSize(element, 1);
    await threeTextRenderer.loadMaterials(element);
    await threeTextRenderer.updateEnvironment(element);

    threeTextRenderer.updateMaterials(materials);
    threeTextRenderer.updateCamera(element);
    threeTextRenderer.updatePointLights(element);
    threeTextRenderer.updateHemiLights(element);
    threeTextRenderer.updateShadow(element);
    threeTextRenderer.render(element);
}

setFont();



// Update Lights
const $color = document.getElementById('color');
const $rotateX = document.getElementById('rotate-x');
const $rotateY = document.getElementById('rotate-y');
const $strength = document.getElementById('strength');
const $cameraRotateX = document.getElementById('cameraRotate-x');
const $cameraRotateY = document.getElementById('cameraRotate-y');
const $metalness = document.getElementById('metalness');
const $roughness = document.getElementById('roughness');

const initDir = vec3.fromValues(0, 0, 1);
const updateModelRotate = () => {
    const quatNum = quat.create();
    quat.fromEuler(quatNum, Number($rotateX.value), Number($rotateY.value), 0);
    const dir = vec3.transformQuat([], initDir, quatNum);
    const color = $color.value;
    const strength = $strength.value;
    const hemiLight = { enable: true, dir, color, strength };
    element.hemiLight = hemiLight;
    const cameraRotate3d = [$cameraRotateX.value, $cameraRotateY.value, 0];
    element.rotate3d = cameraRotate3d;
    threeTextRenderer.updateHemiLights(element);
    threeTextRenderer.updateCamera(element);
    threeTextRenderer.updateShadow(element);
    threeTextRenderer.render(element);
};
const updateMaterials = () => {
    element.layers[0].frontMaterials.metalStrength = $metalness.value;
    element.layers[0].frontMaterials.roughnessStrength = $roughness.value;
    threeTextRenderer.updateMaterials(materials);
    threeTextRenderer.render(element);
};
[$color, $rotateX, $rotateY, $strength, $cameraRotateX, $cameraRotateY].forEach($input => {
    $input.addEventListener('input', updateModelRotate);
});

[$metalness, $roughness].forEach($input => {
    $input.addEventListener('input', updateMaterials);
});
