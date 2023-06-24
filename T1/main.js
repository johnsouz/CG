import * as THREE from 'three';
import { MathUtils } from 'three';

import {
  initCamera,
  onWindowResize,
} from "../libs/util/util.js";

import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';

import { CONFIG } from './utils.js';
import { createGround, createCuboid, importTurret } from './meshGenerators.js';
import { Translater, opacityFog } from './Translater.js';
import { PlaneController } from './PlaneController.js';
import { metal2 } from './textures.js';

// Create main scene
let scene = new THREE.Scene();

// Init a basic renderer
var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMapSoft = true;
renderer.shadowMap.width = 4096;
renderer.shadowMap.height = 4096;

document.getElementById("webgl-output").appendChild(renderer.domElement);

let camera = initCamera(CONFIG.cameraPos); // Init camera in this position
let light = new THREE.DirectionalLight('white', 1.6);
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
shadowMapHelper.visible = CONFIG.debug;
scene.add(light, ambient, light.target, shadowMapHelper);

// Listen window size changes
window.addEventListener('resize', _ => onWindowResize(camera, renderer));

let planeController = new PlaneController(scene, camera);
let orbitController = new OrbitControls(camera, renderer.domElement);
orbitController.enabled = CONFIG.debug;
document.body.style.cursor = CONFIG.debug ? 'auto' : 'none';

window.addEventListener('blur', _ => CONFIG.simulationOn = false);
window.addEventListener('debug', _ => {
  orbitController.enabled = CONFIG.debug;
  shadowMapHelper.visible = CONFIG.debug;
  planeController.raycastPlane.visible = CONFIG.debug;
});

//configuração de som, começando com trilha sonora
const audio = document.querySelector('#background-music');
audio.volume = 0.4;
window.addEventListener('keydown', ev => {
  switch (ev.key) {
    case 'Escape':
      if (CONFIG.simulationOn)
        audio.volume = 0.1;
      else
        audio.volume = 0.4;
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

    case 's':
      if (audio.paused)
        audio.play();
      else
        audio.pause();
      break;

  }
  document.body.style.cursor = CONFIG.simulationOn ? 'none' : 'auto';
})


/** Coleção dos objetos que se movem (planos e árvores)
 * @type {Translater[]} */
let translaters = []
const Z = new THREE.Vector3(0, 0, 1);

// Criação dos planos e cubos
for (let i = 0; i < CONFIG.planeCount; ++i) {
  let ground = createGround(CONFIG.planeWidth, CONFIG.planeHeight, CONFIG.planeVerticalOffset);
  ground.material.transparent = true;

  let boxLeft = createCuboid(100, 50, 100, metal2.clone())
  boxLeft.position.x += CONFIG.planeWidth / 2 + 50;
  boxLeft.position.y -= 25;

  let boxRight = boxLeft.clone();
  boxLeft.position.x -= CONFIG.planeWidth + 100;

  let holder = new THREE.Object3D();
  holder.add(boxLeft, ground, boxRight);
  holder.position.z = -CONFIG.planeHeight * i;

  let holderT = new Translater(Z, holder, 1400, opacityFog);
  holderT.startPoint.z = -1200;

  translaters.push(holderT);
}

/** @type {Object.<string, THREE.Object3D>} */
let turrets = {};

// Criação das torretas
for (let i = 0; i < CONFIG.turretCount; ++i) {
  let turret = importTurret(scene);
  turrets[turret.uuid] = turret;

  turret.position.x = MathUtils.randFloatSpread(CONFIG.turretDistribution);
  turret.position.y = CONFIG.turretVerticalOffset;
  turret.position.z = -300 * i;

  let translater = new Translater(Z, turret, 1400, opacityFog)
  translater.startPoint.z = -1200;

  translaters.push(translater);
}

/*
// Criação das arvores
let trees = [];
let treeTurretDistance = new THREE.Vector3();
for (let i = 0; i <= CONFIG.treeCount; ++i) {
  let tree = createTree()
  trees.push(tree);
  tree.material.transparent = true;

  for (;;) {
    tree.position.x = MathUtils.randFloatSpread(CONFIG.treeDistribution);
    tree.position.y = CONFIG.treeVerticalOffset;
    tree.position.z = MathUtils.randInt(-1200, 200);

    let clipping = false;
    for (let turret of Object.values(turrets)) {
      let dist = treeTurretDistance.subVectors(turret.position, tree.position).length();
      if (dist < 20)
        clipping = true;
    }

    if (!clipping)
      break;
  }

  let translater = new Translater(Z, tree, 1400, opacityFog)
  translater.startPoint.z = -1200

  translaters.push(translater);
}
*/

scene.add(...translaters.map(a => a.object));

function render() {
  requestAnimationFrame(render);
  let dt = clock.getDelta();
  dt = MathUtils.clamp(dt, 0, 1 / 60);

  if (CONFIG.simulationOn) {
    // planos, cubos e arvores
    translaters.forEach(obj => obj.update(dt));
    audio.volume = 0.4;
    // avião
    planeController.update(dt)

    // animação na mudança de velocidade
    camera.fov = MathUtils.lerp(camera.fov, CONFIG.cameraFov, 10 * dt)
    camera.updateProjectionMatrix();

    // lógica das colisões projétil-torretas
    let turretBB = new THREE.Box3();
    for (let turret of Object.values(turrets)) {

      // se a torreta estivar marcada como 'morta', acontece a animação
      if (turret.userData['dead']) {

        turret.position.y += -100 * dt;

        // a torreta 'resetará' quando a desaparecer por completo debaixo do chão
        if (turret.position.y < -75) {
          turret.userData['dead'] = false;

          turret.position.y = CONFIG.turretVerticalOffset;
          turret.position.z += -1400;
        }

        // não a nescessidade de checar colisões com essa torreta
        continue;
      }

      // calcula a AABB
      turretBB.setFromObject(turret)

      // checa todos os projéteis se estão dentro de alguma torreta
      // se sim, destroi o projetil e marca a torreta como 'morta'
      for (let [bulletKey, bullet] of Object.entries(planeController.bullets)) {
        if (turretBB.containsPoint(bullet.position)) {
          scene.remove(planeController.bullets[bulletKey]);
          delete planeController.bullets[bulletKey];

          turret.userData['dead'] = true;
        }
      }
    }
  }

  renderer.render(scene, camera) // Render scene
}

let clock = new THREE.Clock();
render();