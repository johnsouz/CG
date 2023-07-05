import * as THREE from "three";
import { props } from "./assets.js";
import { CONFIG } from "./config.js";
import { textureMetal2, turretModel } from "./assets.js";
import { Translater, opacityFog } from "./Translater.js";

export const World = {

  scene: {},

  /** Coleção dos objetos que se movem (planos e árvores)
   * @type {Translater[]} */
  translaters: [],

  /** @type {Object.<string, THREE.Mesh>} */
  turrets: {},

  /** @type {Object.<string, THREE.Mesh>} */
  playerBullets: {},

  /** @type {Object.<string, THREE.Mesh>} */
  enemyBullets: {}
};

export const AudioResources = {
  listener: new THREE.AudioListener(),

  /** @type {AudioBuffer} */
  blaster: undefined,
  /** @type {AudioBuffer} */
  background: undefined,
  /** @type {AudioBuffer} */
  turretBlaster: undefined,
};

let audioMap = [
  'The last battle.mp3', 'background',
  'X-wing blaster.mp3', 'blaster',
  'turretShoot.mp3', 'turretBlaster',
  'damage.mp3', 'hit',
  
]
let aloader = new THREE.AudioLoader()
for (let i = 0; i < audioMap.length; i += 2) {
  let filename = audioMap[i];
  let propriety = audioMap[i+1];

  aloader.load(filename, buffer => {
    AudioResources[propriety] = buffer;
  })
}


const Z = new THREE.Vector3(0, 0, 1);
export function createWorld() {

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

      // https://stackoverflow.com/questions/5915096
      let mesh = props[Math.floor(Math.random()*props.length)].clone();
      mesh.material = textureMetal2.clone();
      
      mesh.receiveShadow = true;
      mesh.position.set(dx*CONFIG.planeWidth, dy*CONFIG.planeWidth + CONFIG.planeVerticalOffset);
      mesh.rotation.set(x,y,z);
      
      holder.add(mesh)
    }

    holder.position.z = i * CONFIG.planeHeight;
    let holderT = new Translater(Z, holder, 1400, opacityFog);
    holderT.startPoint.z = -1200;
    
    World.translaters.push(holderT);
    World.scene.add(holder);
  }

  // Criação das torretas
  for (let i = 0; i < CONFIG.turretCount; ++i) {
    let turret = turretModel.clone();
    turret.material = turretModel.material.clone();

    World.turrets[turret.uuid] = turret;

    turret.position.x = THREE.MathUtils.randFloatSpread(CONFIG.turretDistribution);
    turret.position.y = CONFIG.turretVerticalOffset;
    turret.position.z = -300 * i;

    turret.userData['lastShot'] = Date.now();

    let translater = new Translater(Z, turret, 1400, opacityFog)
    translater.startPoint.z = -1200;

    World.translaters.push(translater);
  }

  World.scene.add(...World.translaters.map(a => a.object));
}
