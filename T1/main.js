import * as THREE from 'three';
import { MathUtils } from 'three';

import {
  initRenderer,
  initCamera,
  initDefaultDirectionalLighting,
  onWindowResize,
  createGroundPlane,
} from "../libs/util/util.js";

import { Sky } from '../assets/shaders/Sky.js';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';

import { CONFIG } from './utils.js';
import { createGround, createAirplane, createTree, createCuboid } from './meshGenerators.js';
import { Translater, opacityFog } from './Translater.js';
import { PlaneController } from './PlaneController.js';

// Create main scene
let scene = new THREE.Scene();

// Init a basic renderer
let renderer = initRenderer();
let camera = initCamera(CONFIG.cameraPos); // Init camera in this position
let light = initDefaultDirectionalLighting(scene); // Create a basic light to illuminate the scene

// https://threejs.org/examples/webgl_shaders_sky.html
let sky = new Sky();
sky.scale.setScalar(1000);
scene.add(sky);
sky.material.uniforms['sunPosition'].value.setFromSphericalCoords(1, 0.4 * Math.PI, 0);

// Listen window size changes
window.addEventListener('resize', ev => onWindowResize(camera, renderer));

let plane = createAirplane();
let raycastPlane = createGroundPlane(1000, 1000);
raycastPlane.visible = false;
scene.add(plane, raycastPlane);

let planeController = new PlaneController(plane, camera, raycastPlane);
let orbitController = new OrbitControls(camera, renderer.domElement);

window.addEventListener('blur', _ => CONFIG.simulationOn = false);
window.addEventListener('focus', _ => CONFIG.simulationOn = true);
window.addEventListener('debug', _ => orbitController.enabled = CONFIG.debug)

/** Coleção dos objetos que se movem (planos e árvores)
 * @type {Translater[]} */
let translaters = []
const Z = new THREE.Vector3(0, 0, 1);

for (let i = 0; i < CONFIG.planeCount; ++i) {
  let ground = createGround(CONFIG.planeWidth, CONFIG.planeHeight, CONFIG.planeVerticalOffset);
  ground.material.transparent = true;
  
  let boxLeft = createCuboid(100, 100, 100)
  boxLeft.position.x += CONFIG.planeWidth/2 + 50;
  
  let boxRight = boxLeft.clone();
  boxLeft.position.x -= CONFIG.planeWidth + 100;
  
  let holder = new THREE.Object3D();
  holder.add(boxLeft, ground, boxRight);
  holder.position.z = -CONFIG.planeHeight * i;

  let holderT = new Translater(Z, holder, CONFIG.speed, 1400, opacityFog);
  holderT.startPoint.z = -1200;
  
  translaters.push(holderT);
}

for (let i = 0; i <= CONFIG.treeCount; ++i) {
  let tree = createTree()
  tree.material.transparent = true;

  tree.position.x = MathUtils.randFloatSpread(CONFIG.treeDistribution);
  tree.position.y = CONFIG.treeVerticalOffset;
  tree.position.z = MathUtils.randInt(-1200, 200);

  let translater = new Translater(Z, tree, CONFIG.speed, 1400, opacityFog)
  translater.startPoint.z = -1200

  translaters.push(translater);
}

scene.add(...translaters.map(a => a.object));

function render() {
  requestAnimationFrame(render);
  let dt = clock.getDelta();
  if (CONFIG.simulationOn) {
    translaters.forEach(obj => obj.update(dt));
    planeController.update(dt)
  }

  renderer.render(scene, camera) // Render scene
}

let clock = new THREE.Clock();
render();