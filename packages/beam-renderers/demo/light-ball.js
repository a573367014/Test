import { LightBallRenderer } from '../src/renderer-creators/light-ball-renderer';
import sphereModel from './data/sphere-model';

const canvas = document.querySelector('#glCanvas');
canvas.height = 600;
canvas.width = 600;

const lightBallRenderer = new LightBallRenderer(canvas);
const pointLights = sphereModel.pointLights;
lightBallRenderer.init();
lightBallRenderer.updatePointLights({ pointLights });
lightBallRenderer.render();



