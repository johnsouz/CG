import * as THREE from 'three';
import { MathUtils } from 'three';

import {
  initRenderer,
  initCamera,
  onWindowResize,
  createGroundPlaneWired,
} from "../libs/util/util.js";

import { Sky } from '../assets/shaders/Sky.js';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';

import { CONFIG } from './utils.js';
import { createGround, createTree, createCuboid, importAirplane } from './meshGenerators.js';
import { Translater, opacityFog } from './Translater.js';
import { PlaneController } from './PlaneController.js';
import { setDefaultMaterial } from '../libs/util/util.js';

// Create main scene
let scene = new THREE.Scene();

// Init a basic renderer
let renderer = initRenderer();
renderer.outputColorSpace = THREE.SRGBColorSpace;

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.width = 4096;
renderer.shadowMap.height = 4096;

let camera = initCamera(CONFIG.cameraPos); // Init camera in this position
let light = new THREE.DirectionalLight('white', 1.2);
let ambient = new THREE.AmbientLight('white', 0.2);
light.position.set(75, 50, 0);
light.target.position.z = -200;
light.castShadow = true;
light.shadow.camera.left = -200
light.shadow.camera.right = 300
light.shadow.camera.top = 100
light.shadow.camera.bottom = -100
light.shadow.camera.far = 2000

let shadowMapHelper = new THREE.CameraHelper(light.shadow.camera)
scene.add(light, ambient, light.target, shadowMapHelper);

// https://threejs.org/examples/webgl_shaders_sky.html
let sky = new Sky();
sky.scale.setScalar(1000);
scene.add(sky);
sky.material.uniforms['sunPosition'].value.setFromSphericalCoords(1, 0.4 * Math.PI, 0);

// Listen window size changes
window.addEventListener('resize', ev => onWindowResize(camera, renderer));

let planeController = new PlaneController(scene, camera);
let orbitController = new OrbitControls(camera, renderer.domElement);

window.addEventListener('blur', _ => CONFIG.simulationOn = false);
window.addEventListener('focus', _ => CONFIG.simulationOn = true);
window.addEventListener('debug', _ => {
  orbitController.enabled = CONFIG.debug;
  shadowMapHelper.visible = CONFIG.debug;
  planeController.raycastPlane.visible = CONFIG.debug;
});
window.addEventListener('keydown', ev => {
  switch (ev.key) {
    case 'Escape':
      CONFIG.simulationOn = !CONFIG.simulationOn;
      break;

    case '1':
      CONFIG.cameraFov = 45;
      CONFIG.speed = 200;
      break;

    case '2':
      CONFIG.cameraFov = 50;
      CONFIG.speed = 400;
      break;

    case '3':
      CONFIG.cameraFov = 55;
      CONFIG.speed = 500;
      break;
  }
  document.body.style.cursor = CONFIG.simulationOn ? 'none' : 'auto';
})


/** Coleção dos objetos que se movem (planos e árvores)
 * @type {Translater[]} */
let translaters = []
const Z = new THREE.Vector3(0, 0, 1);

for (let i = 0; i < CONFIG.planeCount; ++i) {
  let ground = createGround(CONFIG.planeWidth, CONFIG.planeHeight, CONFIG.planeVerticalOffset);
  ground.material.transparent = true;

  let boxLeft = createCuboid(100, 100, 100)
  boxLeft.position.x += CONFIG.planeWidth / 2 + 50;

  let boxRight = boxLeft.clone();
  boxLeft.position.x -= CONFIG.planeWidth + 100;

  let holder = new THREE.Object3D();
  holder.add(boxLeft, ground, boxRight);
  holder.position.z = -CONFIG.planeHeight * i;

  let holderT = new Translater(Z, holder, 1400, opacityFog);
  holderT.startPoint.z = -1200;

  translaters.push(holderT);
}

for (let i = 0; i <= CONFIG.treeCount; ++i) {
  let tree = createTree()
  tree.material.transparent = true;

  tree.position.x = MathUtils.randFloatSpread(CONFIG.treeDistribution);
  tree.position.y = CONFIG.treeVerticalOffset;
  tree.position.z = MathUtils.randInt(-1200, 200);

  let translater = new Translater(Z, tree, 1400, opacityFog)
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

    camera.fov = MathUtils.lerp(camera.fov, CONFIG.cameraFov, 10 * dt)
    camera.updateProjectionMatrix();
  }

  renderer.render(scene, camera) // Render scene
}

let clock = new THREE.Clock();
render();