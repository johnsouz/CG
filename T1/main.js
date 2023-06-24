import * as THREE from 'three';
import { MathUtils } from 'three';

import {
  initCamera,
  onWindowResize,
} from "../libs/util/util.js";

import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';

import { CONFIG, TexLoader } from './utils.js';
import { createGround, createCuboid, importTurret } from './meshGenerators.js';
import { Translater, opacityFog } from './Translater.js';
import { PlaneController } from './PlaneController.js';
import { metal1, metal2 } from './textures.js';
import { World } from './world.js';

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

TexLoader.load('./textures/sky.jpg', texture => {
  let pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  let envMap = pmremGenerator.fromEquirectangular(texture).texture;
  
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = texture;
  scene.environment = envMap;

  pmremGenerator.dispose();
})

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

let planeGeometry = new THREE.PlaneGeometry(CONFIG.planeWidth, CONFIG.planeHeight);
let cube = new THREE.BoxGeometry(10, 10, 10);
for (let i = 0; i < CONFIG.planeCount; ++i) {
  // 0 __          __ 6
  //   1 |__ __ __| 5
  //      2  3  4
  let holder = new THREE.Object3D();

  let offsets = [
    [[-2.0, 1.0], [-Math.PI/2, 0,          0]],
    [[-1.5, 0.5], [-Math.PI/2, Math.PI/2,  0]],
    [[-1.0, 0.0], [-Math.PI/2, 0,          0]],
    [[0, 0],      [-Math.PI/2, 0,          0]],
    [[1.0, 0.0],  [-Math.PI/2, 0,          0]],
    [[1.5, 0.5],  [-Math.PI/2, -Math.PI/2, 0]],
    [[2.0, 1.0],  [-Math.PI/2, 0,          0]],
  ]

  for (let [[dx, dy], [x, y, z]] of offsets) {
    let mesh = new THREE.Mesh(planeGeometry, metal2.clone())
    mesh.receiveShadow = true;
    mesh.position.set(dx*CONFIG.planeWidth, dy*CONFIG.planeWidth + CONFIG.planeVerticalOffset);
    mesh.rotation.set(x,y,z);
    

    holder.add(mesh)
  }

  holder.position.z = i * CONFIG.planeHeight;
  let holderT = new Translater(Z, holder, 1400, opacityFog);
  holderT.startPoint.z = -1200;
  
  translaters.push(holderT);
}


/** @type {Object.<string, THREE.Object3D>} */
let turrets = World.turrets;

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

scene.add(...translaters.map(a => a.object));

const red = new THREE.Color( 0xff0000 );
const white = new THREE.Color( 0xffffff );
let turretBB = new THREE.Box3();

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

        // não a nescessidade de demais calculos com essa torreta, pois a mesma está 'morta',
        // saindo do loop
        continue;
      }

      // torreta capaz de atirar
      if (turret.position.z < -200 && turret.position.z > -800) {
        turret.material.color = red;
        turret.material.needsUpdate = true;
      } else {
        turret.material.color = white;
        turret.material.needsUpdate = true;
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