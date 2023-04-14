import * as THREE from 'three';

import {
  initRenderer,
  initCamera,
  initDefaultDirectionalLighting,
  onWindowResize,
} from "../libs/util/util.js";

import { Sky } from '../assets/shaders/Sky.js';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';

import { CONFIG } from './config.js';
import { createGround, createAirplane } from './meshGenerators.js';
import { ZTranslater } from './ZTranslater.js';
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
window.addEventListener('resize', () => {
  onWindowResize(camera, renderer)
}, false);

let plane = createAirplane();
scene.add(plane);

let planeController = new PlaneController(plane, renderer.domElement);
if (CONFIG.debug)
  new OrbitControls(camera, renderer.domElement);

/** Coleção dos objetos que se movem (planos e árvores)
 * @type {ZTranslater[]} */
let translaters = []

for (let i = 0; i <= CONFIG.planeCount; ++i) {
  let ground = new ZTranslater(
    -CONFIG.planeCount * CONFIG.planeHeight,
    CONFIG.planeHeight,
    CONFIG.speed,
    createGround(CONFIG.planeWidth, CONFIG.planeHeight, CONFIG.planeVerticalOffset)
  );

  // posição inicial depende da ordem de inserção
  ground.mesh.position.z -= CONFIG.planeHeight * i;

  translaters.push(ground);
}

for (let i = 0; i <= CONFIG.treeCount; ++i)
  translaters.push(new ZTranslater(CONFIG.treePosFrom, CONFIG.treePosTo, CONFIG.speed));

scene.add(...translaters.map(a => a.mesh));

function render() {
  requestAnimationFrame(render);
  let dt = clock.getDelta();
  translaters.forEach(obj => obj.update(dt));
  planeController.update(dt)

  renderer.render(scene, camera) // Render scene
}

let clock = new THREE.Clock();
render();