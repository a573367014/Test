import { ObjRenderer } from '../src/renderer-creators/obj-renderer';
import element from './data/sphere-model';
// import element from './data/cube-model';
// import element from './data/plane-model';

const canvas = document.querySelector('canvas');
const objRenderer = new ObjRenderer(canvas);

async function setFont() {
    await objRenderer.init();
    await objRenderer.loadMaterials(element);
    await objRenderer.updateShapeModel(element);
    await objRenderer.updateEnvironment(element);
    const { materials } = element;
    objRenderer.updateMaterials(materials);
    objRenderer.updateCanvasSize(element, 1);
    objRenderer.updateCamera(element);
    objRenderer.updatePointLights(element);
    objRenderer.updateHemiLights(element);

    objRenderer.render();
}

setFont();



