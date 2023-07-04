import * as THREE from 'three';
import { MathUtils } from 'three';

import {
  initCamera,
  onWindowResize,
} from "../libs/util/util.js";

import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';

import { CONFIG, TexLoader, changeSpeed } from './utils.js';
import { importTurret, createBullet } from './meshGenerators.js';
import { Translater, opacityFog } from './Translater.js';
import { PlaneController } from './PlaneController.js';
import { metal2 } from './textures.js';
import { AudioResources, World } from './world.js';

// Create main scene
let scene = new THREE.Scene();

// Init a basic renderer
var renderer = new THREE.WebGLRenderer({ antialias: !CONFIG.isMobile });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMapSoft = true;
renderer.shadowMap.width = 4096;
renderer.shadowMap.height = 4096;

document.getElementById("webgl-output").appendChild(renderer.domElement);

let camera = initCamera(CONFIG.cameraPos); // Init camera in this position
camera.add(AudioResources.listener);
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

let boxHelper = new THREE.BoxHelper(planeController.object);
boxHelper.visible = CONFIG.debug;
scene.add(boxHelper);

window.addEventListener('blur', _ => CONFIG.simulationOn = false);
window.addEventListener('debug', _ => {
  orbitController.enabled = CONFIG.debug;
  shadowMapHelper.visible = CONFIG.debug;
  planeController.raycastPlane.visible = CONFIG.debug;
  boxHelper.visible = CONFIG.debug;
});

let audio = document.getElementById('background-music');
let startEvent = document.getElementById('startGame')
startEvent.addEventListener('pointerup', ev => {
  ev.stopPropagation();
  if (!CONFIG.loadedAssets) {
    return;
  }
  if (CONFIG.isMobile)
    planeController.createJoystick();

  startEvent.style.display = 'none';
  CONFIG.simulationOn = true;
  audio.play();
});

//configuração de som, começando com trilha sonora
window.addEventListener('keydown', ev => {
  changeSpeed(ev.key)
  switch (ev.key) {
    case 'Escape':
      if (CONFIG.simulationOn)
        audio.volume = 0.1;
      else
        audio.volume = 0.4;
      CONFIG.simulationOn = !CONFIG.simulationOn;
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

  turret.userData['lastShot'] = Date.now();

  let translater = new Translater(Z, turret, 1400, opacityFog)
  translater.startPoint.z = -1200;

  translaters.push(translater);
}

scene.add(...translaters.map(a => a.object));

let box = new THREE.Box3();
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
    boxHelper.update();

    // animação na mudança de velocidade
    camera.fov = MathUtils.lerp(camera.fov, CONFIG.cameraFov, 10 * dt)
    camera.updateProjectionMatrix();

    // Atualização das posiçoes dos projeteis
    for (let [key, bullet] of [...Object.entries(World.playerBullets), ...Object.entries(World.enemyBullets)]) {

      // avança o projétil
      bullet.translateZ(CONFIG.bulletSpeed * dt);

      // se o projetil estiver fora da AABB global, é removida da cena
      if (!CONFIG.bulletBoundingBox.containsPoint(bullet.position)) {
        scene.remove(bullet);
        delete World.playerBullets[key]
        delete World.enemyBullets[key]
      }
    }
    
    //#region lógica das colisões projétil-torretas
    for (let turret of Object.values(turrets)) {
      //#region se a torreta estivar marcada como 'morta', acontece a animação
      if (turret.userData['dead']) {

        turret.position.y += -100 * dt;

        // a torreta 'resetará' quando a desaparecer por completo debaixo do chão
        if (turret.position.y < -75) {
          turret.userData['dead'] = false;

          turret.position.y = CONFIG.turretVerticalOffset;
          turret.position.z += -1400;
        }
      }
      //#endregion

      //#region torreta capaz de atirar
      if (turret.position.z < -200 && turret.position.z > -800 && (Date.now() - turret.userData['lastShot'] > 3000)) {
        let bullet = createBullet(turret.position);
        bullet.lookAt(planeController.object.position);
        
        scene.add(bullet);
        turret.userData['lastShot'] = Date.now();
        
        World.enemyBullets[bullet.uuid] = bullet;
      }
      //#endregion
      
      //#region checa todos os projéteis se estão dentro de alguma torreta
      // se sim, destroi o projetil e marca a torreta como 'morta'
      let turretBB = box.setFromObject(turret)
      for (let [bulletKey, bullet] of Object.entries(World.playerBullets)) {
        if (turretBB.containsPoint(bullet.position)) {
          scene.remove(World.playerBullets[bulletKey]);
          delete World.playerBullets[bulletKey];

          turret.userData['dead'] = true;
        }
      }
      
      // a mesma coisa para as bullets inimigas
      let planeBB = box.setFromObject(planeController.object).expandByScalar(2);
      for (let [bulletKey, bullet] of Object.entries(World.enemyBullets)) {
        if (planeBB.containsPoint(bullet.position)) {
          scene.remove(World.enemyBullets[bulletKey])
          delete World.enemyBullets[bulletKey];
          
          planeController.health -= 1;
          console.log(planeController.health);
        }
      }
      //#endregion
    }
    //#endregion
  }

  renderer.render(scene, camera) // Render scene
}

let clock = new THREE.Clock();
render();